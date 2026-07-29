import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Plus, 
  CheckCircle2, 
  Sparkles, 
  ThumbsUp, 
  Loader2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '../../providers/AuthProvider';
import { useToast } from '../../providers/ToastProvider';
import { WishlistItem } from '../../types';
import { subscribeToWishlist, addWishlistItem, toggleUpvote, addOfferToWishlistItem } from '../../services/wishlistService';
import { CustomSelect } from '@/components/ui/CustomSelect';

const WISHLIST_GENRE_OPTIONS = [
  { value: 'Fiction', label: 'Fiction' },
  { value: 'Non-Fiction', label: 'Non-Fiction' },
  { value: 'Philosophy', label: 'Philosophy' },
  { value: 'Sci-Fi & Fantasy', label: 'Sci-Fi & Fantasy' },
  { value: 'Manga & Comic', label: 'Manga & Comic' },
  { value: 'Self-Help', label: 'Self-Help' },
  { value: 'Biography', label: 'Biography' },
];

interface WishlistBoardTabProps {
  onAddBookToCatalog?: () => void;
}

export default function WishlistBoardTab({ onAddBookToCatalog }: WishlistBoardTabProps) {
  const { user } = useAuth();
  const { notify, notifyError } = useToast();
  const [requests, setRequests] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New Request Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [note, setNote] = useState('');
  const [genre, setGenre] = useState('Fiction');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Offer Modal State
  const [offerModalItem, setOfferModalItem] = useState<any | null>(null);
  const [offerMessage, setOfferMessage] = useState('');
  const [offering, setOffering] = useState(false);
  const [offerSuccess, setOfferSuccess] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToWishlist((data) => {
      setRequests(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim()) {
      setError('Book title is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await addWishlistItem({
        title: title.trim(),
        author: author.trim() || 'Unknown',
        notes: note.trim(),
        category: genre,
      });

      setTitle('');
      setAuthor('');
      setNote('');
      setIsModalOpen(false);
      notify(`Posted your request for ${title.trim()}.`);
    } catch (err: any) {
      console.error('Error adding wishlist request:', err);
      setError(err.message || 'Failed to post request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleUpvote = async (reqItem: any) => {
    if (!user) return;
    try {
      // The server derives the voter from the session and returns the updated
      // item; the poll refresh inside the service picks it up.
      await toggleUpvote(reqItem.id);
    } catch (err: any) {
      console.error('Error toggling upvote:', err);
      notifyError(err?.message || 'Could not record that. Please try again.');
    }
  };

  const handleSendOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerModalItem || !user) return;

    setOffering(true);
    try {
      // Identity comes from the session server-side; only the message is sent.
      await addOfferToWishlistItem(offerModalItem.id, {
        message: offerMessage.trim() || 'I have a copy of this book available to lend!',
      });

      setOfferSuccess(true);
      notify(`Offer sent for ${offerModalItem.title}.`);
      setTimeout(() => {
        setOfferSuccess(false);
        setOfferModalItem(null);
        setOfferMessage('');
      }, 1500);
    } catch (err: any) {
      console.error('Error sending offer:', err);
      notifyError(err?.message || 'Could not send that offer. Please try again.');
    } finally {
      setOffering(false);
    }
  };

  return (
    <div className="space-y-8 font-sans text-[#2C2C2C]">
      
      {/* Header Banner */}
      <div className="bg-[#F9F7F4] border border-[#E5E0D8] p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#4B5320]/10 text-[#4B5320] rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            <Heart className="w-3.5 h-3.5 fill-[#4B5320]" /> Circle Wishlist & Requests
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#2C2C2C]">
            Can't find a book in our circle?
          </h2>
          <p className="text-xs text-[#8C867E] mt-1 max-w-xl">
            Post a request for books you'd love to read. Neighbors and friends who own a copy can offer to lend it or add it to the shared shelf!
          </p>
        </div>

        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#4B5320] text-white hover:bg-[#3D441A] rounded-2xl px-5 py-6 text-sm font-medium shadow-md shadow-[#4B5320]/10 shrink-0 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Request a Book
        </Button>
      </div>

      {/* Requests Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#4B5320]" />
        </div>
      ) : requests.length === 0 ? (
        <Card className="bg-white rounded-3xl border border-[#E5E0D8] p-12 text-center space-y-3">
          <HelpCircle className="w-12 h-12 text-[#8C867E] mx-auto opacity-50" />
          <h3 className="font-serif text-xl font-semibold text-[#2C2C2C]">No Book Requests Yet</h3>
          <p className="text-xs text-[#8C867E] max-w-sm mx-auto">
            Be the first to request a book! Your circle members will be notified to check their home bookshelves.
          </p>
          <Button onClick={() => setIsModalOpen(true)} className="bg-[#4B5320] text-white rounded-xl text-xs px-4 py-2 mt-2">
            Post First Request
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((reqItem: any) => {
            const upvotesCount = reqItem.upvotes?.length || 0;
            // AuthUser exposes `id`, not `uid`. Comparing against `user?.uid`
            // was always undefined, so isRequester never became true and the
            // self-lend guard below never applied.
            const currentUserId = user?.id;
            const hasUpvoted = !!currentUserId && reqItem.upvotes?.includes(currentUserId);
            const isRequester = !!currentUserId && currentUserId === reqItem.requesterId;
            const offersCount = reqItem.offers?.length || 0;

            return (
              <Card key={reqItem.id} className="bg-white rounded-3xl border border-[#E5E0D8] p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Badge variant="outline" className="border-[#E5E0D8] bg-[#F9F7F4] text-[#4B5320] text-[10px]">
                      {reqItem.genre || 'General'}
                    </Badge>

                    {reqItem.status === 'OFFERED' ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px]">
                        Copy Offered ({offersCount})
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px]">
                        Open Request
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-serif text-lg font-bold text-[#2C2C2C] leading-snug">{reqItem.title}</h3>
                  <p className="text-xs text-[#8C867E] italic mb-3">by {reqItem.author}</p>

                  {reqItem.note && (
                    <p className="text-xs text-[#2C2C2C] bg-[#F9F7F4] p-3 rounded-2xl border border-[#E5E0D8] mb-4 italic">
                      "{reqItem.note}"
                    </p>
                  )}

                  {/* Requester Profile */}
                  <div className="flex items-center gap-2 mb-4">
                    <Avatar className="w-6 h-6 border border-[#E5E0D8]">
                      <AvatarImage src={reqItem.requesterAvatar} />
                      <AvatarFallback className="text-[10px] bg-[#D4A373] text-white font-serif">{reqItem.requesterName[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-[11px] text-[#8C867E]">
                      Requested by <strong className="text-[#2C2C2C]">{reqItem.requesterName}</strong>
                    </span>
                  </div>

                  {/* List of Offers */}
                  {offersCount > 0 && (
                    <div className="space-y-2 mb-4 pt-3 border-t border-dashed border-[#E5E0D8]">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8C867E]">Offers from lenders:</p>
                      {reqItem.offers.map((off: any, idx: number) => (
                        <div key={idx} className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {off.offererName}
                          </div>
                          <p className="text-[11px] text-emerald-800 italic">"{off.message}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="pt-4 border-t border-[#E5E0D8] flex items-center justify-between gap-2 mt-2">
                  <Button
                    size="sm"
                    variant={hasUpvoted ? "default" : "outline"}
                    onClick={() => handleToggleUpvote(reqItem)}
                    className={`rounded-xl text-xs gap-1.5 ${
                      hasUpvoted ? 'bg-[#4B5320] text-white hover:bg-[#3D441A]' : 'border-[#E5E0D8] text-[#2C2C2C] hover:bg-[#F9F7F4]'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{upvotesCount} {upvotesCount === 1 ? 'Me Too' : 'Want This'}</span>
                  </Button>

                  {!isRequester && (
                    <Button
                      size="sm"
                      onClick={() => setOfferModalItem(reqItem)}
                      className="bg-[#2D5A27] text-white hover:bg-[#23471f] rounded-xl text-xs gap-1.5 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> I Can Lend This
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Request Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 font-sans border-[#E5E0D8]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-[#2C2C2C] flex items-center gap-2">
              <Heart className="w-6 h-6 text-[#4B5320]" /> Request a Book
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateRequest} className="space-y-4 mt-2">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#8C867E] mb-1 block">
                Book Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Atomic Habits, Dune, Sapiens..."
                required
                className="w-full px-3.5 py-2.5 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#4B5320]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#8C867E] mb-1 block">
                Author
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. James Clear, Frank Herbert..."
                className="w-full px-3.5 py-2.5 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#4B5320]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#8C867E] mb-1 block">
                  Genre / Category
                </label>
                <CustomSelect
                  options={WISHLIST_GENRE_OPTIONS}
                  value={genre}
                  onChange={setGenre}
                  className="w-full"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#8C867E] mb-1 block">
                Why would you like to read this? (Optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Preparing for our upcoming book club discussion..."
                rows={2}
                className="w-full px-3.5 py-2.5 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#4B5320] resize-none"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="w-1/3 rounded-xl border-[#E5E0D8] text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="w-2/3 bg-[#4B5320] text-white hover:bg-[#3D441A] rounded-xl text-xs font-medium py-2.5">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Publish Request'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Offer Modal */}
      <Dialog open={!!offerModalItem} onOpenChange={(open) => !open && setOfferModalItem(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 font-sans border-[#E5E0D8]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-[#2C2C2C] flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#2D5A27]" /> Offer Your Copy
            </DialogTitle>
          </DialogHeader>

          {offerSuccess ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
              <h3 className="font-serif text-xl font-semibold">Offer Sent!</h3>
              <p className="text-xs text-[#8C867E]">
                {offerModalItem?.requesterName} has been notified of your offer.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendOffer} className="space-y-4 mt-2">
              <div className="p-3 bg-[#F9F7F4] rounded-2xl border border-[#E5E0D8]">
                <p className="text-xs text-[#8C867E]">Offering copy for:</p>
                <p className="font-serif text-base font-bold text-[#2C2C2C]">{offerModalItem?.title}</p>
                <p className="text-xs text-[#8C867E]">Requested by {offerModalItem?.requesterName}</p>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#8C867E] mb-1 block">
                  Message for {offerModalItem?.requesterName}
                </label>
                <textarea
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  placeholder="Hi! I have a pristine copy of this on my bookshelf and can lend it anytime this week..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#4B5320] resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <Button type="button" variant="outline" onClick={() => setOfferModalItem(null)} className="w-1/3 rounded-xl border-[#E5E0D8] text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={offering} className="w-2/3 bg-[#2D5A27] text-white hover:bg-[#23471f] rounded-xl text-xs font-medium py-2.5">
                  {offering ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Send Lending Offer'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
