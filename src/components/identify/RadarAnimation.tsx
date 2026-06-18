import React from 'react';

const RadarAnimation: React.FC = () => {
  return (
    <div className="relative w-[320px] h-[320px] flex items-center justify-center overflow-hidden">
      {/* Concentric Circles */}
      {[60, 100, 140].map((size, i) => (
        <div
          key={size}
          className="absolute border-2 border-[#0D7377] rounded-full opacity-0 animate-radar-pulse"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            animationDelay: `${i * 0.4}s`,
          }}
        />
      ))}

      {/* Center Icon */}
      <div className="relative z-10 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-teal-50">
        <svg
          viewBox="0 0 24 24"
          className="w-7 h-7 text-[#0D7377]"
          fill="currentColor"
        >
          <path d="M19,3L15,7H9L5,3V7L2,10V14L5,17V21H9V17H15V21H19V17L22,14V10L19,7V3Z" />
        </svg>
      </div>

      <style>{`
        @keyframes radar-pulse {
          0% {
            transform: scale(0.1);
            opacity: 0.8;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }
        .animate-radar-pulse {
          animation: radar-pulse 2.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default RadarAnimation;
