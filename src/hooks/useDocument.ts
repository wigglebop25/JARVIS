import { useState, useEffect, useCallback } from 'react';
import { 
  listDirectory, readDocument, writeDocument, SandboxFile 
} from '@/services/documentService';

export const useDocument = (initialPath = "") => {
  const [currentPath, setCurrentPath] = useState<string>(initialPath);
  const [files, setFiles] = useState<SandboxFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load files in the directory
  const loadDirectory = useCallback(async (path?: string) => {
    setLoading(true);
    setError(null);
    try {
      const targetPath = path !== undefined ? path : currentPath;
      const parsedFiles = await listDirectory(targetPath);
      setFiles(parsedFiles);
      if (path !== undefined) {
        setCurrentPath(path);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load directory");
      console.error("[useDocument] Error listing directory:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  // Read a single document
  const selectFile = useCallback(async (filePath: string) => {
    setLoading(true);
    setError(null);
    try {
      const content = await readDocument(filePath);
      setSelectedFile(filePath);
      setSelectedFileContent(content);
    } catch (err: any) {
      setError(err?.message || `Failed to read document: ${filePath}`);
      console.error("[useDocument] Error reading file:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save/write a document
  const saveFile = useCallback(async (filePath: string, content: string, append = false) => {
    setLoading(true);
    setError(null);
    try {
      await writeDocument(filePath, content, append);
      if (selectedFile === filePath) {
        setSelectedFileContent(content);
      }
    } catch (err: any) {
      setError(err?.message || `Failed to write document: ${filePath}`);
      console.error("[useDocument] Error writing file:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedFile]);

  // Navigate up one folder level
  const goBack = useCallback(() => {
    if (!currentPath) return;
    const parts = currentPath.split(/[/\\]/);
    parts.pop();
    const parentPath = parts.join("/");
    loadDirectory(parentPath);
  }, [currentPath, loadDirectory]);

  // Load directory on mount
  useEffect(() => {
    loadDirectory();
  }, [loadDirectory]);

  return {
    currentPath,
    files,
    selectedFile,
    selectedFileContent,
    loading,
    error,
    setSelectedFile,
    setSelectedFileContent,
    loadDirectory,
    selectFile,
    saveFile,
    goBack
  };
};
