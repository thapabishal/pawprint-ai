import React from 'react';
import { motion } from 'framer-motion';

export const RadarAnimation: React.FC = () => {
  return (
    <div className="relative w-[320px] h-[320px] flex items-center justify-center overflow-hidden">
      {/* Concentric Circles */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{
            scale: 3,
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 1,
            ease: "easeOut"
          }}
          className="absolute border-[1.5px] border-primary rounded-full"
          style={{ width: '100px', height: '100px' }}
        />
      ))}

      {/* Center Icon */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          boxShadow: [
            "0 0 20px rgba(13, 115, 119, 0.2)",
            "0 0 40px rgba(13, 115, 119, 0.4)",
            "0 0 20px rgba(13, 115, 119, 0.2)"
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="relative z-10 w-20 h-20 bg-white rounded-[28px] flex items-center justify-center shadow-elevated border border-primary/10"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-10 h-10 text-primary"
          fill="currentColor"
        >
          <path d="M19,3L15,7H9L5,3V7L2,10V14L5,17V21H9V17H15V21H19V17L22,14V10L19,7V3Z" />
        </svg>
      </motion.div>
    </div>
  );
};
