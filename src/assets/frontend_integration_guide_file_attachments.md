# JARVIS Frontend - Document Attachment Integration Guide (Tauri Dialog Plugin)

This guide outlines the required changes to integrate document attachments into the React + TypeScript frontend of JARVIS using absolute file paths selected via the official Tauri Dialog plugin.

---

## 0. Installation
Install the Tauri dialog client library on the frontend:
```bash
bun add @tauri-apps/plugin-dialog
```

---

## 1. Service Layer API Updates
Update [chatService.ts](file:///E:/Documents/code/git/JARVIS/src/services/chatService.ts) to pass absolute file paths to the backend.

### Update `sendPrompt`
Replace `sendPrompt` with the following implementation (lines 48-77):
```typescript
import { ChatResponse, Session, RigMessage } from "@/types/tauri";

export const sendPrompt = async (
  sessionId: string, 
  input: string, 
  attachments?: string[] // Array of absolute file paths
): Promise<ChatResponse> => {
  if (!isTauri()) {
    console.info("[chatService] Non-Tauri environment, using local storage mock.");
    await new Promise(r => setTimeout(r, 600)); // Simulate thinking latency
    
    let reply = `[SIMULATOR] Core uplink established. I have received your prompt.`;
    if (attachments && attachments.length > 0) {
      reply = `[SIMULATOR] I noticed the following attached file path(s): ${attachments.join(", ")}. In a Tauri environment, the agent will read these paths using its ReadDocumentTool.`;
    }

    // Append to local history mock
    const history = getMockHistory(sessionId);
    const updatedHistory: RigMessage[] = [
      ...history,
      { role: "user", content: [{ type: "text", text: input }] as any },
      { role: "assistant", content: [{ text: reply }] as any }
    ];
    saveMockHistory(sessionId, updatedHistory);

    // Update session updated_at
    const sessions = getMockSessions();
    const updatedSessions = sessions.map(s => 
      s.id === sessionId ? { ...s, updated_at: Date.now() } : s
    );
    saveMockSessions(updatedSessions);

    return {
      message: reply,
      provider: "simulator"
    };
  }
  return await invoke<ChatResponse>("prompt", { 
    sessionId, 
    input, 
    attachments: attachments || null 
  });
};
```

---

## 2. Session Context State Management
Update [SessionContext.tsx](file:///E:/Documents/code/git/JARVIS/src/context/SessionContext.tsx) to handle document attachments during message sends.

### Update the Context Type Definition
Modify the `SessionContextType` interface (lines 13-30) to accept attachments (array of paths):
```typescript
interface SessionContextType {
  // ... existing fields ...
  sendMessage: (overrideText?: string, attachments?: string[]) => Promise<void>;
  // ... existing fields ...
}
```

### Update `sendMessage`
Replace the `sendMessage` function in `SessionProvider` (lines 206-258) with the following:
```typescript
  // ── Send message ──
  const sendMessage = useCallback(async (overrideText?: string, attachments?: string[]) => {
    const textToSend = (overrideText || input).trim();
    if (!textToSend && (!attachments || attachments.length === 0)) return;
    if (isThinking) return;

    // Format the message with attached paths for backward-compatible text storage
    let displayMessage = textToSend;
    if (attachments && attachments.length > 0) {
      const attachmentsHeader = attachments.map(path => `[Attached: ${path}]`).join('\n');
      displayMessage = `${attachmentsHeader}\n${textToSend}`;
    }

    const userMsg: Message = { id: `user-${Date.now()}`, sender: 'user', text: displayMessage };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    let responseText: string;

    try {
      // Ensure we have a session
      let sid = activeSessionId;
      if (!sid) {
        sid = await createSession('New Session');
        setActiveSessionId(sid);
      }

      // Auto-title: if this is the first user message in the session
      const isFirstMessage = messages.filter(m => m.sender === 'user').length === 0;
      if (isFirstMessage) {
        const truncatedTitle = textToSend.length > 40 
          ? textToSend.substring(0, 40) + '...' 
          : textToSend || 'Document Query';
        
        try {
          await renameSession(sid, truncatedTitle);
        } catch (err) {
          console.error('[SessionContext] Failed to rename session on backend:', err);
        }
      }

      const response = await sendPrompt(sid, textToSend, attachments);
      responseText = response.message;
    } catch (err) {
      console.error('[SessionContext] Prompt failed:', err);
      responseText = `SYSTEM_ERROR: Backend unreachable — ${err}`;
    }

    const botMsg: Message = {
      id: `bot-${Date.now()}`,
      sender: 'jarvis',
      text: responseText,
    };

    setMessages(prev => [...prev, botMsg]);
    setIsThinking(false);

    // Refresh session list to update ordering and titles
    await refreshSessions();
  }, [input, isThinking, activeSessionId, messages, refreshSessions]);
```

---

## 3. UI Components

### 3.1. Parsing Attachment Metadata in Messages
To render the attachments beautifully without cluttering the chat bubbles with raw text headers, update the message renderer in `OfflineChatHistory.tsx` (and `MCPMessageLog.tsx`):

Inside the message rendering loop:
```typescript
const renderMessageText = (messageText: string) => {
  const lines = messageText.split('\n');
  const attachmentPaths: string[] = [];
  const contentLines: string[] = [];

  // Parse lines starting with [Attached: ...]
  for (const line of lines) {
    const match = line.match(/^\[Attached:\s*(.+)\]$/);
    if (match) {
      attachmentPaths.push(match[1]);
    } else {
      contentLines.push(line);
    }
  }

  const cleanText = contentLines.join('\n').trim();

  return (
    <div className="flex flex-col gap-2">
      {/* Render attachment badges inside the chat bubble */}
      {attachmentPaths.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1">
          {attachmentPaths.map((path, idx) => {
            const fileName = path.split(/[/\\]/).pop() || path;
            return (
              <div 
                key={idx}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10 text-[11px] font-mono text-secondary-txt"
                title={path}
              >
                <FileText size={10} />
                <span>{fileName}</span>
              </div>
            );
          })}
        </div>
      )}
      <p className="whitespace-pre-wrap">{cleanText}</p>
    </div>
  );
};
```

### 3.2. Offline Prompt Bar
Update [OfflinePromptBar.tsx](file:///E:/Documents/code/git/JARVIS/src/features/offline/components/OfflinePromptBar.tsx):

#### Step 1: Imports
Ensure `Paperclip`, `FileText`, and the Tauri `open` dialog module are imported:
```typescript
import { Send, Shield, Loader2, Mic, X, Command, Paperclip, FileText } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
```

#### Step 2: React State
Add state to store attached files inside `OfflinePromptBar`:
```typescript
  interface AttachedFile {
    id: string;
    path: string;
    name: string;
  }

  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
```

#### Step 3: Picker Trigger
Add the function to invoke the native file selector using Tauri Dialogs:
```typescript
  const handleAttachClick = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'Documents',
          extensions: ['txt', 'md', 'pdf']
        }]
      });

      if (!selected) return; // User cancelled
      
      const paths = Array.isArray(selected) ? selected : [selected];
      const newFiles: AttachedFile[] = [];

      for (const selectedPath of paths) {
        if (attachedFiles.some(f => f.path === selectedPath)) continue;

        const fileName = selectedPath.split(/[/\\]/).pop() || selectedPath;
        newFiles.push({
          id: `${selectedPath}-${Date.now()}-${Math.random()}`,
          path: selectedPath,
          name: fileName
        });
      }

      if (newFiles.length > 0) {
        setAttachedFiles(prev => [...prev, ...newFiles]);
      }
    } catch (err) {
      console.error("Failed to select file:", err);
    }
  };

  const removeFile = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id));
  };
```

#### Step 4: Update Send Trigger
Update the prop definitions and callback triggers:
```typescript
interface Props {
  input: string;
  setInput: (val: string) => void;
  onSend: (overrideText?: string, attachments?: string[]) => void;
  disabled?: boolean;
}
```
In `OfflinePromptBar`:
```typescript
  const handleSendClick = () => {
    const paths = attachedFiles.map(f => f.path);
    onSend(undefined, paths);
    setAttachedFiles([]); // Clear attachments
  };
```
In `OfflineDashboardPage.tsx` (lines 24-29):
```typescript
          <OfflinePromptBar 
            input={input} 
            setInput={setInput} 
            onSend={(override, atts) => sendMessage(override, atts)} 
            disabled={isThinking}
          />
```

#### Step 5: Render UI Pills and Paperclip Button
Add the pills list above the textarea:
```typescript
        {/* Attached Files List */}
        <AnimatePresence>
          {attachedFiles.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 pb-3 mb-2 border-b border-white/5"
            >
              {attachedFiles.map(file => (
                <motion.div
                  key={file.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-secondary-txt text-xs font-mono select-none backdrop-blur-md transition-all hover:bg-white/10"
                  title={file.path}
                >
                  <FileText size={12} className="opacity-75" />
                  <span className="max-w-[150px] truncate">{file.name}</span>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-0.5 rounded hover:bg-white/10 text-tertiary-txt hover:text-white transition-colors"
                  >
                    <X size={12} />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
```
Add the Paperclip button next to the voice mic button:
```typescript
            {/* Document Attachment Button */}
            <button 
              type="button"
              onClick={handleAttachClick}
              disabled={disabled}
              title="Attach document (.txt, .md, .pdf)"
              className="p-3 rounded-xl bg-white/5 text-secondary-txt hover:bg-white/10 hover:text-white transition-all disabled:opacity-20 shadow-[0_0_20px_rgba(0,0,0,0.1)]"
            >
              <Paperclip size={20} />
            </button>
```

### 3.3. Online MCP Terminal Overlay
Apply matching changes to [MCPTerminal.tsx](file:///E:/Documents/code/git/JARVIS/src/features/mcp/components/MCPTerminal.tsx):
- Add state `attachedFiles` and picker handler `handleAttachClick`.
- Render the attachment pills above the input container using `framer-motion`.
- Add the `Paperclip` button next to the send button, matching the online styling.
- Modify `handleSend` to accept attachments and pass them to the `sendPrompt` service.
