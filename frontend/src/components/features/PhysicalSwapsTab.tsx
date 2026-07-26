import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  KeyRound, 
  MapPin, 
  CheckCircle2, 
  Calendar, 
  Plus, 
  ShieldCheck, 
  Sparkles, 
  Coffee, 
  Home, 
  Users, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '../../providers/AuthProvider';
import { PickupSpot, SwapEvent, BorrowRequest } from '../../types';
import { 
  subscribeToPickupSpots, 
  subscribeToSwapEvents, 
  addPickupSpot, 
  createSwapEvent, 
  toggleEventRSVP 
} from '../../services/swapService';
import { subscribeToBorrowRequests, updateBorrowRequestStatus, awardHonestyPoints } from '../../services/loanService';
import { updateBook } from '../../services/bookService';
import { CustomSelect } from '@/components/ui/CustomSelect';

const SPOT_CATEGORY_OPTIONS = [
  { value: 'Cafe', label: 'Cafe / Bakery' },
  { value: 'Library Box', label: 'Little Free Library Box' },
  { value: 'Porch Pickup', label: 'Porch / Front Door Box' },
  { value: 'Park Bench', label: 'Park Bench / Gazebo' },
];

export default function PhysicalSwapsTab() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<any[]>([]);
  const [pickupSpots, setPickupSpots] = useState<PickupSpot[]>([]);
  const [swapEvents, setSwapEvents] = useState<SwapEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Verification Code State
  const [selectedLoan, setSelectedLoan] = useState<any | null>(null);
  const [inputPasscode, setInputPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [passcodeSuccess, setPasscodeSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // New Spot Modal State
  const [isSpotModalOpen, setIsSpotModalOpen] = useState(false);
  const [spotName, setSpotName] = useState('');
  const [spotAddress, setSpotAddress] = useState('');
  const [spotInstructions, setSpotInstructions] = useState('');
  const [spotCategory, setSpotCategory] = useState('Cafe');
  const [savingSpot, setSavingSpot] = useState(false);

  // New Event Modal State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [savingEvent, setSavingEvent] = useState(false);

  useEffect(() => {
    if (!user) return;

    const unsubscribeLoans = subscribeToBorrowRequests((allLoans: BorrowRequest[]) => {
      const myLoans = allLoans.filter(
        (l: any) => (l.borrowerId === user.id || l.ownerId === user.id) && 
             (l.status === 'APPROVED' || l.status === 'HANDED_OVER' || l.status === 'RETURNED')
      );
      setLoans(myLoans);
    });

    const unsubscribeSpots = subscribeToPickupSpots((data) => setPickupSpots(data));
    const unsubscribeEvents = subscribeToSwapEvents((data) => {
      setSwapEvents(data);
      setLoading(false);
    });

    return () => {
      unsubscribeLoans();
      unsubscribeSpots();
      unsubscribeEvents();
    };
  }, [user]);

  // Generate 4-digit code if missing
  const getHandshakeCode = (loan: any) => {
    if (loan.handshakeCode) return loan.handshakeCode;
    // Simple deterministic 4-digit code from ID
    const code = (Math.abs(loan.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)) % 9000 + 1000).toString();
    return code;
  };

  const handleVerifyPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan || !user) return;

    const expectedCode = getHandshakeCode(selectedLoan);
    if (inputPasscode.trim() !== expectedCode) {
      setPasscodeError('Invalid 4-digit passcode. Please verify with member.');
      return;
    }

    setVerifying(true);
    setPasscodeError(null);

    try {
      if (selectedLoan.status === 'APPROVED') {
        // Mark as HANDED_OVER
        await updateBorrowRequestStatus(selectedLoan.id, 'HANDED_OVER', {
          handedOverAt: new Date().toISOString()
        });

        // Update book status to BORROWED
        if (selectedLoan.bookId) {
          await updateBook(selectedLoan.bookId, {
            status: 'BORROWED',
            currentReader: {
              uid: selectedLoan.borrowerId,
              name: selectedLoan.borrowerName
            }
          });
        }
      } else if (selectedLoan.status === 'HANDED_OVER') {
        // Mark as RETURNED
        await updateBorrowRequestStatus(selectedLoan.id, 'RETURNED', {
          returnedAt: new Date().toISOString()
        });

        // Update book status to AVAILABLE
        if (selectedLoan.bookId) {
          await updateBook(selectedLoan.bookId, {
            status: 'AVAILABLE',
            currentReader: undefined,
            pendingBorrower: undefined,
            progress: 100
          });
        }

        // Award +10 Honesty Points to borrower
        if (selectedLoan.borrowerId) {
          await awardHonestyPoints(selectedLoan.borrowerId, 10);
        }
      }

      setPasscodeSuccess(true);
      setTimeout(() => {
        setPasscodeSuccess(false);
        setSelectedLoan(null);
        setInputPasscode('');
      }, 1800);
    } catch (err: any) {
      console.error('Error verifying passcode:', err);
      setPasscodeError('Failed to verify transfer.');
    } finally {
      setVerifying(false);
    }
  };

  const handleCreateSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !spotName.trim() || !spotAddress.trim()) return;

    setSavingSpot(true);
    try {
      await addPickupSpot({
        name: spotName.trim(),
        address: spotAddress.trim(),
        instructions: spotInstructions.trim(),
        category: spotCategory,
        addedBy: user.displayName || user.email?.split('@')[0] || 'Member',
      });

      setSpotName('');
      setSpotAddress('');
      setSpotInstructions('');
      setIsSpotModalOpen(false);
    } catch (err) {
      console.error('Error saving spot:', err);
    } finally {
      setSavingSpot(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !eventTitle.trim()) return;

    setSavingEvent(true);
    try {
      await createSwapEvent({
        title: eventTitle.trim(),
        date: eventDate || 'This Weekend',
        location: eventLocation || 'Community Square',
        description: eventDesc.trim(),
        attendees: [user.uid],
        organizer: user.displayName || user.email?.split('@')[0] || 'Member',
      });

      setEventTitle('');
      setEventDate('');
      setEventLocation('');
      setEventDesc('');
      setIsEventModalOpen(false);
    } catch (err) {
      console.error('Error creating event:', err);
    } finally {
      setSavingEvent(false);
    }
  };

  const handleRSVP = async (eventItem: SwapEvent) => {
    if (!user) return;
    const hasAttended = eventItem.attendees?.includes(user.uid);

    try {
      await toggleEventRSVP(eventItem.id, user.uid, !!hasAttended);
    } catch (err) {
      console.error('Error updating RSVP:', err);
    }
  };

  return (
    <div className="space-y-8 font-sans text-[#2C2C2C]">
      
      {/* Header Banner */}
      <div className="bg-[#F9F7F4] border border-[#E5E0D8] p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#4B5320]/10 text-[#4B5320] rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            <QrCode className="w-3.5 h-3.5 text-[#4B5320]" /> Physical Pickups, Handshakes & Swaps
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#2C2C2C]">
            In-Person Handshake & Dropoff Verification
          </h2>
          <p className="text-xs text-[#8C867E] mt-1 max-w-xl">
            Confirm book handoffs securely using 4-digit transfer PINs, explore local dropoff spots, and join neighborhood book swap gatherings.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <Button 
            onClick={() => setIsSpotModalOpen(true)}
            variant="outline"
            className="rounded-2xl border-[#E5E0D8] text-[#4B5320] hover:bg-[#F9F7F4] text-xs px-4 py-5"
          >
            <MapPin className="w-4 h-4 mr-1.5" /> Add Pickup Spot
          </Button>

          <Button 
            onClick={() => setIsEventModalOpen(true)}
            className="bg-[#4B5320] text-white hover:bg-[#3D441A] rounded-2xl px-5 py-5 text-xs font-medium shadow-md shadow-[#4B5320]/10 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Plan Swap Event
          </Button>
        </div>
      </div>

      {/* Handshake Passcode Verifier Section */}
      <div className="space-y-4">
        <h3 className="font-serif text-xl font-bold text-[#2C2C2C] flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-[#4B5320]" />
          Active Handshake Verification Codes ({loans.length})
        </h3>

        {loans.length === 0 ? (
          <Card className="bg-white rounded-3xl border border-[#E5E0D8] p-8 text-center space-y-2">
            <ShieldCheck className="w-10 h-10 text-[#8C867E] mx-auto opacity-40" />
            <h4 className="font-serif text-base font-bold text-[#2C2C2C]">No Active Transfers Requiring Verification</h4>
            <p className="text-xs text-[#8C867E] max-w-md mx-auto">
              When you borrow or lend a book, a 4-digit passcode will appear here for you and your neighbor to confirm physical pickup or return.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loans.map((loan) => {
              const code = getHandshakeCode(loan);
              const isOwner = loan.ownerId === user?.uid;

              return (
                <Card key={loan.id} className="bg-white rounded-3xl border border-[#E5E0D8] p-5 shadow-sm space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="border-[#E5E0D8] bg-[#F9F7F4] text-[#4B5320] text-[10px]">
                      {isOwner ? 'Your Book (Lender)' : 'Borrowing (Reader)'}
                    </Badge>

                    {loan.status === 'APPROVED' ? (
                      <Badge className="bg-amber-100 text-amber-800 border-none text-[10px]">
                        Pending Pickup
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-800 border-none text-[10px]">
                        In Possession (Return Pending)
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h4 className="font-serif font-bold text-base text-[#2C2C2C]">{loan.bookTitle}</h4>
                    <p className="text-xs text-[#8C867E]">
                      {isOwner ? `Borrower: ${loan.borrowerName}` : `Lender: ${loan.ownerName || 'Owner'}`}
                    </p>
                  </div>

                  {/* Passcode Box */}
                  <div className="p-4 bg-[#F9F7F4] rounded-2xl border border-[#E5E0D8] text-center space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8C867E]">
                      {loan.status === 'APPROVED' ? 'Pickup Transfer PIN' : 'Return Verification PIN'}
                    </p>
                    <div className="text-2xl font-mono font-extrabold tracking-widest text-[#4B5320]">
                      {code}
                    </div>
                    <p className="text-[10px] text-[#8C867E]">
                      Share this code with {isOwner ? loan.borrowerName : 'the owner'} when meeting physically.
                    </p>
                  </div>

                  <Button
                    onClick={() => {
                      setSelectedLoan(loan);
                      setInputPasscode('');
                      setPasscodeError(null);
                    }}
                    className="w-full bg-[#4B5320] text-white hover:bg-[#3D441A] rounded-xl text-xs py-2"
                  >
                    Enter Passcode to Confirm Transfer
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid: Community Spots & Swap Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        
        {/* Left Column: Local Pickup Spots */}
        <div className="space-y-4">
          <h3 className="font-serif text-lg font-bold text-[#2C2C2C] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#4B5320]" />
              Neighborhood Pickup Spots ({pickupSpots.length})
            </span>
          </h3>

          <div className="space-y-3">
            {pickupSpots.length === 0 ? (
              // Default Fallback Spots
              [
                { name: 'Little Free Library Box #12', address: 'Cor. Elm St & 4th Ave', category: 'Library Box', instructions: 'Keyless drop-box accessible 24/7. Leave book on middle shelf.' },
                { name: 'Community Cafe - Reader Nook', address: '124 Main Street', category: 'Cafe', instructions: 'Ask barista for Circle shelf behind register.' },
              ].map((spot, i) => (
                <Card key={i} className="bg-white rounded-2xl border border-[#E5E0D8] p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-bold text-sm text-[#2C2C2C]">{spot.name}</h4>
                    <Badge variant="outline" className="text-[10px] border-[#E5E0D8] text-[#4B5320]">{spot.category}</Badge>
                  </div>
                  <p className="text-xs text-[#8C867E] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-[#4B5320]" />
                    {spot.address}
                  </p>
                  <p className="text-[11px] text-[#2C2C2C] bg-[#F9F7F4] p-2.5 rounded-xl border border-[#E5E0D8]/60 italic">
                    "{spot.instructions}"
                  </p>
                </Card>
              ))
            ) : (
              pickupSpots.map((spot) => (
                <Card key={spot.id} className="bg-white rounded-2xl border border-[#E5E0D8] p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif font-bold text-sm text-[#2C2C2C]">{spot.name}</h4>
                    <Badge variant="outline" className="text-[10px] border-[#E5E0D8] text-[#4B5320]">{spot.category}</Badge>
                  </div>
                  <p className="text-xs text-[#8C867E] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-[#4B5320]" />
                    {spot.address}
                  </p>
                  {spot.instructions && (
                    <p className="text-[11px] text-[#2C2C2C] bg-[#F9F7F4] p-2.5 rounded-xl border border-[#E5E0D8]/60 italic">
                      "{spot.instructions}"
                    </p>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Swap Events */}
        <div className="space-y-4">
          <h3 className="font-serif text-lg font-bold text-[#2C2C2C] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#4B5320]" />
            Upcoming Book Swap Events ({swapEvents.length})
          </h3>

          <div className="space-y-3">
            {swapEvents.length === 0 ? (
              // Default Fallback Event
              <Card className="bg-white rounded-2xl border border-[#E5E0D8] p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-[#4B5320] text-white text-[10px]">This Saturday</Badge>
                  <span className="text-[10px] text-[#8C867E]">Organized by Circle</span>
                </div>

                <div>
                  <h4 className="font-serif font-bold text-base text-[#2C2C2C]">Weekend Park Coffee & Book Exchange</h4>
                  <p className="text-xs text-[#8C867E] mt-0.5">Central Park Gazebo • 10:00 AM</p>
                </div>

                <p className="text-xs text-[#2C2C2C] leading-relaxed">
                  Bring 1 to 5 books from your home shelf to swap directly with neighbors! Complimentary hot drip coffee provided.
                </p>

                <Button className="w-full bg-[#4B5320] text-white hover:bg-[#3D441A] rounded-xl text-xs py-2">
                  RSVP I'm Attending (3 Attending)
                </Button>
              </Card>
            ) : (
              swapEvents.map((evt) => {
                const hasRSVP = evt.attendees?.includes(user?.uid);
                const count = evt.attendees?.length || 0;

                return (
                  <Card key={evt.id} className="bg-white rounded-2xl border border-[#E5E0D8] p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-[#4B5320] text-white text-[10px]">{evt.date}</Badge>
                      <span className="text-[10px] text-[#8C867E]">Organized by {evt.organizer}</span>
                    </div>

                    <div>
                      <h4 className="font-serif font-bold text-base text-[#2C2C2C]">{evt.title}</h4>
                      <p className="text-xs text-[#8C867E] mt-0.5">{evt.location}</p>
                    </div>

                    {evt.description && (
                      <p className="text-xs text-[#2C2C2C] leading-relaxed">{evt.description}</p>
                    )}

                    <Button 
                      onClick={() => handleRSVP(evt)}
                      variant={hasRSVP ? "outline" : "default"}
                      className={`w-full rounded-xl text-xs py-2 ${
                        hasRSVP ? 'border-[#4B5320] text-[#4B5320]' : 'bg-[#4B5320] text-white hover:bg-[#3D441A]'
                      }`}
                    >
                      {hasRSVP ? `✓ Attending (${count})` : `RSVP I'm Attending (${count})`}
                    </Button>
                  </Card>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Verify Modal */}
      <Dialog open={!!selectedLoan} onOpenChange={(open) => !open && setSelectedLoan(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 font-sans border-[#E5E0D8]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-[#2C2C2C] flex items-center gap-2">
              <KeyRound className="w-6 h-6 text-[#4B5320]" /> Transfer Verification
            </DialogTitle>
          </DialogHeader>

          {passcodeSuccess ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
              <h3 className="font-serif text-xl font-semibold">Transfer Verified!</h3>
              <p className="text-xs text-[#8C867E]">
                Book status and honesty scores have been updated successfully.
              </p>
            </div>
          ) : (
            <form onSubmit={handleVerifyPasscode} className="space-y-4 mt-2">
              <div className="p-3 bg-[#F9F7F4] rounded-2xl border border-[#E5E0D8]">
                <p className="text-xs text-[#8C867E]">Confirming transfer for:</p>
                <p className="font-serif text-base font-bold text-[#2C2C2C]">{selectedLoan?.bookTitle}</p>
              </div>

              {passcodeError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {passcodeError}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[#8C867E] mb-1 block">
                  Enter 4-Digit Passcode
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={inputPasscode}
                  onChange={(e) => setInputPasscode(e.target.value)}
                  placeholder="e.g. 4821"
                  required
                  className="w-full text-center tracking-widest text-xl font-mono px-3.5 py-3 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4B5320]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <Button type="button" variant="outline" onClick={() => setSelectedLoan(null)} className="w-1/3 rounded-xl border-[#E5E0D8] text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={verifying || inputPasscode.length < 4} className="w-2/3 bg-[#4B5320] text-white hover:bg-[#3D441A] rounded-xl text-xs font-medium py-2.5">
                  {verifying ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Physical Transfer'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* New Spot Modal */}
      <Dialog open={isSpotModalOpen} onOpenChange={setIsSpotModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 font-sans border-[#E5E0D8]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-[#2C2C2C] flex items-center gap-2">
              <MapPin className="w-6 h-6 text-[#4B5320]" /> Add Pickup Location
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSpot} className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#8C867E] mb-1 block">Location Name *</label>
              <input
                type="text"
                value={spotName}
                onChange={(e) => setSpotName(e.target.value)}
                placeholder="e.g. Corner Cafe Book Box, Porch Shelf #3..."
                required
                className="w-full px-3.5 py-2.5 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#4B5320]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#8C867E] mb-1 block">Address / Cross Streets *</label>
              <input
                type="text"
                value={spotAddress}
                onChange={(e) => setSpotAddress(e.target.value)}
                placeholder="e.g. 742 Evergreen Terrace, Springfield"
                required
                className="w-full px-3.5 py-2.5 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#4B5320]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#8C867E] mb-1 block">Category</label>
              <CustomSelect
                options={SPOT_CATEGORY_OPTIONS}
                value={spotCategory}
                onChange={setSpotCategory}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#8C867E] mb-1 block">Dropoff Instructions</label>
              <textarea
                value={spotInstructions}
                onChange={(e) => setSpotInstructions(e.target.value)}
                placeholder="e.g. Leave book on top shelf under the red cover..."
                rows={2}
                className="w-full px-3.5 py-2.5 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#4B5320] resize-none"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsSpotModalOpen(false)} className="w-1/3 rounded-xl border-[#E5E0D8] text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={savingSpot} className="w-2/3 bg-[#4B5320] text-white hover:bg-[#3D441A] rounded-xl text-xs font-medium py-2.5">
                {savingSpot ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Location'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* New Event Modal */}
      <Dialog open={isEventModalOpen} onOpenChange={setIsEventModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 font-sans border-[#E5E0D8]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-[#2C2C2C] flex items-center gap-2">
              <Users className="w-6 h-6 text-[#4B5320]" /> Plan Swap Event
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateEvent} className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#8C867E] mb-1 block">Event Title *</label>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="e.g. Summer Coffee & Fiction Swap"
                required
                className="w-full px-3.5 py-2.5 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#4B5320]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#8C867E] mb-1 block">Date & Time</label>
              <input
                type="text"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                placeholder="e.g. Next Saturday, Aug 2 @ 10:30 AM"
                className="w-full px-3.5 py-2.5 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#4B5320]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#8C867E] mb-1 block">Location</label>
              <input
                type="text"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="e.g. Central Community Park Gazebo"
                className="w-full px-3.5 py-2.5 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#4B5320]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#8C867E] mb-1 block">Event Details</label>
              <textarea
                value={eventDesc}
                onChange={(e) => setEventDesc(e.target.value)}
                placeholder="Bring up to 3 books to swap..."
                rows={2}
                className="w-full px-3.5 py-2.5 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#4B5320] resize-none"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEventModalOpen(false)} className="w-1/3 rounded-xl border-[#E5E0D8] text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={savingEvent} className="w-2/3 bg-[#4B5320] text-white hover:bg-[#3D441A] rounded-xl text-xs font-medium py-2.5">
                {savingEvent ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Publish Event'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
