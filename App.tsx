
import React, { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  Trash2, 
  Download, 
  Plus, 
  Settings2, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileArchive
} from 'lucide-react';
import JSZip from 'jszip';
import { DEFAULT_FORMATS } from './constants';
import { ImageFormat, ProcessingFile, ProcessedResult } from './types';
import { processImageFile } from './utils/imageProcessor';

const App: React.FC = () => {
  const [files, setFiles] = useState<ProcessingFile[]>([]);
  const [formats, setFormats] = useState<ImageFormat[]>(DEFAULT_FORMATS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    const selectedFiles = Array.from(fileList);
    const newFiles: ProcessingFile[] = selectedFiles.map((file: File) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending',
      progress: 0,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const addFormat = () => {
    const newFormat: ImageFormat = {
      id: Math.random().toString(36).substr(2, 9),
      width: 1080,
      height: 1920,
      label: 'New Format'
    };
    setFormats(prev => [...prev, newFormat]);
  };

  const updateFormat = (id: string, field: keyof ImageFormat, value: string | number) => {
    setFormats(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const removeFormat = (id: string) => {
    if (formats.length > 1) {
      setFormats(prev => prev.filter(f => f.id !== id));
    }
  };

  const startProcessing = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    const updatedFiles = [...files];
    
    for (let i = 0; i < updatedFiles.length; i++) {
      const item = updatedFiles[i];
      if (item.status === 'completed') continue;

      try {
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'processing', progress: 50 } : f));
        
        const results = await processImageFile(item.file, formats);
        
        setFiles(prev => prev.map(f => f.id === item.id ? { 
          ...f, 
          status: 'completed', 
          progress: 100,
          results 
        } : f));
      } catch (err) {
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error' } : f));
      }
    }
    
    setIsProcessing(false);
  };

  const downloadAllAsZip = async () => {
    const zip = new JSZip();
    let hasContent = false;

    files.forEach(file => {
      if (file.results) {
        file.results.forEach(res => {
          zip.file(res.fileName, res.blob);
          hasContent = true;
        });
      }
    });

    if (!hasContent) return;

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `processed_images_${new Date().getTime()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Render Helpers ---

  const totalProcessed = files.filter(f => f.status === 'completed').length;
  const canDownload = totalProcessed > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Mass Image Processor</h1>
          <p className="text-slate-500 mt-1">Batch resize and export images with white padding locally.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Settings2 size={18} />
            Config
          </button>
          {canDownload && (
            <button 
              onClick={downloadAllAsZip}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm font-medium"
            >
              <FileArchive size={18} />
              Download ZIP
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar: Controls & Settings */}
        <aside className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Settings Section */}
          <div className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-200 ${showSettings ? 'block' : 'hidden lg:block'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Settings2 size={18} className="text-indigo-600" />
                Target Formats
              </h2>
              <button 
                onClick={addFormat}
                className="p-1 hover:bg-indigo-50 text-indigo-600 rounded-full transition-colors"
                title="Add format"
              >
                <Plus size={20} />
              </button>
            </div>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {formats.map((format) => (
                <div key={format.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                  <input 
                    type="text" 
                    value={format.label}
                    onChange={(e) => updateFormat(format.id, 'label', e.target.value)}
                    className="w-full bg-transparent font-medium text-sm mb-2 outline-none border-b border-transparent focus:border-indigo-300 transition-colors"
                  />
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={format.width}
                      onChange={(e) => updateFormat(format.id, 'width', parseInt(e.target.value) || 0)}
                      className="w-16 p-1 text-xs border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                    <span className="text-slate-400 text-xs">x</span>
                    <input 
                      type="number" 
                      value={format.height}
                      onChange={(e) => updateFormat(format.id, 'height', parseInt(e.target.value) || 0)}
                      className="w-16 p-1 text-xs border border-slate-200 rounded text-center outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                    <button 
                      onClick={() => removeFormat(format.id)}
                      className="ml-auto opacity-0 group-hover:opacity-100 text-rose-500 p-1 hover:bg-rose-50 rounded transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="mt-4 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              Local Processing: ON
            </p>
          </div>

          <button 
            disabled={files.length === 0 || isProcessing}
            onClick={startProcessing}
            className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-lg shadow-lg transition-all ${
              files.length === 0 || isProcessing
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-[0.98]'
            }`}
          >
            {isProcessing ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Upload size={22} />
            )}
            {isProcessing ? 'Processing...' : 'Run Automation'}
          </button>
        </aside>

        {/* Main Content: File List & Dropzone */}
        <main className="lg:col-span-3 space-y-6">
          
          {/* Dropzone */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const droppedFiles = Array.from(e.dataTransfer.files);
              const newFiles: ProcessingFile[] = droppedFiles.map((file: File) => ({
                id: Math.random().toString(36).substr(2, 9),
                file,
                previewUrl: URL.createObjectURL(file),
                status: 'pending',
                progress: 0,
              }));
              setFiles(prev => [...prev, ...newFiles]);
            }}
            className="border-2 border-dashed border-slate-300 bg-white rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
          >
            <input 
              type="file" 
              multiple 
              accept=".webp,.png,.jpg,.jpeg" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileSelection}
            />
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload size={32} />
            </div>
            <h3 className="text-xl font-semibold text-slate-800">Click or Drag images here</h3>
            <p className="text-slate-500 mt-2">Supports WebP, PNG, and JPG. Processing is done in your browser.</p>
          </div>

          {/* File Queue */}
          {files.length > 0 && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="font-semibold text-slate-700">Queue ({files.length} files)</span>
                <button 
                  onClick={() => setFiles([])}
                  className="text-sm text-slate-500 hover:text-rose-600 transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {files.map((item) => (
                  <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors group">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0">
                      <img src={item.previewUrl} alt="preview" className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{item.file.name}</p>
                      <p className="text-xs text-slate-400">{(item.file.size / 1024).toFixed(1)} KB</p>
                    </div>

                    <div className="flex items-center gap-6 px-4">
                      {item.status === 'pending' && <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending</span>}
                      {item.status === 'processing' && <Loader2 size={18} className="animate-spin text-indigo-500" />}
                      {item.status === 'completed' && <CheckCircle2 size={18} className="text-emerald-500" />}
                      {item.status === 'error' && <AlertCircle size={18} className="text-rose-500" />}
                    </div>

                    <button 
                      onClick={() => removeFile(item.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {files.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
              <ImageIcon size={64} className="text-slate-300 mb-4" />
              <p className="text-slate-400 font-medium">No files selected</p>
            </div>
          )}
        </main>
      </div>
      
      {/* Footer Info */}
      <footer className="mt-20 text-center py-8 border-t border-slate-200">
        <p className="text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} Mass Image Processor Pro. 100% Client-Side. High Privacy. No Server Uploads.
        </p>
      </footer>
    </div>
  );
};

export default App;
