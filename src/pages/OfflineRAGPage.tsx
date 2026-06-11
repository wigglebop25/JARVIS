import { useState, useEffect, useMemo } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { getRagTelemetry, clearRagDatabase, startRagIndexing, RagTelemetry } from '@/services/ragService';
import { useDocument } from '@/hooks/useDocument';
import { getConfig, saveConfig } from '@/services/configService';
import { RAGHeader } from '@/features/rag/components/RAGHeader';
import { FolderBrowser } from '@/features/rag/components/FolderBrowser';
import { DocumentExplorer } from '@/features/rag/components/DocumentExplorer';
import { FilePreview } from '@/features/rag/components/FilePreview';
import { PipelineController } from '@/features/rag/components/PipelineController';
import { PipelineConsole } from '@/features/rag/components/PipelineConsole';
import { RAGFooter } from '@/features/rag/components/RAGFooter';

export const OfflineRAGPage = () => {
  const [vaultPath, setVaultPath] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([
    '[INIT] Node.AirGapped RAG system initialized.',
    '[STATUS] Active vector database SQLite-VSS connected.',
    '[READY] Browse your workspace folders and select documents to preview.'
  ]);

  const [stats, setStats] = useState<RagTelemetry | null>(null);
  const {
    currentPath, files: documentFiles, selectedFile, selectedFileContent,
    loading: docLoading, error: docError,
    selectFile, loadDirectory, goBack
  } = useDocument(vaultPath);

  useEffect(() => {
    const initConfig = async () => {
      try {
        const config = await getConfig();
        if (config.sandbox_dir) {
          setVaultPath(config.sandbox_dir);
        }
      } catch (err) {
        console.error('[OfflineRAGPage] Failed to fetch sandbox config:', err);
      }
    };
    initConfig();
  }, []);

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

  const handleSelectPath = async () => {
    try {
      const selected = await open({ directory: true, multiple: false, title: 'Target Local Document Folder' });
      if (selected && typeof selected === 'string') {
        const config = await getConfig();
        await saveConfig({ ...config, sandbox_dir: selected });
        setVaultPath(selected);
        setLogs(prev => [...prev, `[WORKSPACE] Workspace set to: ${selected}`, '[DISCOVERY] Loading folder entries...']);
      }
    } catch (err) {
      console.error('[OfflineRAGPage] Failed to select path:', err);
    }
  };

  const handleStartIndexing = async () => {
    setIsSyncing(true);
    setSyncProgress(0);
    setLogs(prev => [...prev, '[PIPELINE] Starting document indexing pipeline...']);
    try {
      const interval = setInterval(() => setSyncProgress(p => Math.min(p + 10, 90)), 800);
      await startRagIndexing(vaultPath, (payload) => {
        if (payload.message) setLogs(prev => [...prev, `[${payload.level}] ${payload.message}`]);
        setSyncProgress(payload.progress);
      });
      clearInterval(interval);
      setSyncProgress(100);
      setLogs(prev => [...prev, '[PIPELINE] Indexing complete.']);
      await refreshRagData();
      setTimeout(() => { setIsSyncing(false); setSyncProgress(0); }, 800);
    } catch (err) {
      console.error('[OfflineRAGPage] Indexing failed:', err);
      setLogs(prev => [...prev, `[ERROR] Indexing failed: ${err}`]);
      setIsSyncing(false);
    }
  };

  const handleClearDatabase = async () => {
    if (!window.confirm('WARNING: Proceeding will wipe all local vector database entries and indexed embeddings. This action cannot be undone. Continue?')) {
      return;
    }
    try {
      await clearRagDatabase();
      setLogs(prev => [...prev, '[PIPELINE] Vector database cleared.']);
      setStats(prev => prev ? { ...prev, totalChunks: 0, totalNotes: 0, indexedNotes: 0, dbSize: '0 KB' } : null);
    } catch (err) {
      console.error('[OfflineRAGPage] Wipe failed:', err);
      setLogs(prev => [...prev, `[ERROR] Wipe failed: ${err}`]);
    }
  };

  const folders = useMemo(() => documentFiles.filter(f => f.is_dir).map(f => f.name), [documentFiles]);
  const docs = useMemo(() => documentFiles.filter(f => !f.is_dir).map(f => ({ name: f.name, path: f.path })), [documentFiles]);

  return (
    <div className="h-full flex flex-col p-6 bg-offline-bg">
      <RAGHeader vaultPath={vaultPath} stats={stats} onSelectPath={handleSelectPath} />

      <div className="flex-1 grid grid-cols-[240px_1fr_280px] gap-4 min-h-0">
        {/* Column 1: Folder Browser */}
        <FolderBrowser
          folders={folders}
          selectedFolder={currentPath ? currentPath.split(/[/\\]/).pop() || null : null}
          onSelect={(folder) => loadDirectory(folder)}
          onBack={goBack}
        />

        {/* Column 2: Document List / File Preview */}
        {selectedFile && !docLoading ? (
          <FilePreview
            content={docError ? `**Error reading file:**\n\n${docError}` : (selectedFileContent || '_(empty document)_')}
            fileName={selectedFile.split('/').pop() || selectedFile}
            onClose={() => selectFile('')}
          />
        ) : (
          <DocumentExplorer
            documents={docs}
            onSelect={(path) => selectFile(path)}
            selectedDocument={selectedFile}
          />
        )}

        {/* Column 3: Pipeline Controller + Console */}
        <div className="flex flex-col gap-4">
          <PipelineController
            isSyncing={isSyncing}
            syncProgress={syncProgress}
            onStartIndexing={handleStartIndexing}
            onClearDatabase={handleClearDatabase}
            onRefresh={refreshRagData}
          />
          <div className="flex-1 min-h-0">
            <PipelineConsole logs={logs} />
          </div>
        </div>
      </div>

      <RAGFooter />
    </div>
  );
};
