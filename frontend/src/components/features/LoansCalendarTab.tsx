import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  BookOpen, 
  Check, 
  X, 
  Sparkles, 
  Award, 
  ShieldAlert,
  Loader2,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '../../providers/AuthProvider';
import { subscribeToBorrowRequests, updateBorrowRequestStatus, awardHonestyPoints } from '../../services/loanService';
import { updateBook } from '../../services/bookService';
import { BorrowRequest } from '../../types';

export default function LoansCalendarTab() {
  const { user } = useAuth();
  const [borrowedLoans, setBorrowedLoans] = useState<any[]>([]);
  const [lentLoans, setLentLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(new Date().getDate());

  // Return Book Dialog
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedLoanForReturn, setSelectedLoanForReturn] = useState<any>(null);
  const [returning, setReturning] = useState(false);
  const [returnResult, setReturnResult] = useState<{ onTime: boolean; pointsDelta: number } | null>(null);

  // User Honesty Score State
  const [userHonestyScore, setUserHonestyScore] = useState<number>(user?.honestyScore || 100);

  // Fetch Loans & User Profile
  useEffect(() => {
    if (!user) return;

    setUserHonestyScore(user.honestyScore || 100);

    const unsubLoans = subscribeToBorrowRequests((allLoans: BorrowRequest[]) => {
      const myBorrowed = allLoans.filter(l => l.borrowerId === user.id);
      const myLent = allLoans.filter(l => l.ownerId === user.id || l.book?.ownerId === user.id);
      setBorrowedLoans(myBorrowed);
      setLentLoans(myLent);
      setLoading(false);
    });

    return () => {
      unsubLoans();
    };
  }, [user]);

  // Calendar Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Check if a given day has active loans or due dates
  const getLoansForDay = (day: number) => {
    const formattedDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const allLoans = [...borrowedLoans, ...lentLoans];

    return allLoans.filter(loan => {
      if (loan.status === 'RETURNED' || loan.status === 'REJECTED') return false;
      const start = loan.startDate;
      const due = loan.dueDate;
      return formattedDayStr >= start && formattedDayStr <= due;
    });
  };

  // Actions for Approval/Rejection
  const handleApproveLoan = async (loan: any) => {
    try {
      await updateBorrowRequestStatus(loan.id, 'APPROVED');
      if (loan.bookId) {
        await updateBook(loan.bookId, {
          status: 'BORROWED',
          currentReader: {
            uid: loan.borrowerId,
            name: loan.borrowerName,
            dueDate: loan.dueDate
          },
          progress: 0
        });
      }
    } catch (err) {
      console.error('Error approving loan:', err);
    }
  };

  const handleDeclineLoan = async (loan: any) => {
    try {
      await updateBorrowRequestStatus(loan.id, 'REJECTED');
      if (loan.bookId) {
        await updateBook(loan.bookId, {
          status: 'AVAILABLE',
          pendingBorrower: undefined
        });
      }
    } catch (err) {
      console.error('Error declining loan:', err);
    }
  };

  // Handle Returning a Book & Honesty Points Calculation
  const handleConfirmReturn = async () => {
    if (!selectedLoanForReturn || !user) return;
    setReturning(true);

    try {
      const todayISO = new Date().toISOString().split('T')[0];
      const isTodayOnTime = todayISO <= selectedLoanForReturn.dueDate;
      const pointsDelta = isTodayOnTime ? 10 : -5;

      await updateBorrowRequestStatus(selectedLoanForReturn.id, 'RETURNED', {
        returnedAt: new Date().toISOString(),
        returnedOnTime: isTodayOnTime
      });

      if (selectedLoanForReturn.bookId) {
        await updateBook(selectedLoanForReturn.bookId, {
          status: 'AVAILABLE',
          currentReader: undefined,
          pendingBorrower: undefined,
          progress: 100
        });
      }

      await awardHonestyPoints(user.id, pointsDelta);
      setUserHonestyScore(prev => prev + pointsDelta);

      setReturnResult({ onTime: isTodayOnTime, pointsDelta });
    } catch (err) {
      console.error('Error returning book:', err);
    } finally {
      setReturning(false);
    }
  };

  const pendingRequestsForMe = lentLoans.filter(l => l.status === 'PENDING');
  const activeBorrows = borrowedLoans.filter(l => l.status !== 'REJECTED');
  const activeLends = lentLoans.filter(l => l.status === 'APPROVED');

  // A declined request used to vanish from both parties' views: the borrower's
  // list excluded REJECTED and the owner's showed only APPROVED, so neither
  // side ever learned the outcome even though the backend stored it correctly.
  const declinedForMe = borrowedLoans.filter(l => l.status === 'REJECTED');

  return (
    <div className="space-y-8 font-sans text-[#2C2C2C]">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Interactive Loan Calendar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white rounded-3xl border border-[#E5E0D8] shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-semibold flex items-center gap-2 text-[#2C2C2C]">
                <CalendarIcon className="w-5 h-5 text-[#4B5320]" />
                {monthNames[month]} {year}
              </h3>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" onClick={handlePrevMonth} className="h-8 w-8 rounded-full hover:bg-[#F5F2ED]">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={handleNextMonth} className="h-8 w-8 rounded-full hover:bg-[#F5F2ED]">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Days Grid Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#8C867E] uppercase tracking-wider mb-2">
              <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* Empty cells before 1st */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-9" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const activeLoansOnDay = getLoansForDay(day);
                const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                const isSelected = selectedCalendarDay === day;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedCalendarDay(day)}
                    className={`h-9 rounded-xl flex flex-col items-center justify-center relative text-xs transition-all ${
                      isSelected 
                        ? 'bg-[#4B5320] text-white font-bold shadow-md' 
                        : isToday 
                        ? 'border border-[#4B5320] font-bold text-[#4B5320]' 
                        : 'hover:bg-[#F5F2ED] text-[#2C2C2C]'
                    }`}
                  >
                    <span>{day}</span>
                    {activeLoansOnDay.length > 0 && (
                      <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1 ${isSelected ? 'bg-white' : 'bg-[#D44D22]'}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Day Loan Details preview */}
            {selectedCalendarDay && (
              <div className="mt-5 pt-4 border-t border-[#E5E0D8]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8C867E] mb-2">
                  Loans on {monthNames[month]} {selectedCalendarDay}:
                </h4>
                {getLoansForDay(selectedCalendarDay).length === 0 ? (
                  <p className="text-xs text-[#8C867E] italic">No active loan deadlines on this date.</p>
                ) : (
                  <div className="space-y-2">
                    {getLoansForDay(selectedCalendarDay).map(loan => (
                      <div key={loan.id} className="p-2.5 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl text-xs flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-[#2C2C2C] truncate max-w-[150px]">{loan.bookTitle}</p>
                          <p className="text-[10px] text-[#8C867E]">Due: {loan.dueDate}</p>
                        </div>
                        <Badge className="bg-[#4B5320]/10 text-[#4B5320] border-none text-[10px]">
                          {loan.borrowerId === user?.uid ? 'Borrowed' : 'Lent Out'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Loan Requests & Active Loans List */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section: Pending Requests on my books */}
          {pendingRequestsForMe.length > 0 && (
            <Card className="bg-amber-50/60 border border-amber-200 rounded-3xl p-5 shadow-sm">
              <h3 className="font-serif text-lg font-semibold text-amber-900 flex items-center gap-2 mb-3">
                <UserCheck className="w-5 h-5 text-amber-700" />
                Incoming Borrow Requests ({pendingRequestsForMe.length})
              </h3>
              <div className="space-y-3">
                {pendingRequestsForMe.map(req => (
                  <div key={req.id} className="bg-white p-4 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border border-[#E5E0D8]">
                        <AvatarImage src={req.borrowerAvatar} />
                        <AvatarFallback className="bg-[#D4A373] text-white font-serif">{req.borrowerName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-bold text-[#2C2C2C]">
                          {req.borrowerName} <span className="font-normal text-[#8C867E]">wants to borrow</span>
                        </p>
                        <p className="font-serif text-sm font-semibold text-[#4B5320]">{req.bookTitle}</p>
                        <p className="text-[10px] text-[#8C867E]">
                          {req.startDate} to {req.dueDate} ({req.durationDays} days)
                        </p>
                        {req.note && <p className="text-xs italic text-neutral-600 mt-1 bg-[#F9F7F4] p-1.5 rounded">"{req.note}"</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" onClick={() => handleDeclineLoan(req)} variant="outline" className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 text-xs">
                        <X className="w-3.5 h-3.5 mr-1" /> Decline
                      </Button>
                      <Button size="sm" onClick={() => handleApproveLoan(req)} className="rounded-xl bg-[#4B5320] text-white hover:bg-[#3D441A] text-xs">
                        <Check className="w-3.5 h-3.5 mr-1" /> Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Section: Books I Have Borrowed */}
          <Card className="bg-white rounded-3xl border border-[#E5E0D8] p-6 shadow-sm">
            <h3 className="font-serif text-xl font-semibold text-[#2C2C2C] mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#4B5320]" />
                My Borrowed Books
              </span>
              <span className="text-xs text-[#8C867E] font-normal font-sans">
                {activeBorrows.length} Active
              </span>
            </h3>

            {activeBorrows.length === 0 ? (
              <div className="py-12 text-center text-[#8C867E] space-y-2">
                <p className="font-serif text-base">No books currently borrowed.</p>
                <p className="text-xs">Explore the Global Catalog to borrow books from your circle!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeBorrows.map(loan => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isOverdue = todayStr > loan.dueDate && loan.status !== 'RETURNED';
                  const isReturned = loan.status === 'RETURNED';

                  return (
                    <div key={loan.id} className="p-4 bg-[#F9F7F4] border border-[#E5E0D8] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {loan.bookCoverUrl ? (
                          <img src={loan.bookCoverUrl} alt={loan.bookTitle} className="w-12 h-16 object-cover rounded shadow-sm" />
                        ) : (
                          <div className="w-12 h-16 bg-[#E8E4E0] rounded flex items-center justify-center text-[9px] text-center p-1">
                            No Cover
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-serif text-base font-semibold text-[#2C2C2C]">{loan.bookTitle}</h4>
                            {isReturned ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px]">Returned</Badge>
                            ) : loan.status === 'PENDING' ? (
                              <Badge className="bg-amber-100 text-amber-800 border-none text-[10px]">Pending Approval</Badge>
                            ) : isOverdue ? (
                              <Badge className="bg-red-100 text-red-800 border-none text-[10px]">Overdue</Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800 border-none text-[10px]">Active Loan</Badge>
                            )}
                          </div>
                          <p className="text-xs text-[#8C867E] italic">{loan.bookAuthor}</p>
                          <div className="mt-1 text-xs text-[#2C2C2C]">
                            Lent by: <strong>{loan.ownerName}</strong> | Due: <strong>{loan.dueDate}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Return Action */}
                      {!isReturned && loan.status === 'APPROVED' && (
                        <Button
                          onClick={() => {
                            setSelectedLoanForReturn(loan);
                            setReturnResult(null);
                            setReturnDialogOpen(true);
                          }}
                          className="bg-[#4B5320] text-white hover:bg-[#3D441A] rounded-xl text-xs px-4 py-2 shadow-sm"
                        >
                          Return Book
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Section: Books I'm Lending Out */}
          <Card className="bg-white rounded-3xl border border-[#E5E0D8] p-6 shadow-sm">
            <h3 className="font-serif text-xl font-semibold text-[#2C2C2C] mb-4">
              Books I'm Lending Out ({activeLends.length})
            </h3>
            {activeLends.length === 0 ? (
              <p className="text-xs text-[#8C867E] italic">You aren't currently lending any books to others.</p>
            ) : (
              <div className="space-y-3">
                {activeLends.map(loan => (
                  <div key={loan.id} className="p-3 bg-[#F9F7F4] border border-[#E5E0D8] rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="font-serif font-semibold text-sm text-[#2C2C2C]">{loan.bookTitle}</p>
                      <p className="text-xs text-[#8C867E]">
                        Borrowed by <strong>{loan.borrowerName}</strong> until <strong>{loan.dueDate}</strong>
                      </p>
                    </div>
                    <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">Active Loan</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Declined requests. Shown only when there are any, so the borrower
              learns the outcome instead of the request silently disappearing. */}
          {declinedForMe.length > 0 && (
            <Card className="bg-white rounded-3xl border border-[#E5E0D8] p-6 shadow-sm">
              <h3 className="font-serif text-xl font-semibold text-[#2C2C2C] mb-4">
                Declined Requests ({declinedForMe.length})
              </h3>
              <div className="space-y-3">
                {declinedForMe.map(loan => (
                  <div
                    key={loan.id}
                    className="p-3 bg-[#F9F7F4] border border-[#E5E0D8] rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-serif font-semibold text-sm text-[#2C2C2C] truncate">
                        {loan.bookTitle}
                      </p>
                      <p className="text-xs text-[#8C867E]">
                        {loan.ownerName ? <>Declined by <strong>{loan.ownerName}</strong></> : 'Request declined'}
                      </p>
                    </div>
                    <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] shrink-0">
                      Declined
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

        </div>
      </div>

      {/* Return Confirmation Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 font-sans border-[#E5E0D8]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-[#2C2C2C] text-center">
              Confirm Return
            </DialogTitle>
          </DialogHeader>

          {returnResult ? (
            <div className="py-6 text-center space-y-4">
              {returnResult.onTime ? (
                <>
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-[#2D5A27]">
                    <Sparkles className="w-8 h-8 animate-spin" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-[#2D5A27]">Returned On Time!</h3>
                  <p className="text-sm text-[#2C2C2C]">
                    You earned <strong className="text-emerald-600">+10 Honesty Points</strong> for returning <em>{selectedLoanForReturn?.bookTitle}</em> on schedule!
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-700">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-amber-800">Late Return Recorded</h3>
                  <p className="text-sm text-[#2C2C2C]">
                    This book was returned past its due date ({selectedLoanForReturn?.dueDate}). <span className="text-amber-700 font-bold">-5 Honesty Points</span> applied.
                  </p>
                </>
              )}
              <Button onClick={() => setReturnDialogOpen(false)} className="bg-[#4B5320] text-white rounded-xl text-xs px-6 py-2">
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-4 text-center py-2">
              <p className="text-sm text-[#2C2C2C]">
                Are you sure you want to mark <strong>{selectedLoanForReturn?.bookTitle}</strong> as returned to <strong>{selectedLoanForReturn?.ownerName}</strong>?
              </p>
              
              <div className="p-3 bg-[#F0F7F0] border border-[#2D5A27]/20 rounded-2xl text-left text-xs text-[#2D5A27] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>On-time returns award <strong>+10 Honesty Points</strong> directly to your profile.</span>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setReturnDialogOpen(false)} className="w-1/2 rounded-xl text-xs">
                  Cancel
                </Button>
                <Button 
                  onClick={handleConfirmReturn} 
                  disabled={returning} 
                  className="w-1/2 bg-[#4B5320] text-white hover:bg-[#3D441A] rounded-xl text-xs font-medium py-2 shadow-md shadow-[#4B5320]/10"
                >
                  {returning ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Return'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
