import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

export interface RagTelemetry {
  totalNotes: number;
  indexedNotes: number;
  totalChunks: number;
  dbSize: string;
}

export interface DiscoveredFolder {
  id: string;
  name: string;
  count: number;
  excluded: boolean;
}

export interface SearchResult {
  note: string;
  score: number;
  content: string;
}

export interface IndexingProgressPayload {
  level: string;
  message: string;
  progress: number;
}

const isTauri = () => {
  return typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;
};

// ─── Browser Mock Data ──────────────────────────────────────────────────────
let mockTelemetry: RagTelemetry = {
  totalNotes: 412,
  indexedNotes: 343,
  totalChunks: 2401,
  dbSize: '4.6 MB'
};

let mockFolders: DiscoveredFolder[] = [
  { id: '1', name: 'Manuals', count: 48, excluded: false },
  { id: '2', name: 'Project_Specs', count: 85, excluded: false },
  { id: '3', name: 'Notes', count: 210, excluded: false },
  { id: '4', name: 'Templates', count: 12, excluded: true },
  { id: '5', name: 'Archives', count: 57, excluded: true }
];

// Helper to check if a tauri command is implemented/available
async function tryInvoke<T>(cmd: string, args?: Record<string, any>): Promise<T | null> {
  if (!isTauri()) return null;
  try {
    return await invoke<T>(cmd, args);
  } catch (err: any) {
    // If command is not found/registered on the backend, return null to trigger mock fallback
    if (err && (String(err).includes("not found") || String(err).includes("unknown cmd"))) {
      console.warn(`[ragService] Tauri command "${cmd}" not registered on backend. Using mockup fallback.`);
      return null;
    }
    throw err;
  }
}

export const getRagTelemetry = async (): Promise<RagTelemetry> => {
  const result = await tryInvoke<any>("get_rag_telemetry");
  if (result) {
    return {
      totalNotes: result.total_notes,
      indexedNotes: result.indexed_notes,
      totalChunks: result.total_chunks,
      dbSize: result.db_size
    };
  }
  return { ...mockTelemetry };
};

export const getRagDirectories = async (vaultPath: string): Promise<DiscoveredFolder[]> => {
  const result = await tryInvoke<any[]>("get_rag_directories", { vaultPath });
  if (result) {
    return result.map(f => ({
      id: f.id,
      name: f.name,
      count: f.count,
      excluded: f.excluded
    }));
  }
  return [...mockFolders];
};

export const toggleRagExclusion = async (dirName: string): Promise<boolean> => {
  const result = await tryInvoke<boolean>("toggle_rag_exclusion", { dirName });
  if (result !== null) {
    return result;
  }
  // Simulated toggle
  const idx = mockFolders.findIndex(f => f.name === dirName);
  if (idx !== -1) {
    mockFolders[idx].excluded = !mockFolders[idx].excluded;
    // Adjust mock stats
    const noteDiff = mockFolders[idx].count;
    if (mockFolders[idx].excluded) {
      mockTelemetry.indexedNotes = Math.max(0, mockTelemetry.indexedNotes - noteDiff);
    } else {
      mockTelemetry.indexedNotes = Math.min(mockTelemetry.totalNotes, mockTelemetry.indexedNotes + noteDiff);
    }
    mockTelemetry.totalChunks = Math.round(mockTelemetry.indexedNotes * 7.0);
    return mockFolders[idx].excluded;
  }
  return false;
};

export const clearRagDatabase = async (): Promise<void> => {
  const result = await tryInvoke<void>("clear_rag_database");
  if (result !== null) {
    return;
  }
  // Simulated wipe
  mockTelemetry = {
    totalNotes: 412,
    indexedNotes: 0,
    totalChunks: 0,
    dbSize: '0.0 KB'
  };
};

export const queryRagSandbox = async (query: string): Promise<SearchResult[]> => {
  const result = await tryInvoke<any[]>("query_rag_sandbox", { query });
  if (result) {
    return result.map(r => ({
      note: r.note,
      score: r.score,
      content: r.content
    }));
  }
  
  // Simulated query match
  await new Promise(r => setTimeout(r, 400));
  return [
    {
      note: 'Project_Specs/AI System.md',
      score: 0.942,
      content: `The system architecture uses a local SQLite-VSS instance to run semantic searches locally. High-dimensional vector spaces allow finding contextual matches even when keywords do not overlap for: "${query}".`
    },
    {
      note: 'Notes/Refinements.txt',
      score: 0.814,
      content: 'Optimized local RAG pipeline load speeds. Pre-loading local model weights to memory on boot sequence reduces initial document search latency to sub-15ms levels.'
    },
    {
      note: 'Manuals/Vector Databases.pdf',
      score: 0.768,
      content: 'Chunk overlap is critical to preserve context boundaries between cutoffs. Default overlap set to 50 tokens to ensure sentences cut in half are still fully searchable.'
    }
  ].filter(item => 
    item.content.toLowerCase().includes(query.toLowerCase()) || 
    item.note.toLowerCase().includes(query.toLowerCase()) ||
    Math.random() > 0.3
  );
};

export const startRagIndexing = async (
  vaultPath: string, 
  onProgress: (payload: IndexingProgressPayload) => void
): Promise<void> => {
  if (isTauri()) {
    let unlisten: UnlistenFn | null = null;
    try {
      unlisten = await listen<IndexingProgressPayload>("rag-status-update", (event) => {
        onProgress(event.payload);
      });
      await invoke("start_rag_indexing", { vaultPath });
      if (unlisten) unlisten();
      return;
    } catch (err: any) {
      if (unlisten) unlisten();
      // If start_rag_indexing fails with command not found, fall back to mock
      if (err && (String(err).includes("not found") || String(err).includes("unknown cmd"))) {
        console.warn("[ragService] start_rag_indexing not registered on backend. Using mock pipeline sequence.");
      } else {
        throw err;
      }
    }
  }

  // Simulated sequencing
  const sequence: Omit<IndexingProgressPayload, 'progress'>[] = [
    { level: 'INIT', message: `[START] Commencing directory scan at "${vaultPath}"` },
    { level: 'INDEX', message: '[INDEX] Scanning local files: locating .txt, .md, and .pdf documents...' },
    { level: 'INDEX', message: '[INDEX] Extracting metadata headers, titles, and layout properties...' },
    { level: 'CHUNK', message: '[CHUNK] Executing dynamic recursive text chunking (500-token blocks)...' },
    { level: 'EMBEDDING', message: '[EMBEDDING] Vectorizing chunks using local all-MiniLM-L6-v2 pipeline...' },
    { level: 'VECTORS', message: '[VECTORS] Writing chunk arrays to local vector database SQLite-VSS...' },
    { level: 'OPTIMIZE', message: '[OPTIMIZE] Rebuilding query index HNSW layers...' },
    { level: 'CLEANUP', message: '[CLEANUP] Validating local index integrity hashes...' },
    { level: 'SUCCESS', message: '[SUCCESS] Ingestion completed. Local RAG index status: OK.' }
  ];

  for (let i = 0; i < sequence.length; i++) {
    await new Promise(r => setTimeout(r, 450));
    onProgress({
      level: sequence[i].level,
      message: sequence[i].message,
      progress: Math.round(((i + 1) / sequence.length) * 100)
    });
  }

  // Update stats on complete
  mockTelemetry.indexedNotes = mockTelemetry.totalNotes - mockFolders.filter(f => f.excluded).reduce((acc, curr) => acc + curr.count, 0);
  mockTelemetry.totalChunks = Math.round(mockTelemetry.indexedNotes * 7.3);
};
