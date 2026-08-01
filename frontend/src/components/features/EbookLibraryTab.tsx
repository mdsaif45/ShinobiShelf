import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  FileText,
  Clock,
  Sparkles,
  BarChart3,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';
import { Ebook } from '../../types';
import { fetchUserEbooks, deleteEbook } from '../../services/ebookService';
import EbookUploadModal from '../modals/EbookUploadModal';
import EbookReaderModal from '../modals/EbookReaderModal';
import { useToast } from '../../providers/ToastProvider';

export default function EbookLibraryTab() {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [formatFilter, setFormatFilter] = useState<string>('All');
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);

  // Active reader state
  const [activeEbook, setActiveEbook] = useState<Ebook | null>(null);
  const [readerOpen, setReaderOpen] = useState<boolean>(false);

  const { notify, notifyError } = useToast();

  const loadEbooks = async () => {
    try {
      setLoading(true);
      const data = await fetchUserEbooks();
      setEbooks(data);
    } catch (err: any) {
      console.error('Failed to load ebooks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEbooks();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      await deleteEbook(id);
      notify(`"${title}" deleted successfully.`);
      setEbooks((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      notifyError(err.message || 'Failed to delete ebook');
    }
  };

  const handleOpenReader = (ebook: Ebook) => {
    setActiveEbook(ebook);
    setReaderOpen(true);
  };

  const handleProgressUpdated = (ebookId: string, progressPercent: number) => {
    setEbooks((prev) =>
      prev.map((b) => (b.id === ebookId ? { ...b, progressPercent } : b))
    );
  };

  const filteredEbooks = ebooks.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.author && b.author.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFormat =
      formatFilter === 'All' || b.fileFormat.toUpperCase() === formatFilter.toUpperCase();
    return matchesSearch && matchesFormat;
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFormatBadgeStyle = (format: string) => {
    const f = format.toLowerCase();
    if (f === 'epub') return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
    if (f === 'pdf') return 'bg-rose-500/10 text-rose-700 border-rose-500/20';
    return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
  };

  const totalBytes = ebooks.reduce((acc, b) => acc + b.fileSize, 0);
  const avgProgress =
    ebooks.length > 0
      ? Math.round(ebooks.reduce((acc, b) => acc + (b.progressPercent || 0), 0) / ebooks.length)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-emerald-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> E-Reader Digital Shelf
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Personal E-Book Library
            </h1>
            <p className="text-stone-300 text-sm mt-1 max-w-lg">
              Upload EPUB, PDF, or TXT ebooks, customize reading themes, and resume reading anytime with automatic progress tracking.
            </p>
          </div>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-stone-950 font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-emerald-500/25 shrink-0"
          >
            <Plus className="w-5 h-5" />
            Upload Ebook
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-400">Total Digital Books</p>
              <p className="text-lg font-bold">{ebooks.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-400">Average Reading %</p>
              <p className="text-lg font-bold">{avgProgress}%</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-purple-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-400">Shelf Storage</p>
              <p className="text-lg font-bold">{formatSize(totalBytes)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ebooks by title or author..."
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Format Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-lg w-full sm:w-auto">
          {['All', 'EPUB', 'PDF', 'TXT'].map((fmt) => (
            <button
              key={fmt}
              onClick={() => setFormatFilter(fmt)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                formatFilter === fmt
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Ebooks Grid */}
      {loading ? (
        <div className="py-20 text-center text-stone-500">Loading digital shelf...</div>
      ) : filteredEbooks.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-stone-200 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-stone-900">No Ebooks Found</h3>
          <p className="text-stone-500 text-sm max-w-sm mx-auto">
            {searchQuery || formatFilter !== 'All'
              ? 'No digital books matched your search criteria.'
              : 'Your digital shelf is empty. Upload your first EPUB, PDF, or TXT ebook to start reading.'}
          </p>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Upload Ebook
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <AnimatePresence>
            {filteredEbooks.map((book) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => handleOpenReader(book)}
                className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between overflow-hidden"
              >
                {/* Cover & Header */}
                <div>
                  <div className="relative h-44 bg-stone-100 flex items-center justify-center overflow-hidden border-b border-stone-100">
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-stone-800 to-stone-900 p-6 flex flex-col justify-between text-white relative">
                        <div className="flex justify-between items-start">
                          <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md border backdrop-blur-md ${getFormatBadgeStyle(book.fileFormat)}`}>
                            {book.fileFormat.toUpperCase()}
                          </span>
                          <button
                            onClick={(e) => handleDelete(e, book.id, book.title)}
                            className="p-1.5 rounded-lg bg-black/40 hover:bg-rose-600 text-stone-300 hover:text-white transition-colors"
                            title="Delete ebook"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div>
                          <p className="font-bold text-sm line-clamp-2 leading-tight">{book.title}</p>
                          <p className="text-xs text-stone-400 mt-1 line-clamp-1">{book.author}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-stone-900 text-sm line-clamp-1 group-hover:text-emerald-600 transition-colors">
                          {book.title}
                        </h3>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded border shrink-0 ${getFormatBadgeStyle(book.fileFormat)}`}>
                          {book.fileFormat.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">{book.author || 'Unknown Author'}</p>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                        <span className="font-medium">Reading Progress</span>
                        <span className="font-bold text-emerald-600">{book.progressPercent || 0}%</span>
                      </div>
                      <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${book.progressPercent || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-4 pb-4 pt-1 flex items-center justify-between border-t border-stone-100">
                  <span className="text-[11px] text-stone-400 font-medium">{formatSize(book.fileSize)}</span>
                  <button className="text-xs font-bold text-emerald-600 group-hover:text-emerald-700 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    Read Now
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Upload Modal */}
      <EbookUploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onUploaded={loadEbooks}
      />

      {/* Interactive Reader Modal */}
      <EbookReaderModal
        ebook={activeEbook}
        open={readerOpen}
        onClose={() => setReaderOpen(false)}
        onProgressUpdated={handleProgressUpdated}
      />
    </div>
  );
}
