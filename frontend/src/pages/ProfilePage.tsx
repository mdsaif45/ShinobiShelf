import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Bell, 
  Check, 
  Edit3, 
  Sparkles, 
  ShieldCheck, 
  BookOpen, 
  Library, 
  Bookmark,
  X,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '../providers/AuthProvider';
import { updateUserProfile } from '../services/userService';
import { subscribeToBooks } from '../services/bookService';
import { subscribeToBorrowRequests } from '../services/loanService';
import { Book, BorrowRequest, NotificationPreferences } from '../types';

const PRESET_GENRES = [
  'Fiction', 'Philosophy', 'Sci-Fi', 'Mystery', 
  'Non-Fiction', 'Fantasy', 'History', 'Poetry', 
  'Biography', 'Psychology', 'Art', 'Classics'
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=250'
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateUserInState } = useAuth();

  // Books stats state
  const [ownedCount, setOwnedCount] = useState(0);
  const [borrowedCount, setBorrowedCount] = useState(0);
  const [currentlyReadingCount, setCurrentlyReadingCount] = useState(0);

  // Toast message state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Edit Profile Modal state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editGenres, setEditGenres] = useState<string[]>([]);
  const [customGenreInput, setCustomGenreInput] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // 2. Email Address Update Modal state
  const [isEditEmailOpen, setIsEditEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  // 3. Notification Preferences Modal state
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    borrowAlerts: true,
    clubAlerts: true,
    returnReminders: true,
    weeklyDigest: false,
  });
  const [isSavingNotifs, setIsSavingNotifs] = useState(false);

  // Initialize state from auth user
  useEffect(() => {
    if (user) {
      setEditDisplayName(user.displayName || '');
      setEditPhotoURL(user.photoURL || '');
      setEditBio(user.bio || '');
      setEditGenres(user.favoriteGenres || ['Fiction', 'Philosophy', 'Sci-Fi']);
      setNewEmail(user.email || '');
      if (user.notificationPreferences) {
        setNotifPrefs(user.notificationPreferences);
      }
    }
  }, [user]);

  // Subscribe to real book stats
  useEffect(() => {
    if (!user) return;
    const unsubBooks = subscribeToBooks((allBooks: Book[]) => {
      const owned = allBooks.filter((b) => b.ownerId === user.id || b.owner?.uid === user.id || b.owner?.id === user.id);
      setOwnedCount(owned.length);
    });

    const unsubLoans = subscribeToBorrowRequests((allLoans: BorrowRequest[]) => {
      const activeBorrowed = allLoans.filter(
        (l) => l.borrowerId === user.id && (l.status === 'APPROVED' || l.status === 'HANDED_OVER')
      );
      setBorrowedCount(activeBorrowed.length);

      const reading = allLoans.filter((l) => l.borrowerId === user.id && l.status === 'HANDED_OVER');
      setCurrentlyReadingCount(reading.length);
    });

    return () => {
      unsubBooks();
      unsubLoans();
    };
  }, [user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  // Open Edit Profile modal
  const openEditProfile = () => {
    if (user) {
      setEditDisplayName(user.displayName || '');
      setEditPhotoURL(user.photoURL || '');
      setEditBio(user.bio || '');
      setEditGenres(user.favoriteGenres || ['Fiction', 'Philosophy', 'Sci-Fi']);
    }
    setIsEditProfileOpen(true);
  };

  // Toggle or add genre tag
  const toggleGenre = (genre: string) => {
    if (editGenres.includes(genre)) {
      setEditGenres(editGenres.filter((g) => g !== genre));
    } else {
      setEditGenres([...editGenres, genre]);
    }
  };

  const handleAddCustomGenre = () => {
    const trimmed = customGenreInput.trim();
    if (trimmed && !editGenres.includes(trimmed)) {
      setEditGenres([...editGenres, trimmed]);
      setCustomGenreInput('');
    }
  };

  // Save Profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);
    try {
      const updated = await updateUserProfile(user.id, {
        displayName: editDisplayName.trim() || user.email?.split('@')[0],
        photoURL: editPhotoURL.trim(),
        bio: editBio.trim(),
        favoriteGenres: editGenres,
      });

      updateUserInState({
        displayName: updated.displayName,
        photoURL: updated.photoURL,
        bio: updated.bio,
        favoriteGenres: updated.favoriteGenres,
      });

      setIsEditProfileOpen(false);
      showToast('Profile updated successfully!');
    } catch (err: any) {
      console.error('Save profile error:', err);
      showToast(err.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Save Email address update
  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setEmailError('');

    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setIsSavingEmail(true);
    try {
      const updated = await updateUserProfile(user.id, { email: newEmail.trim() });
      if (updated.error) {
        setEmailError(updated.error);
        return;
      }
      updateUserInState({ email: updated.email });
      setIsEditEmailOpen(false);
      showToast('Email address updated successfully!');
    } catch (err: any) {
      console.error('Save email error:', err);
      setEmailError(err.message || 'Failed to update email address.');
    } finally {
      setIsSavingEmail(false);
    }
  };

  // Save or Toggle Notification Preference
  const handleToggleNotifPref = async (key: keyof NotificationPreferences) => {
    if (!user) return;
    const updatedPrefs = {
      ...notifPrefs,
      [key]: !notifPrefs[key],
    };
    setNotifPrefs(updatedPrefs);

    try {
      const updated = await updateUserProfile(user.id, {
        notificationPreferences: updatedPrefs,
      });
      updateUserInState({ notificationPreferences: updated.notificationPreferences });
      showToast('Notification preferences updated!');
    } catch (err) {
      console.error('Toggle notification error:', err);
      // revert state on failure
      setNotifPrefs(notifPrefs);
    }
  };

  const handleSaveAllNotifs = async () => {
    if (!user) return;
    setIsSavingNotifs(true);
    try {
      const updated = await updateUserProfile(user.id, {
        notificationPreferences: notifPrefs,
      });
      updateUserInState({ notificationPreferences: updated.notificationPreferences });
      setIsNotifModalOpen(false);
      showToast('Notification settings saved!');
    } catch (err: any) {
      console.error('Save notifs error:', err);
      showToast('Failed to save notification preferences');
    } finally {
      setIsSavingNotifs(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#2C2C2C] font-sans selection:bg-[#E5E0D8] pb-16">
      {/* Toast Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-[#4B5320] text-white px-5 py-3 rounded-2xl shadow-lg border border-[#3D441A] flex items-center gap-3 text-sm font-medium"
          >
            <Check className="w-4 h-4 text-emerald-300" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Header */}
      <nav className="sticky top-0 z-40 bg-[#F5F2ED]/90 backdrop-blur-md border-b border-[#E5E0D8]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/library')}
              className="p-2 hover:bg-[#E5E0D8] rounded-full transition-colors"
              title="Back to Library"
            >
              <ArrowLeft className="w-5 h-5 text-[#4B5320]" />
            </button>
            <span className="text-xl font-serif font-semibold tracking-tight italic text-[#4B5320]">Circle.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 bg-[#E5E0D8]/60 rounded-full font-medium text-[#4B5320]">
              Honesty Score: {user?.honestyScore || 100} pts
            </span>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E5E0D8] shadow-sm flex flex-col gap-8"
        >
          {/* Header Profile Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-white shadow-sm bg-[#D4A373]">
                <AvatarImage src={user?.photoURL || ''} alt={user?.displayName} />
                <AvatarFallback className="text-3xl text-white font-serif bg-[#4B5320]">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-serif tracking-tight text-[#2C2C2C]">
                    {user?.displayName || user?.email?.split('@')[0] || 'Reader'}
                  </h1>
                  <ShieldCheck className="w-5 h-5 text-[#4B5320]" />
                </div>
                
                <p className="text-sm opacity-70 italic mt-1 font-serif text-[#4B5320]">
                  {user?.bio || 'Bibliophile & Community Book Swapper'}
                </p>

                {/* Favorite Genres */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(user?.favoriteGenres && user.favoriteGenres.length > 0 
                    ? user.favoriteGenres 
                    : ['Fiction', 'Philosophy', 'Sci-Fi']
                  ).map((genre) => (
                    <span 
                      key={genre} 
                      className="px-3 py-0.5 bg-[#F5F2ED] border border-[#E5E0D8] rounded-full text-[11px] font-medium text-[#4B5320]"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Edit Profile Button */}
            <Button 
              onClick={openEditProfile}
              variant="outline" 
              className="rounded-xl border-[#E5E0D8] text-[#4B5320] hover:bg-[#F5F2ED] flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </Button>
          </div>

          {/* Reading & Shelf Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[#E5E0D8]">
            <div className="bg-[#F9F7F4] p-5 rounded-2xl border border-[#E5E0D8] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8C867E]">Books Owned</p>
                <Library className="w-4 h-4 text-[#4B5320]/60" />
              </div>
              <p className="text-3xl font-serif text-[#4B5320] font-semibold">{ownedCount}</p>
            </div>

            <div className="bg-[#F9F7F4] p-5 rounded-2xl border border-[#E5E0D8] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8C867E]">Books Borrowed</p>
                <BookOpen className="w-4 h-4 text-[#4B5320]/60" />
              </div>
              <p className="text-3xl font-serif text-[#4B5320] font-semibold">{borrowedCount}</p>
            </div>

            <div className="bg-[#F9F7F4] p-5 rounded-2xl border border-[#E5E0D8] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8C867E]">Currently Reading</p>
                <Bookmark className="w-4 h-4 text-[#4B5320]/60" />
              </div>
              <p className="text-3xl font-serif text-[#4B5320] font-semibold">
                {currentlyReadingCount > 0 ? currentlyReadingCount : <span className="text-xl italic opacity-50 font-normal">0</span>}
              </p>
            </div>
          </div>

          {/* Account Settings Section */}
          <div className="pt-6 border-t border-[#E5E0D8]">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-[#4B5320]" />
              <h3 className="text-xl font-serif text-[#2C2C2C]">Account Settings</h3>
            </div>

            <div className="space-y-4">
              {/* Email Address Update Card */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-[#F9F7F4] rounded-2xl border border-[#E5E0D8] gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-xl border border-[#E5E0D8]">
                    <Mail className="w-5 h-5 text-[#4B5320]" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-[#2C2C2C]">Email Address</p>
                    <p className="text-xs opacity-70 text-[#4B5320] font-mono mt-0.5">{user?.email}</p>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    setNewEmail(user?.email || '');
                    setEmailError('');
                    setIsEditEmailOpen(true);
                  }}
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl border-[#E5E0D8] text-[#4B5320] hover:bg-white text-xs font-medium"
                >
                  Update
                </Button>
              </div>

              {/* Notification Preferences Card */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-[#F9F7F4] rounded-2xl border border-[#E5E0D8] gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-xl border border-[#E5E0D8]">
                    <Bell className="w-5 h-5 text-[#4B5320]" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-[#2C2C2C]">Notification Preferences</p>
                    <p className="text-xs opacity-70 text-[#4B5320] mt-0.5">
                      {Object.values(notifPrefs).filter(Boolean).length} of 4 notification channels active
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => setIsNotifModalOpen(true)}
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl border-[#E5E0D8] text-[#4B5320] hover:bg-white text-xs font-medium"
                >
                  Manage
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Notification Controls */}
          <div className="p-5 bg-[#F5F2ED] rounded-2xl border border-[#E5E0D8] space-y-3">
            <h4 className="text-sm font-semibold font-serif text-[#4B5320] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Quick Notification Toggles
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#E5E0D8] cursor-pointer hover:border-[#4B5320]/40 transition-colors">
                <span className="font-medium text-gray-700">Borrow & Handover Alerts</span>
                <input 
                  type="checkbox"
                  checked={notifPrefs.borrowAlerts}
                  onChange={() => handleToggleNotifPref('borrowAlerts')}
                  className="w-4 h-4 accent-[#4B5320] rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#E5E0D8] cursor-pointer hover:border-[#4B5320]/40 transition-colors">
                <span className="font-medium text-gray-700">Book Club Activity</span>
                <input 
                  type="checkbox"
                  checked={notifPrefs.clubAlerts}
                  onChange={() => handleToggleNotifPref('clubAlerts')}
                  className="w-4 h-4 accent-[#4B5320] rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#E5E0D8] cursor-pointer hover:border-[#4B5320]/40 transition-colors">
                <span className="font-medium text-gray-700">Due Date Reminders</span>
                <input 
                  type="checkbox"
                  checked={notifPrefs.returnReminders}
                  onChange={() => handleToggleNotifPref('returnReminders')}
                  className="w-4 h-4 accent-[#4B5320] rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#E5E0D8] cursor-pointer hover:border-[#4B5320]/40 transition-colors">
                <span className="font-medium text-gray-700">Weekly Circle Digest</span>
                <input 
                  type="checkbox"
                  checked={notifPrefs.weeklyDigest}
                  onChange={() => handleToggleNotifPref('weeklyDigest')}
                  className="w-4 h-4 accent-[#4B5320] rounded cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Sign Out Action */}
          <div className="pt-4 flex justify-end">
             <Button 
               onClick={handleLogout}
               variant="outline" 
               className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
             >
               Sign out
             </Button>
          </div>
        </motion.div>
      </main>

      {/* 1. EDIT PROFILE MODAL */}
      <Modal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title="Edit Reader Profile"
        subtitle="Customize your public display name, avatar, bio, and reading genres"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Avatar selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
              Profile Avatar
            </label>
            <div className="flex items-center gap-4 mb-3">
              <Avatar className="w-16 h-16 border-2 border-[#E5E0D8] bg-[#4B5320]">
                <AvatarImage src={editPhotoURL} />
                <AvatarFallback className="text-xl text-white font-serif">
                  {editDisplayName.charAt(0) || 'R'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <input 
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={editPhotoURL}
                  onChange={(e) => setEditPhotoURL(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E5E0D8] rounded-xl bg-[#F9F7F4] focus:outline-none focus:ring-2 focus:ring-[#4B5320]"
                />
                <p className="text-[11px] text-gray-500 mt-1">Paste image URL or pick a preset below</p>
              </div>
            </div>

            {/* Quick avatar preset picks */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs text-gray-400 font-medium">Presets:</span>
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setEditPhotoURL(url)}
                  className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${
                    editPhotoURL === url ? 'border-[#4B5320] scale-110 shadow-sm' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Display Name
            </label>
            <input 
              type="text"
              required
              value={editDisplayName}
              onChange={(e) => setEditDisplayName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-[#E5E0D8] rounded-xl bg-[#F9F7F4] focus:outline-none focus:ring-2 focus:ring-[#4B5320]"
              placeholder="e.g. Jane Austen"
            />
          </div>

          {/* Reader Bio */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Reader Bio
            </label>
            <textarea
              rows={3}
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E5E0D8] rounded-xl bg-[#F9F7F4] focus:outline-none focus:ring-2 focus:ring-[#4B5320]"
              placeholder="Tell fellow readers a bit about your favorite authors and reading interests..."
            />
          </div>

          {/* Favorite Genres */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
              Favorite Genres
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_GENRES.map((genre) => {
                const selected = editGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      selected 
                        ? 'bg-[#4B5320] text-white border-[#3D441A] shadow-sm' 
                        : 'bg-[#F9F7F4] text-gray-700 border-[#E5E0D8] hover:bg-[#E5E0D8]/50'
                    }`}
                  >
                    {selected ? '✓ ' : ''}{genre}
                  </button>
                );
              })}
            </div>

            {/* Custom genre tag adder */}
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Add custom genre (e.g. Graphic Novels)..."
                value={customGenreInput}
                onChange={(e) => setCustomGenreInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomGenre();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs border border-[#E5E0D8] rounded-xl bg-[#F9F7F4]"
              />
              <Button 
                type="button" 
                onClick={handleAddCustomGenre}
                variant="outline" 
                size="sm"
                className="rounded-xl text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E0D8]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditProfileOpen(false)}
              className="rounded-xl border-[#E5E0D8]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSavingProfile}
              className="rounded-xl bg-[#4B5320] text-white hover:bg-[#3D441A]"
            >
              {isSavingProfile ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. UPDATE EMAIL MODAL */}
      <Modal
        isOpen={isEditEmailOpen}
        onClose={() => setIsEditEmailOpen(false)}
        title="Update Email Address"
        subtitle="Enter your new email address. This will be used for sign in and notifications."
        maxWidth="md"
      >
        <form onSubmit={handleSaveEmail} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Current Email
            </label>
            <input 
              type="text"
              disabled
              value={user?.email || ''}
              className="w-full px-3 py-2 text-sm border border-[#E5E0D8] rounded-xl bg-gray-100 text-gray-500 font-mono cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              New Email Address
            </label>
            <input 
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="new.email@example.com"
              className="w-full px-3 py-2.5 text-sm border border-[#E5E0D8] rounded-xl bg-[#F9F7F4] focus:outline-none focus:ring-2 focus:ring-[#4B5320] font-mono"
            />
          </div>

          {emailError && (
            <p className="text-xs text-red-600 font-medium bg-red-50 p-2.5 rounded-xl border border-red-200">
              {emailError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E0D8]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditEmailOpen(false)}
              className="rounded-xl border-[#E5E0D8]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSavingEmail}
              className="rounded-xl bg-[#4B5320] text-white hover:bg-[#3D441A]"
            >
              {isSavingEmail ? 'Updating...' : 'Update Email'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. MANAGE NOTIFICATION PREFERENCES MODAL */}
      <Modal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        title="Notification Preferences"
        subtitle="Manage how and when you receive email and community notifications"
        maxWidth="md"
      >
        <div className="space-y-4 py-2">
          <div className="p-4 bg-[#F9F7F4] rounded-2xl border border-[#E5E0D8] flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-sm text-[#2C2C2C]">Borrow Requests & Handover</p>
              <p className="text-xs text-gray-500">Alerts when someone requests your book or confirms a handover.</p>
            </div>
            <input 
              type="checkbox"
              checked={notifPrefs.borrowAlerts}
              onChange={() => setNotifPrefs({ ...notifPrefs, borrowAlerts: !notifPrefs.borrowAlerts })}
              className="w-5 h-5 accent-[#4B5320] rounded cursor-pointer"
            />
          </div>

          <div className="p-4 bg-[#F9F7F4] rounded-2xl border border-[#E5E0D8] flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-sm text-[#2C2C2C]">Book Club Discussions</p>
              <p className="text-xs text-gray-500">Notifications when members post or comment in your joined clubs.</p>
            </div>
            <input 
              type="checkbox"
              checked={notifPrefs.clubAlerts}
              onChange={() => setNotifPrefs({ ...notifPrefs, clubAlerts: !notifPrefs.clubAlerts })}
              className="w-5 h-5 accent-[#4B5320] rounded cursor-pointer"
            />
          </div>

          <div className="p-4 bg-[#F9F7F4] rounded-2xl border border-[#E5E0D8] flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-sm text-[#2C2C2C]">Due Date & Return Reminders</p>
              <p className="text-xs text-gray-500">Reminders when a borrowed book is due for return.</p>
            </div>
            <input 
              type="checkbox"
              checked={notifPrefs.returnReminders}
              onChange={() => setNotifPrefs({ ...notifPrefs, returnReminders: !notifPrefs.returnReminders })}
              className="w-5 h-5 accent-[#4B5320] rounded cursor-pointer"
            />
          </div>

          <div className="p-4 bg-[#F9F7F4] rounded-2xl border border-[#E5E0D8] flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-sm text-[#2C2C2C]">Weekly Circle Digest</p>
              <p className="text-xs text-gray-500">A weekly roundup of trending books, events, and wishlist matches.</p>
            </div>
            <input 
              type="checkbox"
              checked={notifPrefs.weeklyDigest}
              onChange={() => setNotifPrefs({ ...notifPrefs, weeklyDigest: !notifPrefs.weeklyDigest })}
              className="w-5 h-5 accent-[#4B5320] rounded cursor-pointer"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E0D8]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNotifModalOpen(false)}
              className="rounded-xl border-[#E5E0D8]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveAllNotifs}
              disabled={isSavingNotifs}
              className="rounded-xl bg-[#4B5320] text-white hover:bg-[#3D441A]"
            >
              {isSavingNotifs ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
