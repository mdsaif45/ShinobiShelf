import React, { useState } from 'react';
import { UploadCloud, FileText, BookOpen, Loader2, X, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { useToast } from '../../providers/ToastProvider';
import { uploadEbookFile } from '../../services/ebookService';

interface EbookUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded?: () => void;
}

export default function EbookUploadModal({ open, onOpenChange, onUploaded }: EbookUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const { notify, notifyError } = useToast();

  const handleFileSelect = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['epub', 'pdf', 'txt'].includes(ext || '')) {
      notifyError('Please select a valid ebook file (.epub, .pdf, or .txt)');
      return;
    }

    setSelectedFile(file);
    // Auto-fill title if empty
    if (!title) {
      const defaultTitle = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setTitle(defaultTitle.replace(/[-_]/g, ' '));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setTitle('');
    setAuthor('');
    setDescription('');
    setCoverUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      notifyError('Please select an ebook file to upload.');
      return;
    }

    setUploading(true);
    try {
      await uploadEbookFile(selectedFile, {
        title: title || selectedFile.name,
        author: author || 'Unknown Author',
        description,
        coverUrl,
      });

      notify('Ebook uploaded successfully!');
      resetForm();
      onOpenChange(false);
      if (onUploaded) onUploaded();
    } catch (err: any) {
      notifyError(err.message || 'Failed to upload ebook');
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFormatBadge = (name: string) => {
    const ext = name.split('.').pop()?.toUpperCase() || 'EBOOK';
    if (ext === 'EPUB') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
    if (ext === 'PDF') return 'bg-rose-500/10 text-rose-600 border-rose-500/30';
    return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { resetForm(); onOpenChange(val); }}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-stone-50 rounded-2xl shadow-xl border border-stone-200">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-stone-200/80 bg-white">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              Upload Ebook
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* File Dropzone */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
              Ebook File (.epub, .pdf, .txt)
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]'
                  : selectedFile
                  ? 'border-stone-300 bg-white'
                  : 'border-stone-300 hover:border-stone-400 bg-white'
              }`}
            >
              <input
                type="file"
                accept=".epub,.pdf,.txt,application/epub+zip,application/pdf,text/plain"
                onChange={handleInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {selectedFile ? (
                <div className="flex items-center justify-between bg-stone-100/70 p-3 rounded-lg border border-stone-200">
                  <div className="flex items-center gap-3 text-left overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {selectedFile.name.split('.').pop()?.toUpperCase()}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-semibold text-stone-900 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-stone-500">{formatSize(selectedFile.size)}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-md border ${getFormatBadge(selectedFile.name)}`}>
                    {selectedFile.name.split('.').pop()?.toUpperCase()}
                  </span>
                </div>
              ) : (
                <div className="py-4 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-stone-700">
                    Drag and drop your ebook file here, or <span className="text-emerald-600 font-semibold underline">browse</span>
                  </p>
                  <p className="text-xs text-stone-400">Supports EPUB, PDF, and TXT files up to 50MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Title & Author */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Book Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. The Art of War"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Author
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Sun Tzu"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Description / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary or personal reading notes..."
              className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Cover Image URL */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Cover Image URL (Optional)
            </label>
            <div className="relative">
              <ImageIcon className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
              className="px-4 py-2 border-stone-300 text-stone-700 hover:bg-stone-100"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploading || !selectedFile}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Upload Ebook
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
