import { useState, useEffect, useRef } from 'react';
import { 
  Database, Folder, RefreshCw, Trash2, Terminal, 
  Info, FileText, ChevronLeft, X, Eye, EyeOff, BookOpen
} from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getRagTelemetry, clearRagDatabase, startRagIndexing,
  RagTelemetry
} from '@/services/ragService';
import { useDocument } from '@/hooks/useDocument';
import { getConfig, saveConfig } from '@/services/configService';

export const OfflineRAGPage = () => {
  const [vaultPath, setVaultPath] = useState('C:\\Users\\cruiz\\Documents\\KnowledgeVault');
  const [allVaultPaths, setAllVaultPaths] = useState<string[]>([
    'C:\\Users\\cruiz\\Documents\\KnowledgeVault'
  ]);
  const [excludedFolders, setExcludedFolders] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([
    '[INIT] Node.AirGapped RAG system initialized.',
    '[STATUS] Active vector database SQLite-VSS connected.',
    '[READY] Browse your workspace folders and select documents to preview.'
  ]);

  // RAG Pipeline states
  const [stats, setStats] = useState<RagTelemetry>({
    totalNotes: 0,
    indexedNotes: 0,
    totalChunks: 0,
    dbSize: '0.0 KB'
  });

  // Document/Explorer hook
  const {
    currentPath,
    files,
    selectedFile,
    selectedFileContent,
    loading: docsLoading,
    setSelectedFile,
    loadDirectory,
    selectFile,
    goBack
  } = useDocument("");

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto Scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Load configuration and workspace list on mount
  useEffect(() => {
    const initConfig = async () => {
      try {
        const config = await getConfig();
        let activePath = 'C:\\Users\\cruiz\\Documents\\KnowledgeVault';
        if (config.sandbox_dir && config.sandbox_dir !== '.') {
          activePath = config.sandbox_dir;
          setVaultPath(activePath);
        }

        // Load stored list of paths
        const stored = localStorage.getItem('jarvis_vault_paths');
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as string[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Ensure activePath is in the parsed list
              if (!parsed.includes(activePath)) {
                parsed.push(activePath);
              }
              setAllVaultPaths(parsed);
              localStorage.setItem('jarvis_vault_paths', JSON.stringify(parsed));
            }
          } catch (e) {
            console.error(e);
          }
        } else {
          // Default list if none stored
          const defaultList = [activePath];
          setAllVaultPaths(defaultList);
          localStorage.setItem('jarvis_vault_paths', JSON.stringify(defaultList));
        }

        // Load excluded folders list
        const storedExcluded = localStorage.getItem('jarvis_excluded_folders');
        if (storedExcluded) {
          try {
            const parsed = JSON.parse(storedExcluded) as string[];
            if (Array.isArray(parsed)) {
              setExcludedFolders(parsed);
            }
          } catch (e) {
            console.error(e);
          }
        }

      } catch (err) {
        console.error('[OfflineRAGPage] Failed to fetch sandbox config:', err);
      }
    };
    initConfig();
  }, []);

  // Load telemetry stats
  const refreshRagData = async () => {
    try {
      const tel = await getRagTelemetry();
      setStats(tel);
    } catch (err) {
      console.error('[OfflineRAGPage] Error loading data:', err);
    }
  };

  useEffect(() => {
    refreshRagData();
  }, [vaultPath]);

  const handleSwitchWorkspace = async (newPath: string) => {
    try {
      const config = await getConfig();
      config.sandbox_dir = newPath;
      await saveConfig(config);

      setVaultPath(newPath);
      setLogs(prev => [
        ...prev,
        `[WORKSPACE] Shifted workspace core target: "${newPath}"`,
        `[DISCOVERY] Loading folder entries...`
      ]);

      // Force reload
      await loadDirectory("");
    } catch (err) {
      console.error('[OfflineRAGPage] Failed to switch workspace:', err);
    }
  };

  const handleSelectPath = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Target Local Document Folder'
      });
      if (selected && typeof selected === 'string') {
        const config = await getConfig();
        config.sandbox_dir = selected;
        await saveConfig(config);

        setVaultPath(selected);

        // Add to stored list
        setAllVaultPaths(prev => {
          const updated = prev.includes(selected) ? prev : [...prev, selected];
          localStorage.setItem('jarvis_vault_paths', JSON.stringify(updated));
          return updated;
        });

        setLogs(prev => [
          ...prev,
          `[CONFIG] Document source added: "${selected}"`,
          `[DISCOVERY] Rescanning directory...`
        ]);

        // Force workspace browser reload
        await loadDirectory("");
      }
    } catch (err) {
      console.warn('Native folder selection not supported or outside Tauri:', err);
      // Fallback mock
      const mockPaths = [
        'D:\\BrainVault\\Documents',
        'C:\\Users\\cruiz\\Documents\\KnowledgeBase',
        'C:\\Workspace\\local-rag-docs'
      ];
      const randomPath = mockPaths[Math.floor(Math.random() * mockPaths.length)];
      
      try {
        const config = await getConfig();
        config.sandbox_dir = randomPath;
        await saveConfig(config);
      } catch (e) {
        console.error(e);
      }

      setVaultPath(randomPath);

      // Add to stored list
      setAllVaultPaths(prev => {
        const updated = prev.includes(randomPath) ? prev : [...prev, randomPath];
        localStorage.setItem('jarvis_vault_paths', JSON.stringify(updated));
        return updated;
      });

      setLogs(prev => [
        ...prev,
        `[MOCK_TAURI] Local browser fallback directory selection: "${randomPath}"`,
        `[DISCOVERY] Rescanning directory...`
      ]);

      // Force workspace browser reload
      await loadDirectory("");
    }
  };

  const handleRemoveWorkspace = async (pathToRemove: string) => {
    const remaining = allVaultPaths.filter(p => p !== pathToRemove);
    if (remaining.length === 0) return;

    setAllVaultPaths(remaining);
    localStorage.setItem('jarvis_vault_paths', JSON.stringify(remaining));

    // Switch to first remaining
    await handleSwitchWorkspace(remaining[0]);
  };

  const handleToggleExclusion = async (dirName: string) => {
    const isCurrentlyExcluded = excludedFolders.includes(dirName);
    const nextExcluded = !isCurrentlyExcluded;
    
    const updated = nextExcluded 
      ? [...excludedFolders.filter(p => p !== dirName), dirName]
      : excludedFolders.filter(p => p !== dirName);
      
    localStorage.setItem('jarvis_excluded_folders', JSON.stringify(updated));
    setExcludedFolders(updated);

    setLogs(logsPrev => [
      ...logsPrev,
      `[EXCLUSION] Folder "/${dirName}" target state changed: ${nextExcluded ? 'IGNORE_SOURCE' : 'INDEX_SOURCE'}`
    ]);
  };

  const handleIndexVault = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncProgress(0);
    setLogs(prev => [...prev, '[START] Commencing directory ingestion and vector sync...']);

    try {
      await startRagIndexing(vaultPath, (payload) => {
        setLogs(prev => [...prev, payload.message]);
        setSyncProgress(payload.progress);
      });
      setIsSyncing(false);
      await refreshRagData();
    } catch (err) {
      console.error('[OfflineRAGPage] Indexing failed:', err);
      setIsSyncing(false);
      setLogs(prev => [...prev, `[ERROR] Indexing pipeline failed: ${err}`]);
    }
  };

  const handleClearDatabase = async () => {
    if (window.confirm('WARNING: Proceeding will wipe all local vector database entries. Re-indexing will be required. Confirm?')) {
      try {
        await clearRagDatabase();
        setLogs(prev => [
          ...prev,
          '[WIPE] Local vector space cleared. Database index dropped.',
          '[STATUS] Zero active document segments registered.'
        ]);
        await refreshRagData();
      } catch (err) {
        console.error('[OfflineRAGPage] Wipe failed:', err);
      }
    }
  };

  // Helper to determine if a folder path is excluded in RAG stats
  const isFolderExcluded = (name: string) => {
    return excludedFolders.includes(name);
  };

  // Separate files into Folders and Document files
  const folderItems = files.filter(f => f.is_dir);
  const fileItems = files.filter(f => !f.is_dir);

  return (
    <div className="h-full w-full bg-offline-bg flex flex-col p-5 overflow-hidden text-primary-txt select-none">
      
      {/* ── TOP HEADER (INTEGRATING COMPACT METRICS BAR) ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-offline-border pb-3 mb-4 gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-sm font-bold tracking-[0.2em] text-white flex items-center gap-2 shrink-0">
            <Database className="text-white animate-pulse" size={16} />
            LOCAL_KNOWLEDGE_CORE
          </h1>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 border border-white/10 rounded shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-success-green shadow-[0_0_8px_#00FF66]" />
            <span className="font-mono text-[9px] text-white/90 font-bold uppercase tracking-widest">
              Air_Gapped
            </span>
          </div>
        </div>

        {/* Compact stats badges */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-[10px]">
          <div className="bg-white/5 border border-white/10 rounded px-2.5 py-1 text-secondary-txt">
            Files: <strong className="text-white">{stats.totalNotes}</strong>
          </div>
          <div className="bg-white/5 border border-white/10 rounded px-2.5 py-1 text-secondary-txt">
            Indexed: <strong className="text-white">{stats.indexedNotes} ({stats.totalNotes > 0 ? Math.round((stats.indexedNotes / stats.totalNotes) * 100) : 0}%)</strong>
          </div>
          <div className="bg-white/5 border border-white/10 rounded px-2.5 py-1 text-secondary-txt">
            Chunks: <strong className="text-white">{stats.totalChunks}</strong>
          </div>
          <div className="bg-white/5 border border-white/10 rounded px-2.5 py-1 text-secondary-txt">
            Size: <strong className="text-white">{stats.dbSize}</strong>
          </div>
        </div>

        {/* Workspace Selector Dropdown for Multiple Folders */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <select
              value={vaultPath}
              onChange={(e) => handleSwitchWorkspace(e.target.value)}
              className="bg-white/5 border border-white/10 text-white rounded px-2.5 py-1 text-xs font-mono outline-none select-text max-w-[200px] truncate cursor-pointer hover:bg-white/10 transition-colors"
            >
              {allVaultPaths.map((p, idx) => (
                <option key={idx} value={p} className="bg-neutral-900 text-white font-mono text-xs">
                  {p.split(/[/\\]/).pop() || p}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSelectPath}
            title="Add Folder to Workspace List"
            className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white rounded text-xs font-mono transition-all uppercase cursor-pointer"
          >
            <Folder size={12} />
            <span>Add Folder</span>
          </button>

          {allVaultPaths.length > 1 && (
            <button
              onClick={() => handleRemoveWorkspace(vaultPath)}
              title="Remove current folder from list"
              className="p-1.5 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/5 text-red-400 rounded transition-colors cursor-pointer outline-none"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── WORKSPACE CORE GRID ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 flex-1 min-h-0 items-stretch mb-4">
        
        {/* COLUMN 1: WORKSPACE FOLDERS EXPLORER (4 cols) */}
        <div className="xl:col-span-4 bg-white/[0.01] border border-white/5 rounded-xl p-4 flex flex-col gap-3 min-h-0">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 shrink-0">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BookOpen size={13} className="text-white/60" />
              Folders Browser
            </h3>
            {currentPath && (
              <button 
                onClick={goBack}
                className="flex items-center gap-1 px-2 py-0.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded text-[10px] font-mono cursor-pointer transition-colors"
              >
                <ChevronLeft size={10} />
                <span>Up</span>
              </button>
            )}
          </div>

          {/* Current Path breadcrumb */}
          <div className="bg-black/40 border border-white/5 rounded px-2.5 py-1.5 font-mono text-[10px] text-secondary-txt truncate shrink-0">
            Path: {currentPath ? `/${currentPath}` : "/ (Root)"}
          </div>

          {/* Folder items list */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 custom-scrollbar flex flex-col gap-1.5">
            {docsLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-[11px] font-mono text-secondary-txt/60 gap-2">
                <RefreshCw size={14} className="animate-spin" />
                Scanning Folders...
              </div>
            ) : folderItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <span className="text-[11px] font-mono text-secondary-txt/30 uppercase">No Subfolders</span>
                <span className="text-[9px] text-secondary-txt/30 mt-0.5">This folder has no subdirectories.</span>
              </div>
            ) : (
              folderItems.map((folder, idx) => {
                const excluded = isFolderExcluded(folder.name);
                return (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-2 border rounded-lg transition-all
                      ${excluded 
                        ? 'bg-red-500/[0.02] border-dashed border-red-500/20 text-white/40' 
                        : 'bg-white/[0.01] border-white/5 text-white hover:bg-white/[0.03]'
                      }`}
                  >
                    <button
                      onClick={() => loadDirectory(folder.path)}
                      className="flex-1 flex items-center gap-2 text-left cursor-pointer min-w-0 outline-none"
                    >
                      <div className={excluded ? 'text-red-400/50' : 'text-white/60'}>
                        <Folder size={13} />
                      </div>
                      <span className={`font-mono text-xs truncate leading-tight font-medium ${excluded ? 'line-through text-white/30' : 'text-white'}`}>
                        {folder.name}
                      </span>
                    </button>

                    {/* Eye / EyeOff toggle action */}
                    <button
                      onClick={() => handleToggleExclusion(folder.name)}
                      title={excluded ? "Include in RAG Sync" : "Exclude from RAG Sync"}
                      className={`p-1 rounded transition-colors cursor-pointer outline-none ml-2
                        ${excluded 
                          ? 'text-red-400 hover:text-red-300' 
                          : 'text-[#00FF66] hover:text-[#00FF66]/80'
                        }`}
                    >
                      {excluded ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 2: DOCUMENT FILES & PREVIEW WORKSPACE (4 cols) */}
        <div className="xl:col-span-4 bg-white/[0.01] border border-white/5 rounded-xl p-4 flex flex-col gap-3 min-h-0">
          
          <AnimatePresence mode="wait">
            {selectedFile ? (
              // ── Document Preview Reader Mode ──
              <motion.div 
                key="file-preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col gap-3 min-h-0"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2 shrink-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FileText size={13} className="text-white/80 shrink-0" />
                    <span className="font-mono text-xs text-white font-semibold truncate">
                      {selectedFile.split(/[/\\]/).pop()}
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedFile(null)}
                    className="p-1 bg-white/5 hover:bg-white/10 text-white rounded transition-colors cursor-pointer outline-none shrink-0"
                    title="Back to Files"
                  >
                    <X size={12} />
                  </button>
                </div>

                <div className="flex-1 min-h-0 bg-black/50 border border-white/10 rounded-lg p-3 font-mono text-[11px] leading-relaxed text-white/90 overflow-y-auto custom-scrollbar select-text whitespace-pre-wrap">
                  {selectedFileContent || "Empty document."}
                </div>
              </motion.div>
            ) : (
              // ── Document Files List Mode ──
              <motion.div 
                key="files-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col gap-3 min-h-0"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-2 shrink-0">
                  <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText size={13} className="text-white/60" />
                    Documents List
                  </h3>
                  <span className="text-[9px] font-mono text-secondary-txt px-1.5 py-0.2 bg-white/5 rounded border border-white/5">
                    {fileItems.length} Files
                  </span>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 custom-scrollbar flex flex-col gap-1.5">
                  {docsLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-[11px] font-mono text-secondary-txt/60 gap-2">
                      <RefreshCw size={14} className="animate-spin" />
                      Scanning Files...
                    </div>
                  ) : fileItems.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                      <FileText size={16} className="text-secondary-txt/20 mb-1" />
                      <span className="text-[11px] font-mono text-secondary-txt/30 uppercase">No Files</span>
                      <span className="text-[9px] text-secondary-txt/30 mt-0.5">No supported document files in this directory.</span>
                    </div>
                  ) : (
                    fileItems.map((file, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectFile(file.path)}
                        className="flex items-center justify-between p-2 border border-white/5 bg-black/10 hover:bg-white/[0.02] hover:border-white/15 rounded-lg cursor-pointer text-left transition-all outline-none"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText size={13} className="text-white/50 shrink-0" />
                          <span className="font-mono text-xs text-white/95 truncate">
                            {file.name}
                          </span>
                        </div>
                        {file.size !== undefined && (
                          <span className="text-[9px] font-mono text-secondary-txt/40 shrink-0 ml-2">
                            {Math.round(file.size / 1024)} KB
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* COLUMN 3: INGESTION CONTROLLER & LOGS (4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-4 min-h-0">
          
          {/* Indexing operations card */}
          <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 flex flex-col gap-3 shrink-0">
            <div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <RefreshCw size={13} className="text-white/60" />
                Pipeline Controller
              </h3>
              <p className="text-[10px] text-secondary-txt/80 mt-0.5 leading-normal">
                Ingest workspace files into local SQLite-VSS vectors.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleIndexVault}
                disabled={isSyncing || !vaultPath}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white text-black font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm hover:bg-white/90 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer"
              >
                <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'Indexing...' : 'Index Core'}
              </button>
              
              <button
                onClick={handleClearDatabase}
                disabled={isSyncing || stats.totalChunks === 0}
                className="flex items-center gap-1.5 px-3 py-2 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/5 text-red-400 font-mono text-[10px] uppercase tracking-wider rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <Trash2 size={11} />
                Wipe
              </button>
            </div>

            {/* Ingestion Progress */}
            {isSyncing && (
              <div className="space-y-1.5 pt-1 border-t border-white/5">
                <div className="flex items-center justify-between text-[9px] font-mono text-white/90">
                  <span className="animate-pulse">BUILDING COORDINATES...</span>
                  <span className="font-bold">{syncProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    className="h-full bg-white rounded-full"
                    style={{ width: `${syncProgress}%` }}
                    animate={{ width: `${syncProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pipeline logs console */}
          <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 flex flex-col gap-2.5 flex-1 min-h-0">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-white/90 uppercase tracking-wider shrink-0">
              <span className="flex items-center gap-2">
                <Terminal size={13} className="text-secondary-txt" />
                Pipeline Console
              </span>
              {isSyncing && (
                <span className="text-[8px] px-1.5 py-0.2 bg-white/10 border border-white/20 text-white uppercase rounded animate-pulse">
                  Active
                </span>
              )}
            </div>

            <div className="flex-1 min-h-0 bg-black/60 border border-white/10 rounded-lg p-3 font-mono text-[10px] text-white/80 overflow-y-auto custom-scrollbar flex flex-col gap-1 select-text">
              {logs.map((log, index) => {
                let colorClass = 'text-white/60';
                if (log.startsWith('[SUCCESS]')) colorClass = 'text-[#00FF66] font-semibold';
                else if (log.startsWith('[INIT]') || log.startsWith('[STATUS]')) colorClass = 'text-white';
                else if (log.startsWith('[WIPE]') || log.startsWith('[EXCLUSION]')) colorClass = 'text-red-400';
                else if (log.startsWith('[MOCK_TAURI]')) colorClass = 'text-amber-400';

                return (
                  <div key={index} className={`${colorClass} leading-relaxed break-all`}>
                    {log}
                  </div>
                );
              })}
              {isSyncing && (
                <div className="text-white/40 animate-pulse flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-3 bg-white animate-pulse" />
                  Calculating vectors...
                </div>
              )}
              <div ref={logsEndRef} />
            </div>
          </div>

        </div>

      </div>

      {/* FOOTER METADATA INFO */}
      <div className="flex items-start gap-2 bg-white/[0.01] border border-white/5 rounded-xl p-3 max-w-full shrink-0">
        <Info className="text-white/60 shrink-0 mt-0.5" size={13} />
        <div className="text-[10px] font-mono text-secondary-txt/70 leading-normal">
          DATABASE DIAGNOSTIC LAYER ACTIVE: Local vectors stored in <code>SQLite-VSS</code> virtual columns. Discovered files list excludes hidden folders and non-supported formats. All operations are run securely on-device.
        </div>
      </div>
      
    </div>
  );
};
