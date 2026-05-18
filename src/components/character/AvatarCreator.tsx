import { useState, useRef, useCallback } from 'react';

interface AvatarCreatorProps {
  onAvatarCreated: (photoData: string | null) => void;
  onSkip: () => void;
}

export default function AvatarCreator({ onAvatarCreated, onSkip }: AvatarCreatorProps) {
  const [mode, setMode] = useState<'choose' | 'camera' | 'preview'>('choose');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 300 }, height: { ideal: 300 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOn(true);
        setMode('camera');
      }
    } catch (err) {
      const msg = err instanceof DOMException
        ? err.name === 'NotAllowedError'  ? '카메라 권한이 거부됐어요. 브라우저 설정에서 허용해 주세요.'
        : err.name === 'NotFoundError'    ? '카메라를 찾을 수 없어요.'
        : err.name === 'NotSupportedError'? 'HTTPS 환경에서만 카메라를 사용할 수 있어요.'
        : '카메라를 시작할 수 없어요.'
        : '카메라를 사용할 수 없어요.';
      setCameraError(msg);
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setIsCameraOn(false);
    }
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 300;
    canvas.height = 300;

    ctx.save();
    // 원형 클리핑
    ctx.beginPath();
    ctx.arc(150, 150, 150, 0, Math.PI * 2);
    ctx.clip();

    // 비디오 프레임 캡처 (좌우 반전)
    ctx.translate(300, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0, 300, 300);
    ctx.restore();

    // 조선풍 테두리 효과
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

    // 원형 클리핑
    ctx.beginPath();
    ctx.arc(150, 150, 150, 0, Math.PI * 2);
    ctx.clip();

    // 이미지 가운데 맞추기 (정사각형 크롭)
    const size = Math.min(imgEl.naturalWidth, imgEl.naturalHeight);
    const sx = (imgEl.naturalWidth  - size) / 2;
    const sy = (imgEl.naturalHeight - size) / 2;
    ctx.drawImage(imgEl, sx, sy, size, size, 0, 0, 300, 300);

    ctx.restore();

    // 조선풍 테두리
    ctx.strokeStyle = '#F39C12';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(150, 150, 145, 0, Math.PI * 2);
    ctx.stroke();

    try {
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch {
      return null;
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 검사
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
      if (!src) {
        setIsProcessing(false);
        setUploadError('파일을 읽지 못했어요.');
        return;
      }

      const img = new Image();
      img.onerror = () => {
        setIsProcessing(false);
        setUploadError('이미지를 불러올 수 없어요. HEIC 파일은 JPEG로 변환 후 시도해 보세요.');
      };
      img.onload = () => {
        const dataUrl = processImageToCanvas(img);
        setIsProcessing(false);
        if (!dataUrl) {
          setUploadError('이미지 처리에 실패했어요. 다른 사진을 시도해 보세요.');
          return;
        }
        setCapturedPhoto(dataUrl);
        setMode('preview');
      };
      img.src = src;
    };
    reader.readAsDataURL(file);

    // input 초기화 (같은 파일 재선택 가능하도록)
    e.target.value = '';
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <canvas ref={canvasRef} className="hidden" />

      <div className="text-center">
        <div className="text-4xl mb-2">🎭</div>
        <h2 className="text-2xl font-bold text-joseon-dark">내 캐릭터 만들기</h2>
        <p className="text-joseon-brown mt-1 text-sm">사진으로 나만의 조선 아바타를 만들어요!</p>
      </div>

      {/* ── 선택 화면 ── */}
      {mode === 'choose' && (
        <div className="flex flex-col gap-3 w-full max-w-xs">

          {/* 카메라 오류 메시지 */}
          {cameraError && (
            <div className="bg-red-50 border border-red-300 rounded-xl p-3 text-sm text-red-700 text-center">
              📵 {cameraError}
              <button
                onClick={() => setCameraError(null)}
                className="block mx-auto mt-1 text-xs text-red-500 underline"
              >
                닫기
              </button>
            </div>
          )}

          {/* 업로드 오류 메시지 */}
          {uploadError && (
            <div className="bg-orange-50 border border-orange-300 rounded-xl p-3 text-sm text-orange-700 text-center">
              ⚠️ {uploadError}
              <button
                onClick={() => setUploadError(null)}
                className="block mx-auto mt-1 text-xs text-orange-500 underline"
              >
                닫기
              </button>
            </div>
          )}

          <button
            onClick={startCamera}
            className="btn-joseon text-lg py-4 flex items-center justify-center gap-2"
          >
            📷 사진 찍기
          </button>

          <label className="btn-gold text-lg py-4 flex items-center justify-center gap-2 cursor-pointer rounded-lg relative">
            {isProcessing ? (
              <>
                <span className="animate-spin">⏳</span> 처리 중...
              </>
            ) : (
              <>🖼️ 사진 불러오기</>
            )}
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

          <button
            onClick={onSkip}
            className="text-joseon-brown underline text-sm mt-2 hover:text-joseon-dark transition-colors"
          >
            사진 없이 기본 캐릭터로 시작하기
          </button>
        </div>
      )}

      {/* ── 카메라 화면 ── */}
      {mode === 'camera' && isCameraOn && (
        <div className="flex flex-col items-center gap-4">
          <div
            className="relative rounded-full overflow-hidden border-4 border-joseon-gold"
            style={{ width: 240, height: 240 }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={capturePhoto} className="btn-joseon px-8 py-3 text-xl">
              📸 찍기!
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
          <div className="flex gap-3">
            <button
              onClick={() => onAvatarCreated(capturedPhoto)}
              className="btn-joseon px-8 py-3"
            >
              👍 이걸로 할게요!
            </button>
            <button
              onClick={() => { setCapturedPhoto(null); setMode('choose'); }}
              className="btn-gold px-6 py-3"
            >
              다시 찍기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
