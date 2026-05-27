import { useState, useRef, useCallback, useEffect } from 'react';
import type { CharacterConfig } from '../../types/character';
import { isClaudeFeaturesEnabled } from '../../services/claudeFeatureFlag';

interface AvatarCreatorProps {
  onAvatarCreated: (photoData: string | null) => void;
  onCharacterCreated?: (config: CharacterConfig) => void;
  onSkip: () => void;
}

export default function AvatarCreator({ onAvatarCreated, onCharacterCreated, onSkip }: AvatarCreatorProps) {
  const claudeFeaturesEnabled = isClaudeFeaturesEnabled();
  const photoStartLabel = claudeFeaturesEnabled ? '📸 사진 그대로 사용' : '📸 이 사진으로 시작';
  const aiPreviewNotice = '자동 꾸미기는 출시 준비 중이에요. 지금은 사진으로 바로 시작할 수 있어요.';
  const [mode, setMode] = useState<'choose' | 'camera' | 'preview' | 'converting' | 'converted'>('choose');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiCharacter, setAiCharacter] = useState<CharacterConfig | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const [videoReady, setVideoReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingStreamRef = useRef<MediaStream | null>(null);
  const isStartingCameraRef = useRef(false); // 더블클릭 중복 실행 방지

  // ── 카메라 모드로 전환되면 스트림 연결 ──
  // video 요소는 항상 DOM에 있지만 mode=camera일 때만 보임
  // startCamera에서 스트림 획득 → pendingStreamRef에 저장 → mode='camera' 설정
  // useEffect에서 video 요소에 srcObject 연결 + play() 명시 호출
  useEffect(() => {
    if (mode === 'camera' && pendingStreamRef.current && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = pendingStreamRef.current;
      streamRef.current = pendingStreamRef.current;
      pendingStreamRef.current = null;
      // autoPlay 속성만으로는 동적 srcObject 설정 후 재생이 안 될 수 있어 명시 호출
      video.play().catch(() => {/* 자동재생 차단은 무시 */});
    }
  }, [mode]);

  // ── 카메라: 점진적 제약 조건으로 시도 ──
  const startCamera = async () => {
    // 더블클릭 중복 실행 방지
    if (isStartingCameraRef.current) return;
    isStartingCameraRef.current = true;

    setCameraError(null);

    // navigator.mediaDevices가 없는 환경 (HTTP 비localhost) 처리
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('이 환경에서는 카메라를 사용할 수 없어요. HTTPS 또는 localhost에서 접속해 주세요.');
      return;
    }

    const constraintsList = [
      { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } } },
      { video: { facingMode: { ideal: 'user' } } },
      { video: { facingMode: 'user' } },
      { video: true },
    ];

    let stream: MediaStream | null = null;
    let lastError: unknown = null;

    for (const constraints of constraintsList) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        break; // 성공하면 중단
      } catch (err) {
        lastError = err;
        // 권한 거부면 더 시도해도 소용없음
        if (err instanceof DOMException && err.name === 'NotAllowedError') break;
      }
    }

    if (!stream) {
      // 모든 시도 실패
      const err = lastError;
      let msg = '카메라를 시작할 수 없어요.';
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError')      msg = '카메라 권한이 거부됐어요. 브라우저 설정에서 허용해 주세요.';
        else if (err.name === 'NotFoundError')    msg = '카메라를 찾을 수 없어요.';
        else if (err.name === 'NotSupportedError') msg = 'HTTPS 환경에서만 카메라를 사용할 수 있어요.';
        else if (err.name === 'NotReadableError')  msg = '카메라가 다른 앱에서 사용 중이에요. 닫고 다시 시도해 보세요.';
        else if (err.name === 'OverconstrainedError') msg = '카메라를 인식할 수 없어요. 사진 불러오기를 이용해 주세요.';
      }
      setCameraError(msg);
      isStartingCameraRef.current = false;
      return;
    }

    // 스트림 획득 성공 → pendingStreamRef에 임시 보관 후 mode 전환
    // useEffect가 mode='camera' 감지 후 video.srcObject 연결
    pendingStreamRef.current = stream;
    setVideoReady(false); // 새 스트림이므로 준비 상태 초기화
    setMode('camera');
    isStartingCameraRef.current = false;
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (pendingStreamRef.current) {
      pendingStreamRef.current.getTracks().forEach(t => t.stop());
      pendingStreamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // 컴포넌트 언마운트 시 카메라 정리
  useEffect(() => () => stopCamera(), [stopCamera]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;

    // 비디오 프레임이 아직 준비되지 않았으면 찍지 않음
    if (!video.videoWidth || !video.videoHeight) {
      setCameraError('카메라가 아직 준비 중이에요. 잠시 후 다시 눌러보세요.');
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 실제 비디오 해상도 사용
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const size = Math.min(vw, vh);
    const sx = (vw - size) / 2;
    const sy = (vh - size) / 2;

    canvas.width = 300;
    canvas.height = 300;

    ctx.save();
    ctx.beginPath();
    ctx.arc(150, 150, 150, 0, Math.PI * 2);
    ctx.clip();
    // 좌우 반전 (셀카 미러)
    ctx.translate(300, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 300, 300);
    ctx.restore();

    // 조선풍 금테
    ctx.strokeStyle = '#F39C12';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(150, 150, 145, 0, Math.PI * 2);
    ctx.stroke();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedPhoto(dataUrl);
    stopCamera();
    setMode('preview');
  };

  const processImageToCanvas = useCallback((imgEl: HTMLImageElement): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = 300;
    canvas.height = 300;
    ctx.save();
    ctx.beginPath();
    ctx.arc(150, 150, 150, 0, Math.PI * 2);
    ctx.clip();
    const size = Math.min(imgEl.naturalWidth, imgEl.naturalHeight);
    const sx = (imgEl.naturalWidth  - size) / 2;
    const sy = (imgEl.naturalHeight - size) / 2;
    ctx.drawImage(imgEl, sx, sy, size, size, 0, 0, 300, 300);
    ctx.restore();

    ctx.strokeStyle = '#F39C12';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(150, 150, 145, 0, Math.PI * 2);
    ctx.stroke();

    try { return canvas.toDataURL('image/jpeg', 0.85); }
    catch { return null; }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('이미지 파일만 업로드할 수 있어요.');
      return;
    }

    setUploadError(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onerror = () => {
      setIsProcessing(false);
      setUploadError('파일을 읽을 수 없어요. 다른 사진을 시도해 보세요.');
    };
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      if (!src) { setIsProcessing(false); setUploadError('파일을 읽지 못했어요.'); return; }

      const img = new Image();
      img.onerror = () => {
        setIsProcessing(false);
        setUploadError('이미지를 불러올 수 없어요. HEIC 파일은 JPEG로 변환 후 업로드해 주세요.');
      };
      img.onload = () => {
        const dataUrl = processImageToCanvas(img);
        setIsProcessing(false);
        if (!dataUrl) { setUploadError('이미지 처리에 실패했어요. 다른 사진을 시도해 보세요.'); return; }
        setCapturedPhoto(dataUrl);
        setMode('preview');
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── AI 이모지 변환 ──
  const handleAiConvert = async () => {
    if (!capturedPhoto || !claudeFeaturesEnabled) return;
    setAiError(null);
    setMode('converting');

    try {
      const { analyzePhotoToCharacter } = await import('../../services/avatarAiService');
      const config = await analyzePhotoToCharacter(capturedPhoto);
      if (!config) {
        setAiError('자동 꾸미기를 마치지 못했어요. 원본 사진으로 바로 시작할 수 있어요.');
        setMode('preview');
        return;
      }
      setAiCharacter(config);
      setMode('converted');
    } catch (e) {
      console.error('AI 변환 오류:', e);
      setAiError('자동 꾸미기를 잠시 마치지 못했어요. 원본 사진으로 바로 시작할 수 있어요.');
      setMode('preview');
    }
  };

  const isCameraMode = mode === 'camera';

  // ── 렌더링 ──
  return (
    <div className="flex flex-col items-center gap-6 p-6">
      {/* canvas는 항상 hidden으로 DOM에 존재 */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ★ video는 항상 DOM에 존재해야 함 (ref가 null이 되면 srcObject 설정 불가) */}
      <div
        className={isCameraMode ? 'flex flex-col items-center gap-4' : 'hidden'}
      >
        <div
          className="rounded-full overflow-hidden border-4 border-joseon-gold"
          style={{ width: 240, height: 240 }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
            onCanPlay={() => setVideoReady(true)}
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={capturePhoto}
            disabled={!videoReady}
            className={`btn-joseon px-8 py-3 text-xl transition-opacity ${!videoReady ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {videoReady ? '📸 찍기!' : '⏳ 준비 중...'}
          </button>
          <button
            onClick={() => { stopCamera(); setMode('choose'); }}
            className="btn-gold px-6 py-3"
          >
            취소
          </button>
        </div>
        <p className="text-joseon-brown text-sm">카메라를 보고 찍어보세요 😊</p>
      </div>

      {/* 카메라 모드가 아닐 때 나머지 UI */}
      {!isCameraMode && (
        <>
          <div className="text-center">
            <div className="text-4xl mb-2">🎭</div>
            <h2 className="text-2xl font-bold text-joseon-dark">내 캐릭터 만들기</h2>
            <p className="text-joseon-brown mt-1 text-sm">사진으로 나만의 조선 아바타를 만들어요!</p>
          </div>

          {/* ── 선택 화면 ── */}
          {mode === 'choose' && (
            <div className="flex flex-col gap-3 w-full max-w-xs">
              {cameraError && (
                <div className="bg-red-50 border border-red-300 rounded-xl p-3 text-sm text-red-700 text-center">
                  📵 {cameraError}
                  <button onClick={() => setCameraError(null)} className="block mx-auto mt-1 text-xs text-red-500 underline">닫기</button>
                </div>
              )}
              {uploadError && (
                <div className="bg-orange-50 border border-orange-300 rounded-xl p-3 text-sm text-orange-700 text-center">
                  ⚠️ {uploadError}
                  <button onClick={() => setUploadError(null)} className="block mx-auto mt-1 text-xs text-orange-500 underline">닫기</button>
                </div>
              )}

              <button onClick={startCamera} className="btn-joseon text-lg py-4 flex items-center justify-center gap-2">
                📷 사진 찍기
              </button>

              <label className="btn-gold text-lg py-4 flex items-center justify-center gap-2 cursor-pointer rounded-lg relative">
                {isProcessing
                  ? <><span className="animate-spin">⏳</span> 처리 중...</>
                  : <>🖼️ 사진 불러오기</>
                }
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isProcessing}
                />
              </label>
              <p className="text-joseon-brown text-xs text-center opacity-70 -mt-1">
                JPG · PNG · WEBP 지원 / iPhone HEIC은 JPEG로 변환 후 업로드
              </p>

              <button onClick={onSkip} className="text-joseon-brown underline text-sm mt-2 hover:text-joseon-dark transition-colors">
                사진 없이 기본 캐릭터로 시작하기
              </button>
            </div>
          )}

          {/* ── 미리보기 화면 ── */}
          {mode === 'preview' && capturedPhoto && (
            <div className="flex flex-col items-center gap-4">
              <div className="text-center">
                <p className="text-joseon-brown mb-3 font-medium">조선시대 나의 모습 ✨</p>
                <img
                  src={capturedPhoto}
                  alt="캡처된 사진"
                  className="rounded-full border-4 border-joseon-gold"
                  style={{ width: 200, height: 200 }}
                />
              </div>

              {aiError && (
                <div className="bg-orange-50 border border-orange-300 rounded-xl p-3 text-sm text-orange-700 text-center max-w-xs">
                  ⚠️ {aiError}
                </div>
              )}

              <div className="flex flex-col gap-2 w-full max-w-xs">
                {claudeFeaturesEnabled ? (
                  <>
                    <button
                      onClick={handleAiConvert}
                      className="btn-joseon px-6 py-3 flex items-center justify-center gap-2 text-base"
                    >
                      🤖 AI 이모지로 변환하기
                    </button>
                    <p className="text-joseon-brown text-xs text-center opacity-70">사진을 분석해 조선 캐릭터를 자동으로 만들어요</p>
                  </>
                ) : (
                  <div className="rounded-xl border border-joseon-gold/40 bg-joseon-gold/10 px-4 py-3 text-center text-sm text-joseon-brown">
                    {aiPreviewNotice}
                  </div>
                )}

                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => onAvatarCreated(capturedPhoto)}
                    className={`${claudeFeaturesEnabled ? 'btn-gold' : 'btn-joseon'} flex-1 py-3 text-sm`}
                  >
                    {photoStartLabel}
                  </button>
                  <button
                    onClick={() => { setCapturedPhoto(null); setMode('choose'); }}
                    className="flex-1 py-3 text-sm border-2 border-joseon-brown text-joseon-brown rounded-lg hover:bg-joseon-bg transition-colors"
                  >
                    다시 찍기
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── AI 변환 중 ── */}
          {mode === 'converting' && (
            <div className="flex flex-col items-center gap-5 py-8">
              <div className="text-6xl animate-bounce">🤖</div>
              <div className="text-center">
                <p className="text-joseon-dark font-bold text-lg">AI가 분석 중이에요...</p>
                <p className="text-joseon-brown text-sm mt-1">사진에서 조선 캐릭터를 만들고 있어요</p>
              </div>
              <div className="flex gap-2">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-3 h-3 rounded-full bg-joseon-gold animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {/* ── AI 변환 완료 ── */}
          {mode === 'converted' && aiCharacter && capturedPhoto && (
            <div className="flex flex-col items-center gap-4">
              <div className="text-center">
                <p className="text-joseon-dark font-bold mb-1">✨ AI 캐릭터 완성!</p>
                <p className="text-joseon-brown text-sm mb-3">사진을 분석해서 조선 캐릭터를 만들었어요</p>

                <div className="flex gap-4 items-center justify-center">
                  <div className="text-center">
                    <img
                      src={capturedPhoto}
                      alt="원본 사진"
                      className="rounded-full border-4 border-joseon-brown opacity-80"
                      style={{ width: 90, height: 90 }}
                    />
                    <p className="text-xs text-joseon-brown mt-1">원본</p>
                  </div>

                  <div className="text-2xl text-joseon-gold">→</div>

                  <div className="text-center">
                    <div
                      className="rounded-full border-4 border-joseon-gold flex items-center justify-center overflow-hidden"
                      style={{ width: 90, height: 90, background: 'linear-gradient(to bottom, #FFF8DC, #F5DEB3)' }}
                    >
                      <CharacterEmoji config={aiCharacter} />
                    </div>
                    <p className="text-xs text-joseon-brown mt-1">AI 이모지</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full max-w-xs">
                <button
                  onClick={() => {
                    if (onCharacterCreated) {
                      onCharacterCreated(aiCharacter);
                    } else {
                      // onCharacterCreated 미전달 시 원본 사진으로 폴백
                      onAvatarCreated(capturedPhoto);
                    }
                  }}
                  className="btn-joseon px-8 py-3 text-base"
                >
                  🎭 이 캐릭터로 시작!
                </button>
                <button
                  onClick={() => onAvatarCreated(capturedPhoto)}
                  className="btn-gold px-6 py-3 text-sm"
                >
                  📸 원본 사진 사용하기
                </button>
                <button
                  onClick={() => { setAiCharacter(null); setAiError(null); setMode('preview'); }}
                  className="text-joseon-brown underline text-sm"
                >
                  다시 시도하기
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── AI 캐릭터 이모지 미리보기 (간단한 SVG) ──
function CharacterEmoji({ config }: { config: CharacterConfig }) {
  const skinMap: Record<string, string> = {
    skin1: '#FFEFD5', skin2: '#F4C49A', skin3: '#D4956A', skin4: '#A0694A', skin5: '#5C3A1E',
  };
  const hairMap: Record<string, string> = {
    black: '#1A0F0A', brown: '#5C3317', darkbrown: '#3B1A0A', auburn: '#8B2500', gray: '#7D7D7D', white: '#F0EEE6',
  };
  const outfitMap: Record<string, string> = {
    brown: '#8B6544', navy: '#2C3E7A', white: '#F5F0E8', blue: '#3A7BD5',
    red: '#C0392B', gold: '#D4AF37', green: '#2D7D46', purple: '#6A3AA5',
  };

  const skin   = skinMap[config.skinTone]    ?? '#F4C49A';
  const hair   = hairMap[config.hairColor]   ?? '#1A0F0A';
  const outfit = outfitMap[config.outfitColor] ?? '#8B6544';

  const eyeRx = config.eyeStyle === 'sharp' ? 4 : 5;
  const eyeRy = config.eyeStyle === 'droopy' ? 3 : config.eyeStyle === 'sparkle' ? 5 : 4;
  const mouthD = config.mouthStyle === 'smile'   ? 'M28,44 Q32,49 36,44'
               : config.mouthStyle === 'grin'    ? 'M26,43 Q32,51 38,43'
               : config.mouthStyle === 'pout'    ? 'M28,46 Q32,43 36,46'
               : 'M28,44 L36,44';

  return (
    <svg width="72" height="72" viewBox="0 0 64 64">
      {/* 머리카락 (뒤) */}
      {config.hairStyle !== 'shaved' && (
        <ellipse cx="32" cy="14" rx="19" ry="11" fill={hair} />
      )}
      {/* 얼굴 */}
      <ellipse cx="32" cy="30" rx="17" ry="19" fill={skin} />
      {/* 머리카락 앞 */}
      {config.hairStyle === 'topknot' && <ellipse cx="32" cy="7" rx="5" ry="7" fill={hair} />}
      {config.hairStyle === 'long' && <>
        <rect x="14" y="32" width="5" height="16" rx="2.5" fill={hair} />
        <rect x="45" y="32" width="5" height="16" rx="2.5" fill={hair} />
      </>}
      {config.hairStyle === 'bob' && <>
        <rect x="13" y="28" width="5" height="10" rx="2.5" fill={hair} />
        <rect x="46" y="28" width="5" height="10" rx="2.5" fill={hair} />
      </>}
      {/* 눈 */}
      <ellipse cx="24" cy="28" rx={eyeRx} ry={eyeRy} fill={config.eyeColor || '#1A0F0A'} />
      <ellipse cx="40" cy="28" rx={eyeRx} ry={eyeRy} fill={config.eyeColor || '#1A0F0A'} />
      {config.eyeStyle === 'sparkle' && <>
        <circle cx="26" cy="26" r="1.5" fill="white" opacity="0.85" />
        <circle cx="42" cy="26" r="1.5" fill="white" opacity="0.85" />
      </>}
      {/* 코 */}
      <ellipse cx="32" cy="34" rx="2" ry="1.5" fill={skin === '#FFEFD5' ? '#E8C08A' : '#8B5B3A'} opacity="0.4" />
      {/* 입 */}
      <path d={mouthD} stroke="#7B3A2A" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* 옷 */}
      <path d="M14,52 Q32,57 50,52 L48,64 L16,64 Z" fill={outfit} />
      {/* 옷 깃 */}
      <line x1="32" y1="52" x2="32" y2="64" stroke={outfit === '#F5F0E8' ? '#D4C9B0' : 'white'} strokeWidth="1.5" opacity="0.6" />
      {/* 모자 */}
      {config.hat === 'gat' && <ellipse cx="32" cy="9" rx="23" ry="4" fill="#1A1A1A" />}
      {config.hat === 'crown' && <path d="M20,13 L24,4 L32,9 L40,4 L44,13 Z" fill="#D4AF37" />}
      {config.hat === 'headband' && <rect x="13" y="17" width="38" height="5" rx="2.5" fill="#C0392B" />}
      {config.hat === 'bamboohat' && <ellipse cx="32" cy="11" rx="25" ry="6" fill="#8B7355" />}
    </svg>
  );
}
