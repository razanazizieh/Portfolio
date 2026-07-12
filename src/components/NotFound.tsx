/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { motion } from 'motion/react';

interface NotFoundProps {
  handleNav: (e: React.SyntheticEvent | { preventDefault: () => void }, targetId: string) => void;
}

export default function NotFound({ handleNav }: NotFoundProps) {
  
  // Hide navbar and name elements on mount, restore on unmount
  useEffect(() => {
    const navbar = document.querySelector('nav, .navbar, #navbar');
    const nameElements = document.querySelectorAll('.name, #logo, [class*="name"]');

    if (navbar) {
      (navbar as HTMLElement).style.display = 'none';
    }
    nameElements.forEach(element => {
      (element as HTMLElement).style.display = 'none';
    });

    return () => {
      if (navbar) {
        (navbar as HTMLElement).style.display = ''; 
      }
      nameElements.forEach(element => {
        (element as HTMLElement).style.display = '';
      });
    };
  }, []);

  const handleReturnHome = (e: React.MouseEvent) => {
    e.preventDefault();
    handleNav(e, 'hero');
  };

  return (
    <div className="min-h-screen w-full bg-black text-white relative flex flex-col justify-center items-center p-6 selection:bg-white selection:text-black antialiased">
      
      {/* Absolute Void Core */}
      <div className="max-w-xl text-center space-y-6 z-10">
        
        {/* Swiss Style High-Contrast Typography (Fixed Pixelation) */}
        <h1 
          className="text-[10rem] md:text-[15rem] font-black tracking-[calc(-0.06em)] leading-[0.8] text-white select-none font-sans antialiased subpixel-antialiased"
          style={{
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            WebkitFontSmoothing: 'subpixel-antialiased',
            MozOsxFontSmoothing: 'grayscale'
          }}
        >
          404
        </h1>

        {/* Muted Functional Explanation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4 pt-4"
        >
          <h2 className="text-xs md:text-sm font-semibold tracking-[0.2em] text-neutral-400 uppercase font-sans">
            PAGE NOT FOUND
          </h2>
          <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed font-mono">
            The page you are looking for doesn't exist or has been moved.
          </p>
        </motion.div>

        {/* Pure Color Interaction Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="pt-8"
        >
          <button
            onClick={handleReturnHome}
            className="text-xs font-mono tracking-[0.25em] text-neutral-500 hover:text-white transition-colors duration-300 uppercase cursor-pointer focus:outline-none focus-visible:underline"
          >
            RETURN HOME
          </button>
        </motion.div>

      </div>
    </div>
  );
}
