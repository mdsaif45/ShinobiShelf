import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Calendar, Clock, AlertCircle, CheckCircle2, ShieldCheck, HeartHandshake, Loader2 } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import { useToast } from '../../providers/ToastProvider';
import { createBorrowRequest } from '../../services/loanService';

interface BorrowRequestModalProps {
  book: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestSubmitted?: () => void;
}

export default function BorrowRequestModal({ book, open, onOpenChange, onRequestSubmitted }: BorrowRequestModalProps) {
  const { user } = useAuth();
  const { notify } = useToast();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // Default dates: Today and +14 days
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultDue = new Date();
  defaultDue.setDate(defaultDue.getDate() + 14);
  const defaultDueStr = defaultDue.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState(defaultDueStr);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!book) return null;

  const isOwner = user && (book.ownerId === user.id || book.ownerId === user.uid);

  // Calculate duration in days
  const start = new Date(startDate);
  const due = new Date(dueDate);
  const durationDays = Math.max(1, Math.ceil((due.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to borrow books.');
      return;
    }
    if (isOwner) {
      setError('You are the owner of this book.');
      return;
    }
    if (durationDays < 1) {
      setError('Return date must be after start date.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createBorrowRequest({
        bookId: book.id,
        bookTitle: book.title,
        bookAuthor: book.author || 'Unknown',
        bookCoverUrl: book.coverUrl || '',
        bookIsbn: book.isbn || '',
        ownerId: book.ownerId,
        ownerName: book.owner?.name || 'Owner',
        ownerAvatar: book.owner?.avatar || '',
        borrowerId: user.id,
        borrowerName: user.displayName || user.email?.split('@')[0] || 'Borrower',
        borrowerEmail: user.email || '',
        borrowerAvatar: user.photoURL || '',
        startDate,
        dueDate,
        durationDays,
        note,
        status: 'PENDING'
      });

      // No updateBook here: the request itself records the borrower, and the
      // server owns the book's status. Writing it from the client duplicated
      // that and could race with the server's own update.

      setSuccessMsg(true);
      notify(`Request sent to ${book.owner?.name || 'the owner'} for ${book.title}.`);
      setTimeout(() => {
        setSuccessMsg(false);
        onOpenChange(false);
        if (onRequestSubmitted) onRequestSubmitted();
      }, 1500);

    } catch (err: any) {
      console.error('Error submitting borrow request:', err);
      setError(err.message || 'Failed to submit borrow request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 font-sans border-[#E5E0D8]">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[#2C2C2C] flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-[#4B5320]" />
            Request to Borrow
          </DialogTitle>
        </DialogHeader>

        {successMsg ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-[#2D5A27] mx-auto animate-bounce" />
            <h3 className="font-serif text-xl font-semibold text-[#2C2C2C]">Request Sent!</h3>
            <p className="text-sm text-[#8C867E]">
              {book.owner?.name || 'Owner'} has been notified. Check 'Loans & Calendar' for status updates.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitRequest} className="space-y-4 mt-2">
            {/* Book Info Summary */}
            <div className="flex gap-4 p-3 bg-[#F9F7F4] rounded-2xl border border-[#E5E0D8] items-center">
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className="w-12 h-16 object-cover rounded shadow-sm" />
              ) : (
                <div className="w-12 h-16 bg-[#E8E4E0] rounded flex items-center justify-center text-[10px] text-center p-1">
                  No Cover
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="font-serif text-base font-semibold truncate text-[#2C2C2C]">{book.title}</h4>
                <p className="text-xs text-[#8C867E] italic truncate">{book.author}</p>
                <div className="mt-1 text-[11px] text-[#4B5320] font-medium flex items-center gap-1">
                  Owner: <span className="font-bold">{book.owner?.name}</span>
                </div>
              </div>
            </div>

            {isOwner && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                This is your own book! You cannot borrow your own listing.
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Dates Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#8C867E] mb-1 block">
                  Start Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#4B5320]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#8C867E] mb-1 block">
                  Return Due Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={startDate}
                    required
                    className="w-full px-3 py-2 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#4B5320]"
                  />
                </div>
              </div>
            </div>

            {/* Duration & Points Incentive */}
            <div className="p-3 bg-[#F0F7F0] border border-[#2D5A27]/20 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#2D5A27] shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-[#2D5A27]">
                  {durationDays} Day Loan Period (+10 Honesty Points)
                </div>
                <p className="text-[11px] text-[#2D5A27]/80 mt-0.5">
                  Return this book on or before <strong>{dueDate}</strong> to earn +10 Honesty Points and boost your library trust score!
                </p>
              </div>
            </div>

            {/* Note to Owner */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#8C867E] mb-1 block">
                Note for {book.owner?.name || 'Owner'} (Optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Hi, I'd love to read this for my reading goal this month..."
                rows={2}
                className="w-full px-3 py-2 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#4B5320] resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-1/3 rounded-xl border-[#E5E0D8] text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || isOwner}
                className="w-2/3 bg-[#4B5320] text-white hover:bg-[#3D441A] rounded-xl text-xs font-medium py-2.5 shadow-md shadow-[#4B5320]/10 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  'Send Request'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
