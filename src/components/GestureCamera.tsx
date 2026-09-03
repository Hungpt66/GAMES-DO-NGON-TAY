import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw, Hand, Maximize2, Minimize2, CheckCircle2 } from 'lucide-react';
import { analyzeHandLandmarks, drawHandOnCanvas, GestureDetectionResult } from '../utils/gestureDetector';
import { SoundManager } from '../utils/audio';

interface GestureCameraProps {
  onOptionLocked?: (option: 'A' | 'B' | 'C' | 'D') => void;
  disabled?: boolean;
  highlightOption?: 'A' | 'B' | 'C' | 'D' | null;
  mode?: 'compact' | 'full';
}

const HOLD_TIME_REQUIRED_MS = 1000; // Hold gesture for 1 second to confirm selection

export const GestureCamera: React.FC<GestureCameraProps> = ({
  onOptionLocked,
  disabled = false,
  highlightOption,
  mode = 'compact',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentGesture, setCurrentGesture] = useState<GestureDetectionResult | null>(null);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [lockedOption, setLockedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);

  // Tracking state for holding the same gesture
  const lastCandidateRef = useRef<'A' | 'B' | 'C' | 'D' | null>(null);
  const candidateStartTimeRef = useRef<number>(0);
  const isLockedRef = useRef<boolean>(false);
  const animationFrameIdRef = useRef<number | null>(null);
  const handsModelRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start webcam and initialize MediaPipe Hands
  const startCamera = useCallback(async () => {
    setErrorMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ truy cập Camera');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 480 },
          height: { ideal: 360 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setHasPermission(true);

      // Check if MediaPipe Hands is loaded on window
      const win = window as any;
      if (win.Hands) {
        const hands = new win.Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        hands.onResults((results: any) => {
          if (!canvasRef.current || !videoRef.current) return;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          canvas.width = videoRef.current.videoWidth || 480;
          canvas.height = videoRef.current.videoHeight || 360;

          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const rawLandmarks = results.multiHandLandmarks[0];
            // Normalize landmarks if needed
            const analyzed = analyzeHandLandmarks(rawLandmarks);
            setCurrentGesture(analyzed);

            drawHandOnCanvas(ctx, rawLandmarks, canvas.width, canvas.height, analyzed.detectedOption);

            // Handle hold-to-confirm logic
            handleGestureEvaluation(analyzed.detectedOption);
          } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setCurrentGesture(null);
            handleGestureEvaluation(null);
          }
        });

        handsModelRef.current = hands;

        // Start processing video loop
        const processFrame = async () => {
          if (
            handsModelRef.current &&
            videoRef.current &&
            videoRef.current.readyState >= 2 &&
            !videoRef.current.paused
          ) {
            try {
              await handsModelRef.current.send({ image: videoRef.current });
            } catch (err) {
              console.warn('Frame send warning:', err);
            }
          }
          animationFrameIdRef.current = requestAnimationFrame(processFrame);
        };

        animationFrameIdRef.current = requestAnimationFrame(processFrame);
      } else {
        // Fallback simple simulation or warning if CDN is still loading
        setErrorMessage('Đang tải mô hình nhận diện cử chỉ MediaPipe...');
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setHasPermission(false);
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Bạn đã từ chối quyền truy cập Camera. Hãy cấp quyền để dùng cử chỉ tay, hoặc bấm chọn đáp án trực tiếp.'
          : 'Không thể kết nối Camera. Bạn vẫn có thể bấm chuột/chạm để chọn đáp án!'
      );
    }
  }, []);

  // Hold gesture evaluation
  const handleGestureEvaluation = (option: 'A' | 'B' | 'C' | 'D' | null) => {
    if (disabled || isLockedRef.current) return;

    const now = Date.now();

    if (!option) {
      lastCandidateRef.current = null;
      candidateStartTimeRef.current = 0;
      setHoldProgress(0);
      return;
    }

    if (lastCandidateRef.current === option) {
      const elapsed = now - candidateStartTimeRef.current;
      const progress = Math.min(100, Math.round((elapsed / HOLD_TIME_REQUIRED_MS) * 100));
      setHoldProgress(progress);

      if (elapsed >= HOLD_TIME_REQUIRED_MS && !isLockedRef.current) {
        // Confirmed!
        isLockedRef.current = true;
        setLockedOption(option);
        SoundManager.playGestureLock();
        if (onOptionLocked) {
          onOptionLocked(option);
        }
      }
    } else {
      // Changed gesture, start new candidate timer
      lastCandidateRef.current = option;
      candidateStartTimeRef.current = now;
      setHoldProgress(0);
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (handsModelRef.current) {
        try {
          handsModelRef.current.close();
        } catch {
          // ignore
        }
      }
    };
  }, [startCamera]);

  // Reset lock state when disabled state changes (e.g. moving to next question)
  useEffect(() => {
    if (!disabled) {
      isLockedRef.current = false;
      setLockedOption(null);
      setHoldProgress(0);
      lastCandidateRef.current = null;
      candidateStartTimeRef.current = 0;
    }
  }, [disabled]);

  const activeOption = lockedOption || highlightOption || currentGesture?.detectedOption;

  const getOptionBadgeColor = (opt: string | null) => {
    switch (opt) {
      case 'A':
        return 'bg-blue-600 text-white border-blue-500 ring-4 ring-blue-300';
      case 'B':
        return 'bg-emerald-600 text-white border-emerald-500 ring-4 ring-emerald-300';
      case 'C':
        return 'bg-amber-500 text-white border-amber-400 ring-4 ring-amber-300';
      case 'D':
        return 'bg-pink-600 text-white border-pink-500 ring-4 ring-pink-300';
      default:
        return 'bg-slate-800/80 text-white border-slate-700';
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-lg transition-all ${
        mode === 'compact'
          ? isMinimized
            ? 'w-48 h-16'
            : 'w-full max-w-sm sm:max-w-md h-64'
          : 'w-full h-80'
      }`}
      id="gesture-camera-container"
    >
      {/* Minimized Bar */}
      {isMinimized && mode === 'compact' ? (
        <div className="flex items-center justify-between h-full px-4 text-white">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold truncate">Nhận diện cử chỉ</span>
          </div>
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Mở rộng camera"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          {/* Main Video & Canvas Layer */}
          <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover transform -scale-x-100" // Mirror for natural interaction
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none transform -scale-x-100"
            />

            {/* Error or Loading Overlay */}
            {hasPermission === false && (
              <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-4 text-center text-white z-20">
                <CameraOff className="w-10 h-10 text-rose-400 mb-2" />
                <p className="text-xs sm:text-sm text-slate-200 font-medium mb-3 max-w-xs">
                  {errorMessage || 'Không thể mở camera. Vui lòng cấp quyền trong trình duyệt.'}
                </p>
                <button
                  onClick={startCamera}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold flex items-center gap-1.5 shadow-md"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Thử lại kết nối
                </button>
              </div>
            )}

            {hasPermission === null && !errorMessage && (
              <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center text-white z-20">
                <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-xs text-slate-300 font-medium">Đang khởi động Camera AI...</span>
              </div>
            )}

            {/* Top Info Bar */}
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Camera AI</span>
              </div>

              <div className="flex items-center gap-1.5 pointer-events-auto">
                {mode === 'compact' && (
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="p-1.5 rounded-lg bg-black/50 hover:bg-black/80 text-white transition-colors"
                    title="Thu nhỏ camera"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Center / Bottom Recognition Status Banner */}
            <div className="absolute bottom-2 left-2 right-2 z-10 flex flex-col items-center gap-1.5">
              {/* Hold Progress Bar */}
              {holdProgress > 0 && !lockedOption && (
                <div className="w-full max-w-[200px] bg-slate-800/80 rounded-full h-2 overflow-hidden border border-white/20">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-100 ease-linear rounded-full"
                    style={{ width: `${holdProgress}%` }}
                  />
                </div>
              )}

              {/* Status Badge */}
              <div
                className={`px-3.5 py-1.5 rounded-xl border font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all ${getOptionBadgeColor(
                  activeOption
                )}`}
              >
                {lockedOption ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                    <span>ĐÃ KHÓA: ĐÁP ÁN {lockedOption}</span>
                  </>
                ) : currentGesture?.detectedOption ? (
                  <>
                    <Hand className="w-4 h-4" />
                    <span>
                      Nhận diện: {currentGesture.fingerCount} ngón ➔ Đáp án {currentGesture.detectedOption}
                    </span>
                    {holdProgress > 0 && (
                      <span className="text-xs bg-white/30 px-1.5 py-0.5 rounded-md">
                        {Math.round(holdProgress)}%
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <Hand className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-200">
                      Dơ 1-4 ngón tay trước camera để chọn A/B/C/D
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
