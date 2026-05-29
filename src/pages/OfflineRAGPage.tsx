import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, FolderOpen, Database, RefreshCw, 
  Trash2, Terminal, Shield, Search, Info, Settings,
  AlertTriangle
} from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { 
  getRagTelemetry, getRagDirectories, toggleRagExclusion, 
  clearRagDatabase, queryRagSandbox, startRagIndexing,
  DiscoveredFolder, RagTelemetry
} from '@/services/ragService';

export const OfflineRAGPage = () => {
  const [vaultPath, setVaultPath] = useState('C:\\Users\\cruiz\\Documents\\KnowledgeVault');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([
    '[INIT] Node.AirGapped RAG system initialized.',
    '[STATUS] Active vector database SQLite-VSS connected.',
    '[READY] Select local directory path to build document index.'
  ]);

  const [folders, setFolders] = useState<DiscoveredFolder[]>([]);
  const [stats, setStats] = useState<RagTelemetry>({
    totalNotes: 0,
    indexedNotes: 0,
    totalChunks: 0,
    dbSize: '0.0 KB'
  });

  const [sandboxQuery, setSandboxQuery] = useState('');
  const [sandboxResults, setSandboxResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto Scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Load telemetry and directories
  const refreshData = async () => {
    try {
      const tel = await getRagTelemetry();
      setStats(tel);
      const dirs = await getRagDirectories(vaultPath);
      setFolders(dirs);
    } catch (err) {
      console.error('[OfflineRAGPage] Error loading data:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, [vaultPath]);

  const handleSelectPath = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Target Local Document Folder'
      });
      if (selected && typeof selected === 'string') {
        setVaultPath(selected);
        setLogs(prev => [
          ...prev,
          `[CONFIG] Document source redirected: "${selected}"`,
          `[DISCOVERY] Rescanning directory...`
        ]);
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
      setVaultPath(randomPath);
      setLogs(prev => [
        ...prev,
        `[MOCK_TAURI] Local browser fallback directory selection: "${randomPath}"`,
        `[DISCOVERY] Rescanning directory...`
      ]);
    }
  };

  const handleToggleFolderExclusion = async (dirName: string) => {
    try {
      const isExcluded = await toggleRagExclusion(dirName);
      setLogs(logsPrev => [
        ...logsPrev,
        `[EXCLUSION] Folder "/${dirName}" target state changed: ${isExcluded ? 'IGNORE_SOURCE' : 'INDEX_SOURCE'}`
      ]);
      await refreshData();
    } catch (err) {
      console.error('[OfflineRAGPage] Failed to toggle exclusion:', err);
    }
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
      await refreshData();
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
        await refreshData();
      } catch (err) {
        console.error('[OfflineRAGPage] Wipe failed:', err);
      }
    }
  };

  const handleSandboxSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sandboxQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await queryRagSandbox(sandboxQuery);
      setSandboxResults(results);
      setIsSearching(false);
      setLogs(prev => [
        ...prev,
        `[QUERY] Test semantic retrieval executed: "${sandboxQuery}" -> returned ${results.length} document matches.`
      ]);
    } catch (err) {
      console.error('[OfflineRAGPage] Sandbox search failed:', err);
      setIsSearching(false);
    }
  };

  return (
    <div className="h-full w-full bg-offline-bg flex flex-col p-6 overflow-y-auto custom-scrollbar">
      
      {/* ── HEADER STATUS ── */}
      <div className="flex items-center justify-between border-b border-offline-border/30 pb-4 mb-6">
        <div>
          <h1 className="font-mono text-lg font-bold tracking-[0.2em] text-primary-txt flex items-center gap-3">
            <Database className="text-offline-core animate-pulse" size={20} />
            LOCAL_KNOWLEDGE_CORE
          </h1>
          <p className="text-[10px] font-mono text-secondary-txt/55 mt-1 tracking-wider">
            LOCAL DIRECTORY VECTOR STORAGE ENGINE & INDEXING PIPELINE
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-offline-core/5 border border-offline-core/25 rounded-md">
            <span className="w-2 h-2 rounded-full bg-offline-core shadow-[0_0_8px_var(--color-offline-core)] animate-pulse" />
            <span className="font-mono text-[9px] text-offline-core font-bold uppercase tracking-widest">
              Secured_Database
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-secondary-txt/30">
            <Shield size={10} /> Local_Node_Only
          </div>
        </div>
      </div>

      {/* ── TWO COLUMN WORKSPACE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch">
        
        {/* LEFT COLUMN: CONTROL & DIAGNOSTICS (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* compartment 1: Path configuration */}
          <div className="bg-offline-surface-dark border border-offline-border/50 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-offline-core/80 uppercase tracking-wider">
              <Settings size={14} className="text-offline-core/60" />
              Source_Connection_Parameters
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-mono text-secondary-txt/40 uppercase tracking-wider">Document Folder Path (Vault)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={vaultPath}
                  onChange={(e) => setVaultPath(e.target.value)}
                  className="flex-1 bg-black/45 border border-white/5 focus:border-offline-core/30 rounded px-3 py-2 text-xs font-mono text-secondary-txt outline-none"
                  placeholder="Enter path manually..."
                />
                <button
                  onClick={handleSelectPath}
                  disabled={isSyncing}
                  className="px-3 bg-white/5 border border-white/10 rounded text-xs font-mono text-secondary-txt hover:bg-white/10 hover:text-white transition-all cursor-pointer disabled:opacity-30"
                >
                  Browse
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleIndexVault}
                disabled={isSyncing || !vaultPath}
                className="flex items-center gap-2 px-5 py-2.5 bg-offline-core text-offline-bg font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg hover:bg-offline-core/85 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
              >
                <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'Indexing_Vault...' : 'Index_Directory'}
              </button>
              
              <button
                onClick={handleClearDatabase}
                disabled={isSyncing || stats.totalChunks === 0}
                className="flex items-center gap-2 px-4 py-2.5 border border-red-500/30 hover:border-red-500/50 hover:bg-red-500/5 text-red-400 font-mono text-xs uppercase tracking-wider rounded-lg transition-all disabled:opacity-30 cursor-pointer"
              >
                <Trash2 size={12} />
                Wipe_Database
              </button>
            </div>

            {/* Sync Progress Bar */}
            {isSyncing && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-offline-core/80">
                  <span>VECTORIZING PAYLOAD</span>
                  <span>{syncProgress}%</span>
                </div>
                <div className="h-1 bg-black/50 rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    className="h-full bg-offline-core rounded-full"
                    style={{ width: `${syncProgress}%` }}
                    animate={{ width: `${syncProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Compartment 2: Metrics */}
          <div className="bg-offline-surface-dark border border-offline-border/50 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div className="text-xs font-mono font-bold text-offline-core/80 uppercase tracking-wider">
              Diagnostic_Database_Telemetry
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-black/35 border border-white/5 rounded-lg p-3 text-center">
                <div className="text-[10px] font-mono text-secondary-txt/45 uppercase tracking-wider">Discovered</div>
                <div className="text-lg font-mono font-bold text-primary-txt mt-1">{stats.totalNotes}</div>
                <div className="text-[8px] font-mono text-secondary-txt/30 mt-0.5 uppercase">Files (.md/txt/pdf)</div>
              </div>
              <div className="bg-black/35 border border-white/5 rounded-lg p-3 text-center">
                <div className="text-[10px] font-mono text-secondary-txt/45 uppercase tracking-wider">Indexed</div>
                <div className="text-lg font-mono font-bold text-offline-core mt-1">{stats.indexedNotes}</div>
                <div className="text-[8px] font-mono text-secondary-txt/30 mt-0.5 uppercase">
                  {stats.totalNotes > 0 ? Math.round((stats.indexedNotes / stats.totalNotes) * 100) : 0}% Complete
                </div>
              </div>
              <div className="bg-black/35 border border-white/5 rounded-lg p-3 text-center">
                <div className="text-[10px] font-mono text-secondary-txt/45 uppercase tracking-wider">Vectors</div>
                <div className="text-lg font-mono font-bold text-primary-txt mt-1">{stats.totalChunks}</div>
                <div className="text-[8px] font-mono text-secondary-txt/30 mt-0.5 uppercase">Chunks Ingested</div>
              </div>
              <div className="bg-black/35 border border-white/5 rounded-lg p-3 text-center">
                <div className="text-[10px] font-mono text-secondary-txt/45 uppercase tracking-wider">Size</div>
                <div className="text-lg font-mono font-bold text-primary-txt mt-1">{stats.dbSize}</div>
                <div className="text-[8px] font-mono text-secondary-txt/30 mt-0.5 uppercase">Disk Usage</div>
              </div>
            </div>

            <div className="flex gap-3 bg-black/15 border border-white/5 rounded-lg p-3 items-center text-[10px] font-mono text-secondary-txt/60">
              <Info className="text-offline-core shrink-0" size={16} />
              <div className="leading-relaxed">
                Embedding Model: <strong className="text-offline-core">all-MiniLM-L6-v2 (Local ONNX)</strong> | Hardware Acceleration: <strong className="text-offline-core">CPU/DirectML</strong>. Slices documents and metadata blocks for semantic vectorization.
              </div>
            </div>
          </div>

          {/* Compartment 3: Sandbox Playground */}
          <div className="bg-offline-surface-dark border border-offline-border/50 rounded-xl p-5 shadow-lg flex flex-col gap-4 flex-1">
            <div className="text-xs font-mono font-bold text-offline-core/80 uppercase tracking-wider">
              Retrieval_Query_Sandbox
            </div>

            <form onSubmit={handleSandboxSearch} className="flex gap-2">
              <input 
                type="text" 
                value={sandboxQuery}
                onChange={(e) => setSandboxQuery(e.target.value)}
                placeholder="Enter query to test local vector semantic similarity..."
                className="flex-1 bg-black/45 border border-white/5 focus:border-offline-core/30 rounded px-3 py-2 text-xs font-mono text-secondary-txt outline-none"
              />
              <button
                type="submit"
                disabled={isSearching || stats.totalChunks === 0}
                className="px-4 bg-offline-core text-offline-bg rounded text-xs font-mono font-bold uppercase tracking-wider hover:bg-offline-core/90 transition-all cursor-pointer disabled:opacity-30"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </form>

            <div className="flex-1 border border-white/5 bg-black/25 rounded-lg p-3 overflow-y-auto custom-scrollbar max-h-[220px] min-h-[140px] flex flex-col gap-3">
              <AnimatePresence mode="wait">
                {isSearching ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-xs font-mono text-offline-core/60 gap-2">
                    <RefreshCw className="animate-spin" size={18} />
                    Calculating cosine distance matrices...
                  </div>
                ) : sandboxResults.length > 0 ? (
                  sandboxResults.map((res, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-white/5 bg-white/[0.01] rounded p-2.5 text-xs font-mono space-y-1.5 hover:border-offline-core/20 hover:bg-white/[0.02] transition-all"
                    >
                      <div className="flex justify-between text-[10px] text-offline-core/70 font-bold">
                        <span className="truncate">{res.note}</span>
                        <span>SIMILARITY: {res.score}</span>
                      </div>
                      <p className="text-secondary-txt/80 text-[11px] leading-relaxed select-text">
                        {res.content}
                      </p>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-xs font-mono text-secondary-txt/30 gap-1.5 text-center px-4">
                    <Search size={16} className="opacity-40" />
                    <span>No queries active. Ingest database to search documents.</span>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
        </div>

        {/* RIGHT COLUMN: DIRECTORIES TREE & LOG CONSOLE (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6 items-stretch">
          
          {/* Exclusion Tree */}
          <div className="bg-offline-surface-dark border border-offline-border/50 rounded-xl p-5 shadow-lg flex flex-col gap-4">
            <div className="text-xs font-mono font-bold text-offline-core/80 uppercase tracking-wider">
              Ignored_Directories_Tree
            </div>
            
            <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
              {folders.map(folder => (
                <div 
                  key={folder.id}
                  onClick={() => handleToggleFolderExclusion(folder.name)}
                  className={`flex items-center gap-3 p-2.5 border rounded-lg cursor-pointer transition-all duration-200 select-none
                    ${folder.excluded 
                      ? 'border-dashed border-red-500/20 bg-red-500/[0.02] opacity-50 hover:opacity-75 hover:bg-red-500/[0.04]' 
                      : 'border-white/5 bg-black/15 hover:border-offline-core/30 hover:bg-offline-core/[0.02]'
                    }
                  `}
                >
                  <div className={folder.excluded ? 'text-red-400' : 'text-offline-core'}>
                    {folder.excluded ? <FolderOpen size={16} /> : <Folder size={16} />}
                  </div>
                  
                  <div className="flex-1 font-mono text-xs">
                    <div className={folder.excluded ? 'text-red-400 font-semibold' : 'text-primary-txt'}>
                      /{folder.name}
                    </div>
                    <div className="text-[9px] text-secondary-txt/40 mt-0.5">
                      {folder.count} documents discovered
                    </div>
                  </div>

                  <div className="flex items-center">
                    {folder.excluded ? (
                      <span className="text-[8px] font-mono px-1.5 py-0.5 bg-red-500/10 border border-red-500/35 text-red-400 uppercase rounded">
                        Ignored
                      </span>
                    ) : (
                      <span className="text-[8px] font-mono px-1.5 py-0.5 bg-offline-core/10 border border-offline-core/35 text-offline-core uppercase rounded">
                        Indexed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/10 rounded-lg p-2.5 text-[9px] font-mono text-red-400/80">
              <AlertTriangle className="shrink-0 text-red-400" size={12} />
              <span>System metadata subfolders (like <code>.git/</code> or config folders) are dynamically blocked by default security protocols.</span>
            </div>
          </div>

          {/* Monospace output terminal logs */}
          <div className="bg-offline-surface-dark border border-offline-border/50 rounded-xl p-5 shadow-lg flex flex-col gap-4 flex-1 min-h-[300px]">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-offline-core/80 uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <Terminal size={14} className="text-offline-core/60" />
                Pipeline_Status_Console
              </span>
              {isSyncing && (
                <span className="text-[8px] px-1.5 py-0.5 bg-offline-core/10 border border-offline-core/30 text-offline-core uppercase rounded animate-pulse">
                  Syncing
                </span>
              )}
            </div>

            {/* Terminal logs block */}
            <div className="flex-1 bg-black/60 border border-white/5 rounded-lg p-4 font-mono text-[10px] text-secondary-txt/80 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 max-h-[360px]">
              {logs.map((log, index) => {
                let colorClass = 'text-secondary-txt/70';
                if (log.startsWith('[SUCCESS]')) colorClass = 'text-success-green font-bold';
                else if (log.startsWith('[INIT]') || log.startsWith('[STATUS]')) colorClass = 'text-offline-core';
                else if (log.startsWith('[WIPE]') || log.startsWith('[EXCLUSION]')) colorClass = 'text-red-400';
                else if (log.startsWith('[MOCK_TAURI]')) colorClass = 'text-yellow-400/85';

                return (
                  <div key={index} className={`${colorClass} leading-relaxed select-text break-all`}>
                    {log}
                  </div>
                );
              })}
              {isSyncing && (
                <div className="text-offline-core/60 animate-pulse flex items-center gap-1.5">
                  <span className="w-1.5 h-3 bg-offline-core animate-pulse" />
                  Processing documents...
                </div>
              )}
              <div ref={logsEndRef} />
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
