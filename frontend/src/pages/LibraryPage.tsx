import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Library, User, Search, Plus, MoreHorizontal, LogOut, Settings, Users, ChevronDown, Filter, Globe, Calendar, MapPin, Heart, Trophy, BarChart2, BookMarked, X, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '../providers/AuthProvider';
import { subscribeToBooks } from '../services/bookService';
import AddBookModal from '../components/modals/AddBookModal';
import BookDetailsModal from '../components/modals/BookDetailsModal';
import BorrowRequestModal from '../components/modals/BorrowRequestModal';
import LoansCalendarTab from '../components/features/LoansCalendarTab';
import AnalyticsReportTab from '../components/features/AnalyticsReportTab';
import WishlistBoardTab from '../components/features/WishlistBoardTab';
import BookClubsTab from '../components/features/BookClubsTab';
import LeaderboardBadgesTab from '../components/features/LeaderboardBadgesTab';
import PhysicalSwapsTab from '../components/features/PhysicalSwapsTab';
import EbookLibraryTab from '../components/features/EbookLibraryTab';

import { CustomSelect } from '@/components/ui/CustomSelect';
import { FEATURES } from '@/config/features';

const CIRCLE_OPTIONS = [
  { value: 'Neighborhood Circle', label: 'Main Neighborhood Circle 📍' },
  { value: 'Tech & Founders Shelf', label: 'Tech & Founders Shelf 💻' },
  { value: 'Philosophy & Classics', label: 'Philosophy & Classics 🏛️' },
  { value: 'Sci-Fi & Fantasy Club', label: 'Sci-Fi & Fantasy Club 🚀' },
];

const GENRE_OPTIONS = [
  { value: 'All', label: 'All Categories' },
  { value: 'Fiction', label: 'Fiction' },
  { value: 'Philosophy', label: 'Philosophy' },
  { value: 'Non-Fiction', label: 'Non-Fiction' },
  { value: 'Biography', label: 'Biography' },
];

const PRIMARY_TABS = [
  { id: 'global', label: 'Catalog', icon: Globe },
  { id: 'loans', label: 'Loans', icon: Calendar },
  { id: 'owned', label: 'My Books', icon: BookMarked },
  { id: 'ereader', label: 'E-Reader', icon: BookOpen },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
];

