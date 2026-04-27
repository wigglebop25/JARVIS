import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';

export const MCPLoading = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex gap-6 flex-row px-4 py-4"
    >
      {/* JARVIS AVATAR with Pulse */}
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-offline-core/30 bg-offline-core/10 text-offline-core relative">
        <Cpu size={20} className="animate-pulse" />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 rounded-xl bg-offline-core"
        />
      </div>

      {/* THINKING ANIMATION */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-30 animate-pulse">
          Jarvis_Processing...
        </span>
        
        <div className="flex items-center gap-1.5 h-6">
          {/* Three "Neural" Nodes */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ 
                backgroundColor: ["#0ea5e920", "#0ea5e9", "#0ea5e920"],
                boxShadow: ["0 0 0px #0ea5e900", "0 0 8px #0ea5e9", "0 0 0px #0ea5e900"]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 1, 
                delay: i * 0.2, 
                ease: "easeInOut" 
              }}
              className="w-1.5 h-1.5 rounded-full"
            />
          ))}
          
          {/* Floating Data Packet */}
          <div className="ml-4 w-24 h-[1px] bg-offline-core/20 relative overflow-hidden">
            <motion.div 
              animate={{ x: [-100, 100] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="absolute inset-0 w-8 bg-gradient-to-r from-transparent via-offline-core to-transparent"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};