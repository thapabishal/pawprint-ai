import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const InstallPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const isDismissed = localStorage.getItem('pwa_prompt_dismissed');
    if (isDismissed) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      promptRef.current = e as BeforeInstallPromptEvent;

      // Only show after 30s delay as per spec
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 30000);

      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!promptRef.current) return;

    // Show the install prompt
    await promptRef.current.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await promptRef.current.userChoice;

    if (outcome === 'accepted') {
      setIsVisible(false);
    }

    promptRef.current = null;
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 animate-in slide-in-from-top duration-300">
      <div className="flex items-center justify-between border-b bg-white p-3 px-4 shadow-md mt-[36px]">
        <div className="flex items-center gap-3">
          <div className="text-[28px]">🐾</div>
          <div className="flex flex-col">
            <span className="text-[14px] font-semibold text-[#111827]">
              Add PawPrint to your home screen
            </span>
            <span className="text-[12px] text-[#6B7280]">
              Faster for field workers
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="h-8 px-3 text-[14px] font-semibold text-[#0D7377]"
            onClick={handleInstall}
          >
            Add
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#6B7280]"
            onClick={handleDismiss}
          >
            <X size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};
