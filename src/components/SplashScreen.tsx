import React from 'react';
import { motion } from 'framer-motion';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FBF4E4] overflow-hidden">
      
      {/* Main Content */}
      <div className="relative flex flex-col items-center">
        {/* Tree Image */}
        <img 
          src="/splash.gif" 
          alt="Forest 3040 Logo" 
          className="w-72 h-72 object-contain relative z-10 mb-6"
        />

        {/* Text */}
        <h1 
          className="text-[#0F6045] text-[17px] font-extrabold tracking-widest font-headline z-10 relative"
        >
          우리들의 숲으로 들어가는 중...
        </h1>

        {/* Loading Indicator Dots */}
        <div className="flex gap-2 mt-6 z-10 relative">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
              className="w-2 h-2 rounded-full bg-emerald-500"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
