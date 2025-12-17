import React, { useEffect, useRef, useState } from 'react';
import { Human, Config } from '@vladmandic/human';

interface CameraFeedProps {
  isActive: boolean;
  showOverlay?: boolean;
  onEmotionUpdate?: (data: { label: string; stress: number; anxiety: number; neutral: number }) => void;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ 
  isActive, 
  showOverlay = true,
  onEmotionUpdate
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const humanRef = useRef<Human | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState<string>("Initializing...");
  const requestRef = useRef<number>(0);

  useEffect(() => {
    // Initialize Human library
    const initHuman = async () => {
      setIsModelLoading(true);
      const humanConfig: Partial<Config> = {
        modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human@3.2.1/models/', // Load models from CDN
        face: { enabled: true, iris: { enabled: false }, mesh: { enabled: false }, emotion: { enabled: true } },
        body: { enabled: false },
        hand: { enabled: false },
        object: { enabled: false },
        gesture: { enabled: false },
        backend: 'webgl'
      };
      
      humanRef.current = new Human(humanConfig);
      await humanRef.current.load();
      setIsModelLoading(false);
      setDetectedEmotion("Waiting for face...");
    };

    if (isActive) {
      initHuman();
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isActive]);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        if (isActive && videoRef.current) {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" } 
          });
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            detectFrame();
          };
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    if (isActive) {
      startCamera();
    } else {
       if (videoRef.current && videoRef.current.srcObject) {
         const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
         tracks.forEach(t => t.stop());
         videoRef.current.srcObject = null;
       }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isActive]);

  const detectFrame = async () => {
    if (!videoRef.current || !humanRef.current || videoRef.current.paused || videoRef.current.ended) {
      return;
    }

    try {
      const result = await humanRef.current.detect(videoRef.current);
      
      if (result.face && result.face.length > 0) {
        const face = result.face[0];
        // emotions is an array of objects { score, emotion }
        const emotions = face.emotion;
        
        if (emotions && emotions.length > 0) {
            // Find dominant emotion
            const dominant = emotions.reduce((prev, current) => (prev.score > current.score) ? prev : current);
            
            // Map to our labels
            let label = "Neutral";
            let stressScore = 0;
            let anxietyScore = 0;
            let neutralScore = 0;

            // Simple Mapping
            const happyScore = emotions.find(e => e.emotion === 'happy')?.score || 0;
            const sadScore = emotions.find(e => e.emotion === 'sad')?.score || 0;
            const angryScore = emotions.find(e => e.emotion === 'angry')?.score || 0;
            const fearScore = emotions.find(e => e.emotion === 'fear')?.score || 0;
            const neutralRaw = emotions.find(e => e.emotion === 'neutral')?.score || 0;

            // Calculate Stress (Composite of negative emotions)
            stressScore = (sadScore + angryScore + fearScore);
            anxietyScore = fearScore + (sadScore * 0.5);
            neutralScore = neutralRaw;

            if (dominant.emotion === 'happy') label = "Happy";
            else if (dominant.emotion === 'sad') label = "Stressed";
            else if (dominant.emotion === 'angry') label = "Stressed";
            else if (dominant.emotion === 'fear') label = "Anxious";
            else if (dominant.emotion === 'surprise') label = "In Thought";
            else label = "Neutral";

            setDetectedEmotion(label);

            // Send up to parent
            if (onEmotionUpdate) {
                onEmotionUpdate({
                    label,
                    stress: Math.min(1, stressScore),
                    anxiety: Math.min(1, anxietyScore),
                    neutral: Math.min(1, neutralScore)
                });
            }

            // Draw Box
            if (canvasRef.current && showOverlay) {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    const [x, y, w, h] = face.box;
                    
                    // The video is mirrored via CSS (scale-x-[-1]), but the canvas is NOT.
                    // To align the box with the mirrored video, we must calculate the mirrored X coordinate.
                    const mirroredX = canvas.width - x - w;
                    
                    const color = getEmotionColor(label);
                    
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    // Use mirroredX
                    ctx.roundRect(mirroredX, y, w, h, 10);
                    ctx.stroke();

                    // Label Background
                    ctx.fillStyle = color;
                    ctx.font = "bold 16px sans-serif";
                    const textWidth = ctx.measureText(label).width;
                    // Use mirroredX
                    ctx.fillRect(mirroredX, y - 30, textWidth + 20, 30);
                    
                    // Label Text
                    ctx.fillStyle = "#ffffff";
                    // Use mirroredX
                    ctx.fillText(label, mirroredX + 10, y - 10);
                }
            }
        }
      } else {
        setDetectedEmotion("Searching...");
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    } catch (e) {
      console.error(e);
    }

    requestRef.current = requestAnimationFrame(detectFrame);
  };

  const getEmotionColor = (label: string) => {
    switch (label) {
      case 'Happy': return '#4ade80'; // green-400
      case 'Stressed': return '#f87171'; // red-400
      case 'Anxious': return '#fbbf24'; // amber-400
      case 'In Thought': return '#60a5fa'; // blue-400
      default: return '#94a3b8'; // slate-400
    }
  };

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden shadow-inner border border-slate-700 flex items-center justify-center group">
      <video
        ref={videoRef}
        width={640}
        height={480}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]" 
      />
      {/* Canvas for overlay drawing - Removed transform scale-x-[-1] so text draws normally */}
      <canvas 
        ref={canvasRef}
        width={640}
        height={480}
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Loading Indicator */}
      {isModelLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
            <div className="text-white text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm">Loading AI Models...</p>
            </div>
        </div>
      )}

      {/* Fallback Overlay text if canvas drawing fails or just to show status */}
      {!isModelLoading && isActive && showOverlay && (
        <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded backdrop-blur-md text-xs font-mono border border-white/10 z-10">
            Status: {detectedEmotion}
        </div>
      )}
    </div>
  );
};

export default CameraFeed;