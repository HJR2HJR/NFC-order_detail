import React, { useCallback, useState } from 'react';
import { Upload, FilePlus, FileText, Table2 } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DropZoneProps {
  onFilesAccepted: (files: File[]) => void;
}

export function DropZone({ onFilesAccepted }: DropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = (Array.from(e.dataTransfer.files) as File[]).filter(file => {
        const name = file.name.toLowerCase();
        return name.endsWith('.txt') || name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls');
      });
      if (files.length > 0) {
        onFilesAccepted(files);
      }
    }
  }, [onFilesAccepted]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = (Array.from(e.target.files) as File[]).filter(file => {
        const name = file.name.toLowerCase();
        return name.endsWith('.txt') || name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls');
      });
      if (files.length > 0) {
        onFilesAccepted(files);
      }
    }
  }, [onFilesAccepted]);

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative group flex min-h-36 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed transition-all duration-200 ease-in-out",
        isDragActive 
          ? "border-emerald-500 bg-emerald-50" 
          : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-white"
      )}
    >
      <input
        type="file"
        multiple
        accept=".txt,.csv,.xlsx,.xls"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      
      <div className="pointer-events-none flex flex-col items-center justify-center space-y-3 px-4 text-center">
        <div className={cn(
          "rounded-lg p-3 shadow-sm transition-colors duration-200",
          isDragActive ? "bg-emerald-100 text-emerald-700" : "bg-white text-slate-500 group-hover:text-slate-700"
        )}>
          {isDragActive ? <FilePlus size={32} /> : <Upload size={32} />}
        </div>
        
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-800">
            {isDragActive ? "松开鼠标即可上传" : "点击或拖拽 TXT/CSV/Excel 文件到此处"}
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1">
              <FileText size={13} /> TXT / CSV
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1">
              <Table2 size={13} /> XLS / XLSX
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
