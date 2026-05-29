import { OfflineChatHistory } from '@/features/offline/components/OfflineChatHistory';
import { OfflinePromptBar } from '@/features/offline/components/OfflinePromptBar';
import { OfflineLoading } from '@/features/offline/components/OfflineLoading';
import { OfflineTelemetryHUD } from '@/features/offline/components/OfflineTelemetryHUD';
import { useSession } from '@/context/SessionContext';
import { useState } from 'react';

export const OfflineDashboardPage = () => {
  const { messages, isThinking, input, setInput, sendMessage } = useSession();
  const [isHudOpen, setIsHudOpen] = useState(true);

  return (
    <div className="h-full w-full flex bg-offline-bg relative overflow-hidden">
      
      {/* ── LEFT: Terminal Chat Workspace ── */}
      <div className="flex-1 flex flex-col overflow-hidden z-10">
        <OfflineChatHistory messages={messages} />
        
        <div className="max-w-5xl mx-auto w-full px-4">
           {isThinking && <OfflineLoading />}
        </div>

        <div className="w-full z-20 bg-gradient-to-t from-offline-bg via-offline-bg/90 to-transparent">
          <OfflinePromptBar 
            input={input} 
            setInput={setInput} 
            onSend={sendMessage} 
            disabled={isThinking}
          />
        </div>
      </div>

      {/* ── RIGHT: Collapsible Telemetry HUD ── */}
      <div className="relative z-20 h-full flex">
        <OfflineTelemetryHUD 
          isOpen={isHudOpen} 
          onToggle={() => setIsHudOpen(!isHudOpen)} 
        />
      </div>
    </div>
  );
};