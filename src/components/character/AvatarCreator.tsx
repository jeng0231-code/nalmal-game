import { useState, useRef, useCallback } from 'react';

interface AvatarCreatorProps {
  onAvatarCreated: (photoData: string | null) => void;
  onSkip: () => void;
}

export default function AvatarCreator({ onAvatarCreated, onSkip }: AvatarCreatorProps) {
  const [mode, setMode] = useState<'choose' | 'camera' | 'preview'>('choose');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 300, height: 300 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOn(true);
        setMode('camera');
      }
    } catch {
      alert('카메라를 사용할 수 없습니다. 기본 캐릭터를 사용할게요!');
      onSkip();
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

    // 원형 클리핑
    ctx.beginPath();
    ctx.arc(150, 150, 150, 0, Math.PI * 2);
    ctx.clip();

    // 비디오 프레임 캡처 (좌우 반전)
    ctx.save();
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = 300;
        canvas.height = 300;

        // 원형 클리핑
        ctx.beginPath();
        ctx.arc(150, 150, 150, 0, Math.PI * 2);
        ctx.clip();

        // 이미지 가운데 맞추기
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;
        ctx.drawImage(img, x, y, size, size, 0, 0, 300, 300);

        // 조선풍 테두리
        ctx.strokeStyle = '#F39C12';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(150, 150, 145, 0, Math.PI * 2);
        ctx.stroke();

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedPhoto(dataUrl);
        setMode('preview');
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <canvas ref={canvasRef} className="hidden" />

      <div className="text-center">
        <div className="text-4xl mb-2">🎭</div>
        <h2 className="text-2xl font-bold text-joseon-dark">내 캐릭터 만들기</h2>
        <p className="text-joseon-brown mt-1">사진을 찍어서 나만의 조선 캐릭터를 만들어요!</p>
      </div>

      {mode === 'choose' && (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={startCamera} className="btn-joseon text-lg py-4 flex items-center justify-center gap-2">
            📷 사진 찍기
          </button>

          <label className="btn-gold text-lg py-4 flex items-center justify-center gap-2 cursor-pointer rounded-lg">
            🖼️ 사진 불러오기
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={onSkip}
            className="text-joseon-brown underline text-sm mt-2 hover:text-joseon-dark transition-colors"
          >
            사진 없이 기본 캐릭터로 시작하기
          </button>
        </div>
      )}

      {mode === 'camera' && isCameraOn && (
        <div className="flex flex-col items-center gap-4">
          <div className="relative rounded-full overflow-hidden border-4 border-joseon-gold"
            style={{ width: 240, height: 240 }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
          </div>
          <div className="flex gap-3">
            <button onClick={capturePhoto} className="btn-joseon px-8 py-3 text-xl">
              📸 찍기!
            </button>
            <button onClick={() => { stopCamera(); setMode('choose'); }}
              className="btn-gold px-6 py-3">
              취소
            </button>
          </div>
          <p className="text-joseon-brown text-sm">카메라를 보고 찍어보세요 😊</p>
        </div>
      )}

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
            <button onClick={() => onAvatarCreated(capturedPhoto)} className="btn-joseon px-8 py-3">
              👍 이걸로 할게요!
            </button>
            <button onClick={() => { setCapturedPhoto(null); setMode('choose'); }}
              className="btn-gold px-6 py-3">
              다시 찍기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
