import { invoke } from "@tauri-apps/api/core";

const isTauri = () =>
  typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;

export interface SandboxFile {
  name: string;
  is_dir: boolean;
  path: string;
  size?: number;
}

// ─── Browser Mock Data ──────────────────────────────────────────────────────
const mockRootFiles: SandboxFile[] = [
  { name: "Manuals", is_dir: true, path: "Manuals" },
  { name: "Project_Specs", is_dir: true, path: "Project_Specs" },
  { name: "Notes", is_dir: true, path: "Notes" },
  { name: "readme.md", is_dir: false, path: "readme.md", size: 1240 },
  { name: "todo.txt", is_dir: false, path: "todo.txt", size: 312 }
];

const mockSubFiles: Record<string, SandboxFile[]> = {
  "Manuals": [
    { name: "Vector Databases.pdf", is_dir: false, path: "Manuals/Vector Databases.pdf", size: 89432 },
    { name: "Tauri Integration.md", is_dir: false, path: "Manuals/Tauri Integration.md", size: 4122 }
  ],
  "Project_Specs": [
    { name: "AI System.md", is_dir: false, path: "Project_Specs/AI System.md", size: 12041 },
    { name: "Database Schema.json", is_dir: false, path: "Project_Specs/Database Schema.json", size: 5122 }
  ],
  "Notes": [
    { name: "Refinements.txt", is_dir: false, path: "Notes/Refinements.txt", size: 3412 },
    { name: "Ideas.md", is_dir: false, path: "Notes/Ideas.md", size: 1822 }
  ]
};

const mockContents: Record<string, string> = {
  "readme.md": `# JARVIS Local Knowledge Core\n\nWelcome to your offline personal assistant sandbox. All files in this directory are indexed in your local vector space and parsed safely on-device.\n\n### System Configuration\n- Database Layer: SQLite-VSS\n- Embedding Engine: all-MiniLM-L6-v2 ONNX\n- Isolation Level: Air-gapped`,
  "todo.txt": `- Update LLM configuration parameters\n- Perform vector sync on Project Spec documents\n- Run similarity matches in the Query Sandbox\n- Clean up temporary logs from indexing runs`,
  "Manuals/Tauri Integration.md": `# Tauri Dialog & File Integrations\n\nThis system leverages the Tauri Dialog plugin to browse native host directory paths and restrict active context to isolated subfolders.`,
  "Project_Specs/AI System.md": `# Project Specification: AI System\n\nThe local AI assistant system uses embedding vectors to retrieve context matching user queries. The system runs safely without sending documents to cloud APIs.`,
  "Notes/Refinements.txt": `Optimized local RAG pipeline load speeds.\nPre-loading local model weights to memory on boot sequence reduces initial document search latency to sub-15ms levels.`
};

export const readDocument = async (path: string): Promise<string> => {
  if (!isTauri()) {
    return mockContents[path] || `[MOCK CONTENT] File content for: ${path}\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam at interdum velit.`;
  }
  return await invoke<string>("read_document", { path });
};

export const writeDocument = async (
  path: string, content: string, append?: boolean
): Promise<string> => {
  if (!isTauri()) {
    if (append) {
      mockContents[path] = (mockContents[path] || "") + "\n" + content;
    } else {
      mockContents[path] = content;
    }
    return "ok";
  }
  return await invoke<string>("write_document", { path, content, append });
};

export const listDirectory = async (path?: string): Promise<SandboxFile[]> => {
  let raw: string;
  if (!isTauri()) {
    const cleanPath = path ? path.replace(/[/\\]$/, "") : "";
    raw = !cleanPath ? JSON.stringify(mockRootFiles) : JSON.stringify(mockSubFiles[cleanPath] || []);
  } else {
    raw = await invoke<string>("list_directory", { path: path ?? null });
  }

  try {
    return JSON.parse(raw);
  } catch (e) {
    const lines = raw.split('\n');
    const files: SandboxFile[] = [];
    const parentPrefix = path ? path.replace(/[/\\]$/, "").replace(/\\/g, "/") : "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith('[DIR]')) {
        const folderName = trimmed.replace(/^\[DIR\]\s*/, '').trim();
        const relativePath = parentPrefix ? `${parentPrefix}/${folderName}` : folderName;
        files.push({
          name: folderName,
          is_dir: true,
          path: relativePath
        });
      } else {
        // Line can start with "-" or just be a filename. E.g. "- readme.md (1.2KB)"
        let clean = trimmed.replace(/^-\s*/, '').trim();
        const sizeMatch = clean.match(/\(([^)]+)\)$/);
        let sizeBytes: number | undefined;
        let name = clean;

        if (sizeMatch) {
          name = clean.substring(0, clean.lastIndexOf(sizeMatch[0])).trim();
          const sizeStr = sizeMatch[1].toUpperCase();
          const numVal = parseFloat(sizeStr);
          if (!isNaN(numVal)) {
            if (sizeStr.includes('KB') || sizeStr.includes('K')) {
              sizeBytes = Math.round(numVal * 1024);
            } else if (sizeStr.includes('MB') || sizeStr.includes('M')) {
              sizeBytes = Math.round(numVal * 1024 * 1024);
            } else if (sizeStr.includes('GB') || sizeStr.includes('G')) {
              sizeBytes = Math.round(numVal * 1024 * 1024 * 1024);
            } else {
              sizeBytes = Math.round(numVal);
            }
          }
        }

        const relativePath = parentPrefix ? `${parentPrefix}/${name}` : name;
        files.push({
          name,
          is_dir: false,
          path: relativePath,
          size: sizeBytes
        });
      }
    }
    return files;
  }
};

export const globSearch = async (pattern: string): Promise<string> => {
  if (!isTauri()) {
    const results = [...mockRootFiles];
    Object.values(mockSubFiles).forEach(subList => results.push(...subList));
    const filtered = results.filter(f => f.name.toLowerCase().includes(pattern.replace(/\*/g, "").toLowerCase()));
    return JSON.stringify(filtered);
  }
  return await invoke<string>("glob_search", { pattern });
};

export const grepSearch = async (
  query: string, path?: string, caseSensitive?: boolean
): Promise<string> => {
  if (!isTauri()) {
    const results: { file: string; match: string }[] = [];
    Object.entries(mockContents).forEach(([filePath, content]) => {
      if (path && !filePath.startsWith(path)) return;
      const lines = content.split("\n");
      lines.forEach(line => {
        const isMatch = caseSensitive 
          ? line.includes(query) 
          : line.toLowerCase().includes(query.toLowerCase());
        if (isMatch) {
          results.push({ file: filePath, match: line.trim() });
        }
      });
    });
    return JSON.stringify(results);
  }
  return await invoke<string>("grep_search", {
    query, path: path ?? null, caseSensitive: caseSensitive ?? null,
  });
};
