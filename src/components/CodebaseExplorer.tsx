import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import {
  Folder,
  FileCode,
  Download,
  Copy,
  CheckCircle2,
  Terminal,
  ExternalLink,
  Search,
} from 'lucide-react';

export const CodebaseExplorer: React.FC = () => {
  const [files, setFiles] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<string>('apps/calculator/services/math_engine.py');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/v1/python-files')
      .then((res) => res.json())
      .then((data) => {
        if (data.files && Object.keys(data.files).length > 0) {
          setFiles(data.files);
          if (!data.files[selectedFile]) {
            const firstKey = Object.keys(data.files)[0];
            setSelectedFile(firstKey);
          }
        }
      })
      .catch(() => {
        // ignore
      });
  }, []);

  const handleCopyCode = () => {
    const code = files[selectedFile] || '';
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      for (const [filePath, content] of Object.entries(files)) {
        zip.file(filePath, content);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'omnimath-drf-aiogram-project.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const fileKeys = Object.keys(files).filter((f) =>
    f.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Folder className="w-5 h-5 text-emerald-400" />
            Django REST Framework & Aiogram 3 Project Codebase
          </h2>
          <p className="text-xs text-slate-400">
            Full production-ready PEP8 Python project files. Inspect, copy, or download as a complete ready-to-run ZIP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 cursor-pointer transition-colors"
          >
            {copied ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>Copy File</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={isZipping || Object.keys(files).length === 0}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs cursor-pointer shadow-md transition-all disabled:opacity-50"
          >
            {isZipping ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Download Project (.ZIP)</span>
          </button>
        </div>
      </div>

      {/* Main split view */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 overflow-hidden">
        {/* File Tree Navigation */}
        <div className="md:col-span-1 bg-slate-900/60 border-r border-slate-800/80 p-3 flex flex-col space-y-3 overflow-y-auto">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 outline-none"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 block px-2">
              Project Structure ({fileKeys.length} files)
            </span>

            {fileKeys.map((f) => {
              const isSelected = f === selectedFile;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSelectedFile(f)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-2 truncate cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{f}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Code View with Line Numbers */}
        <div className="md:col-span-3 flex flex-col bg-slate-950 overflow-hidden">
          <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-emerald-400 font-semibold">{selectedFile}</span>
            <span className="text-slate-400">
              {(files[selectedFile] || '').split('\n').length} lines
            </span>
          </div>

          <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-300">
            <pre className="overflow-x-auto">
              {(files[selectedFile] || '// Loading file content...').split('\n').map((line, idx) => (
                <div key={idx} className="table-row hover:bg-slate-900/60 transition-colors">
                  <span className="table-cell pr-4 text-right select-none text-slate-400 w-10">
                    {idx + 1}
                  </span>
                  <span className="table-cell whitespace-pre">{line}</span>
                </div>
              ))}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
