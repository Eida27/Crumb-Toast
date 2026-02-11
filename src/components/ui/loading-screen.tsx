"use client";

import { motion } from "framer-motion";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505] text-[#00f3ff]">
      {/* Grid Background Effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "linear-gradient(rgba(0, 243, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      {/* Cyberpunk Decor: Corners */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-[#00f3ff]/20 rounded-tl-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-[#00f3ff]/20 rounded-br-3xl pointer-events-none" />

      <div className="relative flex flex-col items-center gap-8 z-10">
        {/* Central Spinner */}
        <div className="relative w-24 h-24">
           {/* Outer Ring */}
           <motion.div
             className="absolute inset-0 border-t-2 border-b-2 border-[#00f3ff] rounded-full shadow-[0_0_15px_rgba(0,243,255,0.3)]"
             animate={{ rotate: 360 }}
             transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
           />

           {/* Inner Ring (Counter-rotating) */}
           <motion.div
             className="absolute inset-4 border-r-2 border-l-2 border-[#39ff14] rounded-full shadow-[0_0_10px_rgba(57,255,20,0.3)]"
             animate={{ rotate: -360 }}
             transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
           />

           {/* Center Core */}
           <motion.div
             className="absolute inset-0 flex items-center justify-center"
             animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
             transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
           >
             <div className="w-3 h-3 bg-[#00f3ff] rounded-full shadow-[0_0_20px_#00f3ff]" />
           </motion.div>
        </div>

        {/* Text */}
        <div className="relative overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-sm font-mono tracking-[0.5em] text-[#00f3ff] font-bold uppercase"
            style={{ textShadow: "0 0 10px rgba(0, 243, 255, 0.5)" }}
          >
            SYSTEM LOADING
          </motion.div>

          {/* Scanning Line */}
          <motion.div
            className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-[#00f3ff]/40 to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear", repeatDelay: 0.5 }}
          />
        </div>

        {/* Status Text (Optional random text effect) */}
        <motion.div
            className="text-[10px] text-white/30 font-mono"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 0.2, repeat: Infinity, repeatType: "reverse" }}
        >
            ESTABLISHING SECURE CONNECTION...
        </motion.div>
      </div>
    </div>
  );
}
