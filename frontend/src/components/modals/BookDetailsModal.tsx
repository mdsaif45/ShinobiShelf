import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Loader2, BookOpen, Clock, User, Star, Send, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '../../providers/AuthProvider';
import { updateBook } from '../../services/bookService';

interface BookDetailsModalProps {
  book: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBorrowClick?: (book: any) => void;
}

export default function BookDetailsModal({ book, open, onOpenChange, onBorrowClick }: BookDetailsModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);

  // Reviews State. Seeded empty: a placeholder review here was shown on every
  // book, including ones added seconds earlier, reading as a real review.
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState<number>(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Progress Update State
  const [currentProgress, setCurrentProgress] = useState<number>(book?.progress || 0);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [progressSaved, setProgressSaved] = useState(false);

  useEffect(() => {
    if (open && book) {
      setCurrentProgress(book.progress || 0);

      if (book.isbn) {
        fetchBookDetails(book.isbn);
      } else {
        setDetails(null);
      }
    }
  }, [open, book]);

  const fetchBookDetails = async (isbn: string) => {
    setLoading(true);
    try {
      const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&jscmd=details&format=json`);
      const data = await response.json();
      const bookData = data[`ISBN:${isbn}`];
      
      let fetchedDetails = bookData ? bookData.details : null;
      
      if (fetchedDetails && !fetchedDetails.description && fetchedDetails.works && fetchedDetails.works.length > 0) {
        const workKey = fetchedDetails.works[0].key;
        const workResponse = await fetch(`https://openlibrary.org${workKey}.json`);
        const workData = await workResponse.json();
        if (workData.description) {
           fetchedDetails = { ...fetchedDetails, description: workData.description };
        }
        if (workData.subjects) {
           fetchedDetails = { ...fetchedDetails, subjects: workData.subjects };
        }
      }
      
      setDetails(fetchedDetails);
    } catch (error) {
      console.error('Error fetching book details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async () => {
    if (!book || !user) return;
    setUpdatingProgress(true);
    try {
      await updateBook(book.id, { progress: currentProgress });
      setProgressSaved(true);
      setTimeout(() => setProgressSaved(false), 2000);
    } catch (err) {
      console.error('Error updating reading progress:', err);
    } finally {
      setUpdatingProgress(false);
    }
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book || !user || !reviewText.trim()) return;

    setSubmittingReview(true);
    try {
      const newRev = {
        id: `rev-${Date.now()}`,
        bookId: book.id,
        bookTitle: book.title,
        userId: user.id || user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Reader',
        userAvatar: user.photoURL || '',
        rating,
        text: reviewText.trim(),
        createdAt: new Date().toISOString()
      };
      setReviews([newRev, ...reviews]);
      setReviewText('');
      setRating(5);
    } catch (err) {
      console.error('Error submitting review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!book) return null;

  const isAvailable = book.status === 'AVAILABLE';
  // AuthUser exposes `id`; `user.uid` is always undefined, so this comparison
  // never matched and isReader was permanently false.
  const isReader = !!user && (book.currentReader?.uid === user.id || book.ownerId === user.id);

  // Null rather than a fabricated default: this previously fell back to '5.0',
  // so an unreviewed book advertised a perfect score alongside "(0 reviews)".
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white rounded-3xl p-0 font-sans overflow-hidden border-[#E5E0D8]">
        <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
          {/* Cover Section */}
          <div className="md:w-2/5 bg-[#F9F7F4] p-8 flex flex-col items-center justify-center relative border-b md:border-b-0 md:border-r border-[#E5E0D8]">
            <div className="absolute top-4 left-4 flex gap-2 z-20">
              {isAvailable ? (
                <span className="text-[10px] bg-[#F0F7F0]/95 backdrop-blur-sm text-[#2D5A27] px-2 py-0.5 rounded uppercase font-bold tracking-tighter">Available</span>
              ) : (
                <span className="text-[10px] bg-[#FFF5F0]/95 backdrop-blur-sm text-[#D44D22] px-2 py-0.5 rounded uppercase font-bold tracking-tighter">Borrowed</span>
              )}
            </div>
            
            {book.coverUrl ? (
              <img 
                src={book.coverUrl} 
                alt={book.title}
                className="w-48 shadow-xl rounded-sm object-cover"
              />
            ) : (
              <div className="w-48 h-72 bg-[#E8E4E0] flex items-center justify-center text-center p-4 rounded-sm shadow-xl">
                <span className="font-serif text-neutral-400">No Cover Available</span>
              </div>
            )}

            {/* Average rating, shown only once there is something to average. */}
            <div className="mt-4 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#E5E0D8] shadow-sm">
              {avgRating ? (
                <>
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-serif font-bold text-xs text-[#2C2C2C]">{avgRating}</span>
                  <span className="text-[10px] text-[#8C867E]">
                    ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                  </span>
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 text-[#D8D3CC]" />
                  <span className="text-[10px] text-[#8C867E]">No reviews yet</span>
                </>
              )}
            </div>
          </div>

          {/* Details & Interactive Reviews Section */}
          <div className="md:w-3/5 p-6 overflow-y-auto space-y-6">
            <DialogHeader>
              <DialogTitle className="font-serif text-3xl leading-tight text-[#2C2C2C]">{book.title}</DialogTitle>
              <p className="text-base opacity-70 italic mt-1">{book.author}</p>
            </DialogHeader>

            {/* Owner Info */}
            <div className="flex items-center gap-3 p-3 bg-[#F9F7F4] rounded-2xl border border-[#E5E0D8]">
              <Avatar className="w-9 h-9 border-2 border-white shadow-sm bg-[#D4A373]">
                {book.owner?.avatar && <AvatarImage src={book.owner.avatar} />}
                <AvatarFallback className="text-white font-serif bg-transparent">{book.owner?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#8C867E]">Owned By</p>
                <p className="font-medium text-xs">{book.owner?.name}</p>
              </div>
            </div>

            {/* Currently Borrowed & Progress Updater */}
            {!isAvailable && book.currentReader && (
              <div className="p-4 border border-[#E5E0D8] rounded-2xl bg-[#F9F7F4]/50 space-y-3">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8C867E]">Currently Borrowed By</p>
                <div className="flex items-center gap-3">
                   <Avatar className="w-8 h-8 bg-[#BC8F8F]">
                      <AvatarFallback className="text-xs text-white bg-transparent">{book.currentReader.name[0]}</AvatarFallback>
                   </Avatar>
                   <span className="text-xs font-medium">{book.currentReader.name}</span>
                </div>

                {/* Progress Control for Reader */}
                {isReader ? (
                  <div className="pt-2 border-t border-[#E5E0D8] space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#4B5320]">Update Reading Progress</span>
                      <span className="font-semibold text-[#2C2C2C]">{currentProgress}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={currentProgress} 
                      onChange={(e) => setCurrentProgress(Number(e.target.value))}
                      className="w-full accent-[#4B5320]"
                    />
                    <Button 
                      size="sm" 
                      onClick={handleUpdateProgress} 
                      disabled={updatingProgress}
                      className="w-full bg-[#4B5320] text-white hover:bg-[#3D441A] rounded-xl text-xs py-1.5 h-auto flex items-center justify-center gap-1"
                    >
                      {updatingProgress ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : progressSaved ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" /> Saved!
                        </>
                      ) : (
                        'Save Progress'
                      )}
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="w-full bg-[#F0EEEB] h-2 rounded-full overflow-hidden mb-1">
                      <div 
                        className="bg-[#4B5320] h-full rounded-full transition-all duration-500" 
                        style={{ width: `${book.progress || 0}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-medium opacity-60 text-right">{book.progress || 0}% Complete</p>
                  </div>
                )}
              </div>
            )}

            {/* Book Description */}
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
              </div>
            ) : details?.description ? (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C867E] mb-1.5">Synopsis</h4>
                <p className="text-xs text-[#2C2C2C] leading-relaxed opacity-80 whitespace-pre-line max-h-32 overflow-y-auto">
                  {typeof details.description === 'string' ? details.description : details.description.value}
                </p>
              </div>
            ) : null}

            {/* Community Reviews & Ratings Section */}
            <div className="pt-4 border-t border-[#E5E0D8] space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C867E] flex items-center justify-between">
                <span>Circle Reviews ({reviews.length})</span>
                {avgRating && (
                  <span className="text-[10px] text-[#4B5320] font-normal lowercase">★ {avgRating} avg</span>
                )}
              </h4>

              {/* Add Review Form */}
              <form onSubmit={handlePostReview} className="p-3 bg-[#F9F7F4] rounded-2xl border border-[#E5E0D8] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#2C2C2C]">Leave a Star Rating:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                      >
                        <Star className={`w-4 h-4 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your thoughts or takeaways..."
                    className="flex-1 px-3 py-1.5 bg-white border border-[#E5E0D8] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#4B5320]"
                  />
                  <Button type="submit" size="sm" disabled={submittingReview || !reviewText.trim()} className="bg-[#4B5320] text-white rounded-xl text-xs px-3">
                    {submittingReview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </form>

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <p className="text-xs text-[#8C867E] italic text-center py-2">No reviews yet. Be the first to share your thoughts!</p>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-3 bg-white border border-[#E5E0D8] rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={rev.userAvatar} />
                            <AvatarFallback className="text-[9px] bg-[#D4A373] text-white">{rev.userName[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-[#2C2C2C]">{rev.userName}</span>
                        </div>
                        <div className="flex">
                          {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-[#2C2C2C] text-[11px] leading-relaxed pl-7">{rev.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="pt-4 border-t border-[#E5E0D8]">
              {isAvailable ? (
                <Button 
                  onClick={() => {
                    onOpenChange(false);
                    if (onBorrowClick) onBorrowClick(book);
                  }}
                  className="w-full py-5 bg-[#4B5320] text-white rounded-xl text-sm font-medium hover:bg-[#3D441A] transition-colors shadow-lg shadow-[#4B5320]/10"
                >
                  Borrow This Book
                </Button>
              ) : (
                <Button variant="outline" className="w-full py-5 rounded-xl border-[#E5E0D8] text-[#4B5320] hover:bg-[#F9F7F4] text-sm font-medium">
                  Currently Borrowed
                </Button>
              )}
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
