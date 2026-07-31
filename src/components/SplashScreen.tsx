import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import logoReveal from '@/assets/jhaymarts-logo-reveal.mp4.asset.json';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    setLeaving(true);
    window.setTimeout(onFinish, 600);
  };

  useEffect(() => {
    const fadeIn = window.setTimeout(() => setVisible(true), 30);
    // Safety timeout in case the video cannot play (autoplay blocked / decode error)
    const safety = window.setTimeout(finish, 12000);
    return () => {
      window.clearTimeout(fadeIn);
      window.clearTimeout(safety);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#04120b] transition-opacity duration-700 ${
        visible && !leaving ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <video
        className="max-h-[70vh] w-auto max-w-[90vw] object-contain drop-shadow-[0_25px_60px_rgba(151,207,161,0.35)]"
        src={logoReveal.url}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
      />
      <div className="mt-8 flex items-center gap-3 text-sm tracking-[0.3em] text-[#97cfa1]/80 uppercase">
        <Loader2 className="h-4 w-4 animate-spin" />
        Initializing System
      </div>
    </div>
  );
};

export default SplashScreen;
