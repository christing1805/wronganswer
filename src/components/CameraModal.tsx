import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera(facingMode);

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async (mode: 'environment' | 'user') => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('当前浏览器不支持直接调用摄像头，请使用相册文件上传');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(e => console.warn('Video play error:', e));
      }
    } catch (err: any) {
      console.warn('Camera access failed:', err);
      // Fallback without facingMode constraint if mobile back camera failed
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        setStream(fallbackStream);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.play().catch(e => console.warn('Video play fallback error:', e));
        }
      } catch (fallbackErr: any) {
        setCameraError(
          fallbackErr.name === 'NotAllowedError'
            ? '摄像头权限已被拒绝。请在浏览器地址栏允许使用摄像头，或直接选择相册图片上传。'
            : fallbackErr.message || '无法启动摄像头，请使用相册上传'
        );
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleTakePhoto = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        onCapture(dataUrl);
        stopCamera();
        onClose();
      }
    } catch (err) {
      console.error('Failed to capture frame:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleToggleFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col relative text-white">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-stone-800/80 bg-stone-900/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">错题拍照扫描仪</h3>
              <p className="text-[11px] text-stone-400">将试卷或练习册上的错题居中对齐在方框内</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder */}
        <div className="relative bg-black min-h-[360px] sm:min-h-[440px] flex items-center justify-center overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center max-w-md space-y-3">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <p className="text-sm text-stone-300">{cameraError}</p>
              <p className="text-xs text-stone-500">
                提示：您可以直接关闭此窗口，使用“从相册选择”或拖拽上传图片
              </p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover max-h-[65vh]"
              />

              {/* Viewfinder Frame overlay */}
              <div className="absolute inset-8 sm:inset-12 border-2 border-amber-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-2 shadow-2xl">
                {/* 4 Corner Markers */}
                <div className="flex justify-between">
                  <div className="w-4 h-4 border-t-4 border-l-4 border-amber-400 -mt-1 -ml-1"></div>
                  <div className="w-4 h-4 border-t-4 border-r-4 border-amber-400 -mt-1 -mr-1"></div>
                </div>

                <div className="text-center">
                  <span className="bg-stone-900/70 text-amber-300 text-[11px] px-3 py-1 rounded-full backdrop-blur-xs font-mono">
                    请将题干、选项及图表置于框内
                  </span>
                </div>

                <div className="flex justify-between">
                  <div className="w-4 h-4 border-b-4 border-l-4 border-amber-400 -mb-1 -ml-1"></div>
                  <div className="w-4 h-4 border-b-4 border-r-4 border-amber-400 -mb-1 -mr-1"></div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Bar */}
        <div className="p-4 bg-stone-900/90 border-t border-stone-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleToggleFacingMode}
            disabled={!!cameraError}
            className="text-xs text-stone-300 hover:text-white px-3 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 transition-colors flex items-center gap-1.5 disabled:opacity-40"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            切换摄像头
          </button>

          <button
            type="button"
            onClick={handleTakePhoto}
            disabled={!!cameraError || isCapturing}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm shadow-lg shadow-amber-500/30 flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Camera className="w-4 h-4" />
            <span>拍照识别</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-xs text-stone-400 hover:text-stone-200 px-3 py-2 rounded-lg"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};
