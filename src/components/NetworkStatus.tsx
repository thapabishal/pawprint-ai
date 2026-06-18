import React, { useState, useEffect } from 'react';
import { Zap, CheckCircle2 } from 'lucide-react';

export const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 2500);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[60] w-full animate-in slide-in-from-top duration-300">
        <div className="flex h-[36px] items-center justify-center gap-2 bg-[#FEF3C7] px-4 text-[#92400E]">
          <Zap size={14} className="fill-current" />
          <span className="text-[13px] font-medium">
            ⚡ Offline — changes will sync when connected
          </span>
        </div>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[60] w-full animate-out fade-out fill-mode-forwards duration-500 transition-all delay-&lsqb;2000ms&rsqb;">
        <div className="flex h-[36px] items-center justify-center gap-2 bg-[#D1FAE5] px-4 text-[#065F46]">
          <CheckCircle2 size={14} className="fill-current" />
          <span className="text-[13px] font-medium">
            ✓ Back online — syncing...
          </span>
        </div>
      </div>
    );
  }

  return null;
};