// Swaps is gated: its pickup spots and events are sample content with no
// backend, so the tab is hidden rather than shown full of data that is not real.
const SECONDARY_TABS = [
  ...(FEATURES.swaps
    ? [{ id: 'swaps', label: 'Swaps', icon: MapPin, desc: 'PIN handoffs, local pickup spots & events' }]
    : []),
  { id: 'clubs', label: 'Book Clubs', icon: Users, desc: 'Reading groups, reflections & discussions' },
  { id: 'leaderboard', label: 'Rankings', icon: Trophy, desc: 'Community honors, top readers & badges' },
  { id: 'analytics', label: 'Analytics', icon: BarChart2, desc: 'Honesty score, reading velocity & stats' },
];

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState('global');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isMobileMoreSheetOpen, setIsMobileMoreSheetOpen] = useState(false);
  const [isMobileProfileSheetOpen, setIsMobileProfileSheetOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [books, setBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  const [borrowModalBook, setBorrowModalBook] = useState<any | null>(null);

  // Search & Circle Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCircle, setSelectedCircle] = useState('Neighborhood Circle');
  const [selectedGenre, setSelectedGenre] = useState('All');

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isSecondaryActive = SECONDARY_TABS.some(t => t.id === activeTab);
  const activeSecondaryTab = SECONDARY_TABS.find(t => t.id === activeTab);

  useEffect(() => {
    const unsubscribe = subscribeToBooks((booksData) => {
      setBooks(booksData);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  // Filter books based on search query & genre
  const filteredBooks = books.filter(b => {
    const matchesQuery = 
      b.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      b.author?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || b.genre === selectedGenre;
    return matchesQuery && matchesGenre;
  });

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#2C2C2C] font-sans selection:bg-[#E5E0D8]">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-[#F5F2ED]/95 backdrop-blur-md border-b border-[#E5E0D8]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="text-xl sm:text-2xl font-serif font-semibold tracking-tight italic text-[#4B5320]">Circle.</span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Input */}
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, author..." 
                className="pl-9 pr-3 py-1.5 bg-white border border-[#E5E0D8] rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-[#4B5320] w-36 sm:w-48 md:w-60 transition-all shadow-sm"
              />
            </div>

            <Button 
              onClick={() => setIsAddModalOpen(true)} 
              size="sm" 
              className="hidden md:flex gap-1.5 rounded-xl bg-[#4B5320] text-white hover:bg-[#3D441A] shadow-md shadow-[#4B5320]/10 text-xs py-2 px-2.5 sm:px-3.5 shrink-0"
            >
              <Plus className="w-4 h-4" /> 
              <span>Add Book</span>
            </Button>

            <div className="relative">
              <button 
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setIsMobileProfileSheetOpen(true);
                  } else {
                    setDropdownOpen(!dropdownOpen);
                  }
                }} 
                className="rounded-full focus:outline-none focus:ring-2 focus:ring-[#4B5320]"
              >
                <Avatar className="w-8 h-8 cursor-pointer border-2 border-white shadow-sm ring-2 ring-transparent hover:ring-[#E5E0D8] transition-all bg-[#D4A373]">
                  <AvatarImage src={user?.photoURL || ""} />
                  <AvatarFallback className="text-white font-serif bg-transparent">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </button>
              
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="hidden md:block absolute right-0 mt-2 w-56 rounded-xl border border-[#E5E0D8] shadow-lg font-sans bg-white p-2 z-50"
                  >
                    <div className="px-2 py-1.5 text-xs font-serif font-semibold text-[#2C2C2C]">
                      {user?.displayName || 'My Account'}
                    </div>
                    {FEATURES.circleLocation && (
                      <>
                        <div className="h-px bg-[#E5E0D8] my-1 mx-1" />
                        <div className="px-2 py-1.5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C867E] mb-1">Circle Location</div>
                          <CustomSelect
                            options={CIRCLE_OPTIONS}
                            value={selectedCircle}
                            onChange={setSelectedCircle}
                            variant="pill"
                            icon={<Users className="w-3.5 h-3.5 text-[#4B5320]" />}
                          />
                        </div>
                      </>
                    )}
                    <div className="h-px bg-[#E5E0D8] my-1 mx-1" />
                    <button 
                      onClick={() => navigate('/profile')} 
                      className="w-full flex items-center px-2 py-1.5 text-xs rounded-lg hover:bg-[#F5F2ED] transition-colors text-[#2C2C2C] mt-0.5"
                    >
                      <Settings className="w-4 h-4 mr-2 text-[#4B5320]" />
                      Profile
                    </button>
                    <button 
                      onClick={handleLogout} 
                      className="w-full flex items-center px-2 py-1.5 text-xs rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-0.5"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 pt-6 pb-28 md:pb-12 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-serif tracking-tight text-[#2C2C2C]">
                {activeTab === 'global' ? 'Catalog' : activeTab === 'loans' ? 'Loans' : activeTab === 'analytics' ? 'Analytics' : activeTab === 'wishlist' ? 'Wishlist' : activeTab === 'clubs' ? 'Book Clubs' : activeTab === 'leaderboard' ? 'Rankings' : activeTab === 'swaps' ? 'Swaps' : 'My Books'}
              </h1>
              {FEATURES.circleLocation && (
                <div className="flex items-center gap-1.5 bg-white border border-[#E5E0D8] rounded-full px-2.5 py-1 text-[11px] text-[#4B5320] font-medium shadow-2xs">
                  <Users className="w-3 h-3 text-[#4B5320]" />
                  <span>{selectedCircle}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-[#8C867E]">
              {activeTab === 'global' ? 'Discover and borrow books shared by members in your selected circle.' : activeTab === 'loans' ? 'Track upcoming loan deadlines, start dates, and request approvals.' : activeTab === 'analytics' ? 'View your honesty score, reading velocity, and return statistics.' : activeTab === 'wishlist' ? 'Post book requests or lend copies to fellow members.' : activeTab === 'clubs' ? 'Join reading clubs, post reflections, and coordinate meetups.' : activeTab === 'leaderboard' ? 'Recognizing top punctual readers, generous lenders, and earned badges.' : activeTab === 'swaps' ? 'Confirm book handoffs with 4-digit PINs, explore local dropoff spots, and join swap events.' : 'Manage your listed book collection.'}
            </p>
          </div>
        </div>

        {/* Tab Navigation Track (Desktop only) */}
        <div className="w-full hidden md:block">
          <div className="bg-white/90 p-1.5 rounded-2xl border border-[#E5E0D8] shadow-sm backdrop-blur-md flex items-center justify-between gap-1.5 w-full">
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar flex-1">
              {PRIMARY_TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsMoreMenuOpen(false);
                    }}
                    className={`rounded-xl px-3.5 py-2 text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-[#4B5320] text-white shadow-sm font-semibold'
                        : 'text-[#6B655C] hover:text-[#2C2C2C] hover:bg-[#F5F2ED]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* More Features Dropdown Trigger */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className={`rounded-xl px-3.5 py-2 text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer border ${
                  isSecondaryActive
                    ? 'bg-[#4B5320] text-white border-transparent font-semibold shadow-sm'
                    : 'bg-[#F9F7F4] text-[#6B655C] border-[#E5E0D8] hover:text-[#2C2C2C] hover:bg-[#EAE6E1]'
                }`}
              >
                <MoreHorizontal className="w-3.5 h-3.5 shrink-0" />
                <span>{activeSecondaryTab ? activeSecondaryTab.label : 'More Features'}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu Overlay */}
              <AnimatePresence>
                {isMoreMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsMoreMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-[#E5E0D8] shadow-xl z-40 p-2 space-y-1"
                    >
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8C867E] flex items-center justify-between">
                        <span>Community & Extras</span>
                        <span className="text-[9px] bg-[#F5F2ED] px-1.5 py-0.5 rounded text-[#4B5320]">4 Modules</span>
                      </div>
                      {SECONDARY_TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                              setActiveTab(tab.id);
                              setIsMoreMenuOpen(false);
                            }}
                            className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-3 cursor-pointer ${
                              isActive ? 'bg-[#4B5320]/10 border border-[#4B5320]/20' : 'hover:bg-[#F9F7F4]'
                            }`}
                          >
                            <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isActive ? 'bg-[#4B5320] text-white' : 'bg-[#F5F2ED] text-[#4B5320]'}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className={`text-xs font-semibold ${isActive ? 'text-[#4B5320]' : 'text-[#2C2C2C]'}`}>
                                {tab.label}
                              </div>
                              <div className="text-[10px] text-[#8C867E] line-clamp-1 mt-0.5">
                                {tab.desc}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'global' && (
              <div className="space-y-6">
                {/* Search & Genre Filter Bar */}
                <div className="flex flex-row items-center justify-between gap-2 p-2 sm:p-4 bg-white border border-[#E5E0D8] rounded-xl sm:rounded-2xl">
                  <div className="relative flex-1 min-w-0">
                    <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter title or author..."
                      className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#4B5320]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="hidden sm:inline text-xs text-[#8C867E]">Category:</span>
                    <CustomSelect
                      options={GENRE_OPTIONS}
                      value={selectedGenre}
                      onChange={setSelectedGenre}
                      icon={<Filter className="w-3.5 h-3.5 text-[#8C867E]" />}
                    />
                  </div>
                </div>

                {filteredBooks.length === 0 ? (
                  <div className="text-center py-16 text-[#8C867E] space-y-2">
                    <p className="font-serif text-lg">No books found matching your search.</p>
                    <p className="text-xs">Try searching for another title, author, or category!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {filteredBooks.map((book) => (
                      <BookCard 
                        key={book.id} 
                        book={book} 
                        onClick={() => setSelectedBook(book)} 
                        onBorrowClick={(b) => setBorrowModalBook(b)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'loans' && (
              <LoansCalendarTab />
            )}

            {activeTab === 'ereader' && (
              <EbookLibraryTab />
            )}

            {FEATURES.swaps && activeTab === 'swaps' && (
              <PhysicalSwapsTab />
            )}

            {activeTab === 'wishlist' && (
              <WishlistBoardTab onAddBookToCatalog={() => setIsAddModalOpen(true)} />
            )}

            {activeTab === 'clubs' && (
              <BookClubsTab />
            )}

            {activeTab === 'leaderboard' && (
              <LeaderboardBadgesTab />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsReportTab />
            )}

            {activeTab === 'owned' && (
              <div>
                {books.filter(b => b.ownerId === user?.id || b.ownerId === user?.uid).length === 0 ? (
                  <div className="text-center py-16 bg-white border border-[#E5E0D8] rounded-3xl space-y-4 p-8">
                    <div className="w-12 h-12 rounded-full bg-[#4B5320]/10 text-[#4B5320] flex items-center justify-center mx-auto">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg text-[#2C2C2C] font-semibold">Your Shared Shelf is Empty</h3>
                      <p className="text-xs text-[#8C867E] max-w-sm mx-auto mt-1">
                        List books from your home library to share with neighborhood circle members and earn honesty points!
                      </p>
                    </div>
                    <Button 
                      onClick={() => setIsAddModalOpen(true)}
                      className="bg-[#4B5320] text-white hover:bg-[#3D441A] rounded-xl text-xs px-5 py-2.5"
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      Add Your First Book
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {books.filter(b => b.ownerId === user?.id || b.ownerId === user?.uid).map((book) => (
                      <BookCard 
                        key={book.id} 
                        book={book} 
                        onClick={() => setSelectedBook(book)} 
                        onBorrowClick={(b) => setBorrowModalBook(b)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <AddBookModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
      <BookDetailsModal 
        open={!!selectedBook} 
        onOpenChange={(open) => !open && setSelectedBook(null)} 
        book={selectedBook} 
        onBorrowClick={(b) => setBorrowModalBook(b)}
      />
      <BorrowRequestModal 
        open={!!borrowModalBook} 
        onOpenChange={(open) => !open && setBorrowModalBook(null)} 
        book={borrowModalBook}
        onRequestSubmitted={() => setActiveTab('loans')}
      />

      {/* Mobile Bottom Dock Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E5E0D8] px-3 py-2 flex items-center justify-around shadow-2xl">
        <button 
          onClick={() => setActiveTab('global')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${activeTab === 'global' ? 'text-[#4B5320] font-bold' : 'text-[#8C867E]'}`}
        >
          <Globe className="w-5 h-5" />
          <span>Catalog</span>
        </button>

        <button 
          onClick={() => setActiveTab('loans')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${activeTab === 'loans' ? 'text-[#4B5320] font-bold' : 'text-[#8C867E]'}`}
        >
          <Calendar className="w-5 h-5" />
          <span>Loans</span>
        </button>

        {/* Center Primary FAB for Mobile */}
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center w-12 h-12 bg-[#4B5320] text-white rounded-full shadow-lg shadow-[#4B5320]/30 hover:bg-[#3D441A] transition-transform active:scale-95 -mt-5 border-4 border-white"
          aria-label="Add Book"
        >
          <Plus className="w-6 h-6" />
        </button>

        <button 
          onClick={() => setActiveTab('owned')}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${activeTab === 'owned' ? 'text-[#4B5320] font-bold' : 'text-[#8C867E]'}`}
        >
          <BookMarked className="w-5 h-5" />
          <span>My Books</span>
        </button>

        <button 
          onClick={() => setIsMobileMoreSheetOpen(true)}
          className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${isSecondaryActive || activeTab === 'wishlist' ? 'text-[#4B5320] font-bold' : 'text-[#8C867E]'}`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span>{isSecondaryActive ? (activeSecondaryTab?.label.split(' ')[0] || 'More') : 'More'}</span>
        </button>
      </div>

      {/* Mobile More Sheet Drawer */}
      <AnimatePresence>
        {isMobileMoreSheetOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMoreSheetOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-white w-full max-w-lg rounded-t-3xl p-5 shadow-2xl z-10 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#2C2C2C]">All Library Features</h3>
                  <p className="text-[11px] text-[#8C867E]">Select a tab to switch views</p>
                </div>
                <button 
                  onClick={() => setIsMobileMoreSheetOpen(false)}
                  className="p-1.5 rounded-full bg-[#F5F2ED] text-[#8C867E] hover:text-[#2C2C2C]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C867E] px-1">Daily Essentials</div>
                <div className="grid grid-cols-2 gap-2">
                  {PRIMARY_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setIsMobileMoreSheetOpen(false);
                        }}
                        className={`text-left p-3 rounded-2xl flex items-center gap-2.5 transition-all cursor-pointer ${
                          isActive ? 'bg-[#4B5320] text-white font-semibold shadow-sm' : 'bg-[#F9F7F4] text-[#2C2C2C] hover:bg-[#F0EEEB]'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-xs truncate">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C867E] px-1 pt-2">Community & Extras</div>
                <div className="space-y-1.5">
                  {SECONDARY_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setIsMobileMoreSheetOpen(false);
                        }}
                        className={`w-full text-left p-3 rounded-2xl flex items-start gap-3 transition-all cursor-pointer ${
                          isActive ? 'bg-[#4B5320] text-white font-semibold shadow-sm' : 'bg-[#F9F7F4] text-[#2C2C2C] hover:bg-[#F0EEEB]'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-white' : 'text-[#4B5320]'}`} />
                        <div>
                          <div className="text-xs">{tab.label}</div>
                          <div className={`text-[10px] ${isActive ? 'text-white/80' : 'text-[#8C867E]'}`}>{tab.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Profile Sheet Drawer */}
      <AnimatePresence>
        {isMobileProfileSheetOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileProfileSheetOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-white w-full max-w-lg rounded-t-3xl p-5 shadow-2xl z-10 space-y-4 max-h-[85vh] overflow-y-auto"
            >
              {/* Handle Bar */}
              <div className="w-12 h-1.5 bg-[#E5E0D8] rounded-full mx-auto -mt-1 mb-2" />

              {/* Profile Card Header */}
              <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border-2 border-[#4B5320]/20 shadow-sm bg-[#D4A373]">
                    <AvatarImage src={user?.photoURL || ""} />
                    <AvatarFallback className="text-white font-serif text-lg bg-transparent">
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#2C2C2C] leading-snug">
                      {user?.displayName || 'My Account'}
                    </h3>
                    <p className="text-xs text-[#8C867E] truncate max-w-[200px]">
                      {user?.email || 'Logged in user'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsMobileProfileSheetOpen(false)}
                  className="p-2 rounded-full bg-[#F5F2ED] text-[#8C867E] hover:text-[#2C2C2C] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Circle Location Selector */}
              {FEATURES.circleLocation && (
                <div className="space-y-1.5 bg-[#F9F7F4] p-3 rounded-2xl border border-[#E5E0D8]">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C867E] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#4B5320]" />
                    <span>Circle Location</span>
                  </div>
                  <CustomSelect
                    options={CIRCLE_OPTIONS}
                    value={selectedCircle}
                    onChange={setSelectedCircle}
                    variant="pill"
                    icon={<Users className="w-3.5 h-3.5 text-[#4B5320]" />}
                  />
                </div>
              )}

              {/* Actions List */}
              <div className="space-y-2 pt-1">
                <button 
                  onClick={() => {
                    setIsMobileProfileSheetOpen(false);
                    navigate('/profile');
                  }} 
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#F9F7F4] hover:bg-[#F5F2ED] transition-colors text-xs font-semibold text-[#2C2C2C] border border-[#E5E0D8]"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[#4B5320]/10 text-[#4B5320]">
                      <Settings className="w-4 h-4" />
                    </div>
                    <span>My Profile & Settings</span>
                  </div>
                  <ChevronDown className="w-4 h-4 -rotate-90 text-[#8C867E]" />
                </button>

                <button 
                  onClick={() => {
                    setIsMobileProfileSheetOpen(false);
                    handleLogout();
                  }} 
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-red-50 hover:bg-red-100/80 transition-colors text-xs font-semibold text-red-600 border border-red-100"
                >
                  <div className="p-2 rounded-xl bg-red-100 text-red-600">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span>Sign out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const BookCard: React.FC<{ book: any; onClick?: () => void; onBorrowClick?: (book: any) => void }> = ({ book, onClick, onBorrowClick }) => {
  const isAvailable = book.status === 'AVAILABLE';

  return (
    <Card 
      onClick={onClick}
      className="group bg-[#FFFFFF] rounded-2xl border border-[#E5E0D8] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer flex flex-col h-full"
    >
      <div className="aspect-[2/3] bg-[#F9F7F4] relative overflow-hidden flex items-center justify-center p-4">
        {book.coverUrl ? (
          <img 
            src={book.coverUrl} 
            alt={book.title}
            className="w-full h-full object-cover rounded-sm shadow transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-[#E8E4E0] flex items-center justify-center text-center p-2 rounded-sm shadow">
            <span className="font-serif text-xs text-neutral-400">No Cover</span>
          </div>
        )}
        
        <div className="absolute top-2 left-2 flex gap-1 z-10">
          {isAvailable ? (
            <Badge className="bg-[#F0F7F0]/90 backdrop-blur-sm text-[#2D5A27] border border-[#2D5A27]/20 text-[9px] px-1.5 py-0">Available</Badge>
          ) : (
            <Badge className="bg-[#FFF5F0]/90 backdrop-blur-sm text-[#D44D22] border border-[#D44D22]/20 text-[9px] px-1.5 py-0">Borrowed</Badge>
          )}
        </div>
      </div>

      <CardContent className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-serif font-bold text-sm leading-tight text-[#2C2C2C] line-clamp-1 group-hover:text-[#4B5320] transition-colors">
            {book.title}
          </h3>
          <p className="text-xs text-[#8C867E] italic line-clamp-1 mt-0.5">{book.author}</p>
        </div>
        
        <div className="mt-3 pt-2 border-t border-dashed border-[#E5E0D8] flex items-center gap-2">
          <Avatar className="w-4 h-4 bg-[#BC8F8F]">
            <AvatarFallback className="text-[8px] text-white bg-transparent">{book.owner?.name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <span className="text-[10px] opacity-70 truncate">Owned by <strong>{book.owner?.name || 'Owner'}</strong></span>
        </div>

        {!isAvailable && book.currentReader && (
          <div className="mt-2 pt-2 border-t border-[#E5E0D8]">
            <div className="w-full bg-[#F0EEEB] h-1.5 rounded-full overflow-hidden mb-1">
              <div 
                className="bg-[#4B5320] h-full rounded-full transition-all duration-500" 
                style={{ width: `${book.progress || 0}%` }}
              />
            </div>
            <p className="text-[9px] font-medium opacity-60">{book.progress || 0}% Complete</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-3 pt-0 mt-auto flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        {isAvailable ? (
          <Button 
            onClick={() => onBorrowClick && onBorrowClick(book)}
            className="w-full py-1.5 h-auto bg-[#4B5320] text-white rounded-lg text-xs font-medium hover:bg-[#3D441A] transition-colors shadow-sm shadow-[#4B5320]/10"
          >
            Borrow
          </Button>
        ) : (
          <div className="w-full flex items-center justify-between bg-[#F9F7F4] p-1.5 rounded-lg border border-[#E5E0D8]">
            <div className="text-[9px] font-bold text-[#D44D22]">Borrowed</div>
            <button 
              onClick={() => onBorrowClick && onBorrowClick(book)}
              className="text-[10px] font-bold text-[#4B5320] underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              Request
            </button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};
