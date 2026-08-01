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
    if (f === 'epub') return 'bg-[#2D5A27]/10 text-[#2D5A27] border-[#2D5A27]/20';
    if (f === 'pdf') return 'bg-[#D44D22]/10 text-[#D44D22] border-[#D44D22]/20';
    return 'bg-blue-600/10 text-blue-700 border-blue-600/20';
  };

  const totalBytes = ebooks.reduce((acc, b) => acc + b.fileSize, 0);
  const avgProgress =
    ebooks.length > 0
      ? Math.round(ebooks.reduce((acc, b) => acc + (b.progressPercent || 0), 0) / ebooks.length)
      : 0;

  return (
    <div className="space-y-5">
      {/* Sleek Integrated Header Bar matching ShinobiShelf Theme */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E5E0D8] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#2C2C2C]">
              Digital E-Reader Shelf
            </h2>
            <span className="bg-[#4B5320]/10 text-[#4B5320] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#4B5320]/20">
              {ebooks.length} {ebooks.length === 1 ? 'E-Book' : 'E-Books'}
            </span>
          </div>
          <p className="text-xs text-[#8C867E] mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Upload EPUB, PDF, or TXT ebooks to read with synced progress</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline text-[#2D5A27] font-semibold">Avg Progress: {avgProgress}%</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline text-[#8C867E]">Storage: {formatSize(totalBytes)}</span>
          </p>
        </div>

        <button
          onClick={() => setUploadModalOpen(true)}
          className="bg-[#4B5320] hover:bg-[#3D441A] text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Upload Ebook
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-[#E5E0D8] shadow-sm">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#8C867E] absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title or author..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl text-xs text-[#2C2C2C] focus:outline-none focus:ring-1 focus:ring-[#4B5320]"
          />
        </div>

        {/* Format Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#F5F2ED] p-1 rounded-xl w-full sm:w-auto">
          {['All', 'EPUB', 'PDF', 'TXT'].map((fmt) => (
            <button
              key={fmt}
              onClick={() => setFormatFilter(fmt)}
              className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                formatFilter === fmt
                  ? 'bg-white text-[#2C2C2C] shadow-sm font-bold'
                  : 'text-[#8C867E] hover:text-[#2C2C2C]'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Ebooks Grid */}
      {loading ? (
        <div className="py-20 text-center text-[#8C867E]">Loading digital shelf...</div>
      ) : filteredEbooks.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-[#E5E0D8] p-8 space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#4B5320]/10 text-[#4B5320] flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="font-serif text-lg font-bold text-[#2C2C2C]">No Ebooks Found</h3>
          <p className="text-[#8C867E] text-xs max-w-sm mx-auto">
            {searchQuery || formatFilter !== 'All'
              ? 'No digital books matched your search criteria.'
              : 'Your digital shelf is empty. Upload your first EPUB, PDF, or TXT ebook to start reading.'}
          </p>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#4B5320] hover:bg-[#3D441A] text-white font-semibold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Upload Ebook
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          <AnimatePresence>
            {filteredEbooks.map((book) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => handleOpenReader(book)}
                className="bg-white rounded-2xl border border-[#E5E0D8] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between overflow-hidden h-full"
              >
                {/* Cover & Header */}
                <div>
                  <div className="aspect-[2/3] bg-[#F9F7F4] relative overflow-hidden flex items-center justify-center p-3 border-b border-[#E5E0D8]">
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover rounded-sm shadow group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#4B5320] to-[#2B3012] p-4 flex flex-col justify-between text-white rounded-sm shadow relative">
                        <div className="flex justify-between items-start">
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded border backdrop-blur-md ${getFormatBadgeStyle(book.fileFormat)}`}>
                            {book.fileFormat.toUpperCase()}
                          </span>
                          <button
                            onClick={(e) => handleDelete(e, book.id, book.title)}
                            className="p-1.5 rounded-lg bg-black/40 hover:bg-rose-600 text-stone-200 hover:text-white transition-colors"
                            title="Delete ebook"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div>
                          <p className="font-serif font-bold text-xs line-clamp-2 leading-tight">{book.title}</p>
                          <p className="text-[10px] text-stone-300 mt-1 italic line-clamp-1">{book.author || 'Unknown'}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between gap-1.5">
                        <h3 className="font-serif font-bold text-[#2C2C2C] text-xs line-clamp-1 group-hover:text-[#4B5320] transition-colors">
                          {book.title}
                        </h3>
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border shrink-0 ${getFormatBadgeStyle(book.fileFormat)}`}>
                          {book.fileFormat.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8C867E] italic line-clamp-1 mt-0.5">{book.author || 'Unknown Author'}</p>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-[#8C867E] mb-1">
                        <span>Progress</span>
                        <span className="font-bold text-[#4B5320]">{book.progressPercent || 0}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#F0EEEB] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#4B5320] rounded-full transition-all duration-300"
                          style={{ width: `${book.progressPercent || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="px-3 py-2 border-t border-dashed border-[#E5E0D8] flex items-center justify-between mt-auto">
                  <span className="text-[10px] text-[#8C867E] font-medium">{formatSize(book.fileSize)}</span>
                  <button className="text-xs font-bold text-[#4B5320] hover:text-[#3D441A] flex items-center gap-1">
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
