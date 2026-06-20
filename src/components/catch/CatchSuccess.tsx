import React from 'react';
import { CheckCircle2, User, Camera, ArrowRight, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CatchSuccessProps {
  dogId: string;
  hasLocation: boolean;
  onViewProfile: () => void;
  onCatchAnother: () => void;
  onClose: () => void;
}

export const CatchSuccess: React.FC<CatchSuccessProps> = ({
  dogId,
  hasLocation,
  onViewProfile,
  onCatchAnother,
  onClose,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-white">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
        className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8"
      >
        <CheckCircle2 className="w-12 h-12 text-green-600" />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-[32px] font-extrabold text-dark tracking-tight leading-tight mb-2">
          Registration <br/>Successful!
        </h2>
        <p className="text-[15px] text-muted font-medium mb-8">
          Dog ID: <span className="text-dark font-bold font-mono tracking-wider ml-1">#{dogId.slice(0, 8).toUpperCase()}</span>
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-sm space-y-4 mb-12"
      >
        <div className="flex gap-3">
          <StatMini icon={<Camera className="w-4 h-4" />} label="Photo saved" active />
          <StatMini icon={<MapPin className="w-4 h-4" />} label="Location locked" active={hasLocation} />
        </div>

        <button
          onClick={onViewProfile}
          className="w-full p-5 bg-gray-50 border border-border rounded-[24px] flex items-center justify-between group hover:bg-primary/5 hover:border-primary/20 transition-all"
        >
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-white rounded-[16px] shadow-sm flex items-center justify-center text-primary">
              <User className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[15px] font-bold text-dark block">View Profile</span>
              <span className="text-[12px] text-muted font-medium">Add more details or check history</span>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
        </button>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full max-w-sm space-y-3"
      >
        <Button
          onClick={onCatchAnother}
          className="w-full h-[64px] bg-primary hover:bg-primary/90 text-white rounded-[22px] font-extrabold text-[17px] shadow-teal-glow"
        >
          Register Another Dog
        </Button>
        <Button
          variant="outline"
          onClick={onClose}
          className="w-full h-[64px] border-border text-dark rounded-[22px] font-bold text-[16px]"
        >
          Return to Dashboard
        </Button>
      </motion.div>
    </div>
  );
};

const StatMini = ({ icon, label, active }: { icon: React.ReactNode, label: string, active: boolean }) => (
  <div className={cn(
    "flex-1 flex items-center gap-2 px-3 py-2.5 rounded-full border text-[11px] font-bold uppercase tracking-wider",
    active ? "bg-green-50 border-green-100 text-green-600" : "bg-gray-50 border-gray-100 text-muted"
  )}>
    {icon}
    <span>{label}</span>
  </div>
);
