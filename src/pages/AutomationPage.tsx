import { motion} from 'framer-motion';
import { systemBootContainer, systemBootItem } from '@/lib/animations';

export const AutomationPage = () => {
  return (
      <div className="flex items-center justify-center h-full">
        
        <motion.h1 
          className="text-primary-txt text-3xl text-center font-mono tracking-wider flex items-center gap-2"
          variants={systemBootContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.span variants={systemBootItem}>
            System.Initialize().
          </motion.span>
          
          <motion.span variants={systemBootItem} className="text-secondary-txt">
            Welcome to the
          </motion.span>
          
          <motion.span 
            variants={systemBootItem} 
            className="text-jarvis-blue tracking-widest font-bold drop-shadow-[0_0_8px_rgba(255,51,51,0.5)]"
          >
            AUTOMATION PAGE
          </motion.span>

          <motion.span variants={systemBootItem} className="text-secondary-txt">
            protocol.
          </motion.span>

        </motion.h1>

      </div>
  );
};