import { ILoanRepository } from '../repositories/interfaces/ILoanRepository';
import { IBookRepository } from '../repositories/interfaces/IBookRepository';
import { IUserRepository } from '../repositories/interfaces/IUserRepository';
import { BorrowRequest } from '@/types';

export class LoanService {
  constructor(
    private loanRepo: ILoanRepository,
    private bookRepo: IBookRepository,
    private userRepo: IUserRepository
  ) {}

  async getAllLoans(): Promise<BorrowRequest[]> {
    return await this.loanRepo.findAll();
  }

  async createBorrowRequest(data: {
    bookId: string;
    bookTitle: string;
    borrowerId: string;
    borrowerName: string;
    ownerId: string;
    ownerName?: string;
    requestedDurationDays?: number;
  }): Promise<BorrowRequest> {
    const book = await this.bookRepo.findById(data.bookId);
    if (!book) {
      throw Object.assign(new Error('That book no longer exists.'), { status: 404 });
    }

    // Nobody may borrow their own book. The UI blocks this, but a direct API
    // call would otherwise sail through.
    if (book.ownerId === data.borrowerId) {
      throw Object.assign(new Error('You cannot borrow your own book.'), { status: 400 });
    }

    const existing = await this.loanRepo.findAll();

    // One open request per borrower per book. Without this, submitting twice
    // created two simultaneous PENDING requests for the same book.
    const duplicate = existing.find(
      (l) =>
        l.bookId === data.bookId &&
        l.borrowerId === data.borrowerId &&
        (l.status === 'PENDING' || l.status === 'APPROVED' || l.status === 'HANDED_OVER')
    );
    if (duplicate) {
      throw Object.assign(
        new Error('You already have an open request for this book.'),
        { status: 409 }
      );
    }

    // A book that is already promised to someone else cannot be requested.
    // Previously a third party could queue a request on an active loan.
    const alreadyCommitted = existing.find(
      (l) =>
        l.bookId === data.bookId &&
        (l.status === 'APPROVED' || l.status === 'HANDED_OVER')
    );
    if (alreadyCommitted || book.status === 'BORROWED') {
      throw Object.assign(
        new Error('That book is currently on loan. Please try again later.'),
        { status: 409 }
      );
    }

    const handshakeCode = Math.floor(1000 + Math.random() * 9000).toString();

    return await this.loanRepo.create({
      ...data,
      status: 'PENDING',
      handshakeCode,
    });
  }

  /**
   * Transition a loan's status, enforcing who is allowed to make each move.
   *
   * The rules live here rather than in the UI: hiding a button does not stop a
   * direct API call, so the borrower/owner distinction has to be checked
   * server-side.
   *
   *   APPROVED / REJECTED  owner only  (a borrower approving their own request
   *                                     would be self-dealing)
   *   HANDED_OVER          owner only  (the owner physically hands the book over)
   *   RETURNED             either party to the loan
   *
   * Honesty points are awarded here too, never by the client: a client-callable
   * award endpoint would let anyone inflate their own score.
   */
  async updateStatus(
    loanId: string,
    status: BorrowRequest['status'],
    updates: Partial<BorrowRequest>,
    callerId: string
  ): Promise<BorrowRequest> {
    const loan = await this.loanRepo.findById(loanId);
    if (!loan) {
      throw Object.assign(new Error('Loan request not found'), { status: 404 });
    }

    const isOwner = loan.ownerId === callerId;
    const isBorrower = loan.borrowerId === callerId;

    if (!isOwner && !isBorrower) {
      throw Object.assign(new Error('You are not a party to this loan'), { status: 403 });
    }

    const ownerOnly: Array<BorrowRequest['status']> = ['APPROVED', 'REJECTED', 'HANDED_OVER'];
    if (ownerOnly.includes(status) && !isOwner) {
      throw Object.assign(
        new Error('Only the book owner can perform this action'),
        { status: 403 }
      );
    }

    if (loan.status === status) {
      return loan;
    }

    const extraUpdates: Partial<BorrowRequest> = { ...updates };

    // Approval is the moment the loan period is fixed. These were never set,
    // which left the UI rendering a blank "Due:" and a broken "to ( days)".
    if (status === 'APPROVED') {
      const days = loan.requestedDurationDays || 14;
      const start = new Date();
      const due = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
      if (!loan.startDate) extraUpdates.startDate = start.toISOString();
      if (!loan.dueDate) extraUpdates.dueDate = due.toISOString();
    }

    // No returned-at handling here: the repository already stamps
    // returned_at = CURRENT_TIMESTAMP on a RETURNED transition.

    const updated = await this.loanRepo.updateStatus(loanId, status, extraUpdates);
    if (!updated) {
      throw Object.assign(new Error('Loan request not found'), { status: 404 });
    }

    // Keep the book's availability in step with the loan.
    //
    // APPROVED is included deliberately: the book is committed to a borrower
    // from that point, not only once physically handed over. Marking it only on
    // HANDED_OVER left every approved book showing as "Available" with a live
    // Borrow button, which let a third party queue a request on a book that was
    // already lent out.
    if (loan.bookId) {
      if (status === 'APPROVED' || status === 'HANDED_OVER') {
        await this.bookRepo.update(loan.bookId, {
          status: 'BORROWED',
          currentReader: { uid: loan.borrowerId },
        });
      } else if (status === 'RETURNED' || status === 'REJECTED') {
        await this.bookRepo.update(loan.bookId, {
          status: 'AVAILABLE',
          currentReader: null,
          progress: 0,
        });
      }
    }

    // Lifetime counters, which were declared in the schema but never written.
    if (status === 'HANDED_OVER') {
      if (loan.borrowerId) await this.userRepo.incrementBorrowedCount(loan.borrowerId);
      if (loan.ownerId) await this.userRepo.incrementLentCount(loan.ownerId);
    }

    // A return that happens on or before the due date earns the borrower
    // points; a late one costs them.
    if (status === 'RETURNED' && loan.borrowerId) {
      const due = loan.dueDate ? new Date(loan.dueDate).getTime() : NaN;
      const onTime = Number.isNaN(due) ? true : Date.now() <= due;
      await this.userRepo.updateHonestyScore(loan.borrowerId, onTime ? 10 : -5);
    }

    return updated;
  }

  async verifyHandshakeAndTransfer(loanId: string, inputPasscode: string): Promise<BorrowRequest> {
    const loan = await this.loanRepo.findById(loanId);
    if (!loan) throw new Error('Loan request not found');

    if (loan.handshakeCode !== inputPasscode.trim()) {
      throw new Error('Invalid 4-digit verification code');
    }

    if (loan.status === 'APPROVED') {
      // Transition to HANDED_OVER
      const updatedLoan = await this.loanRepo.updateStatus(loanId, 'HANDED_OVER', {
        handedOverAt: new Date().toISOString(),
      });

      if (loan.bookId) {
        await this.bookRepo.update(loan.bookId, {
          status: 'BORROWED',
          currentReader: {
            uid: loan.borrowerId,
            name: loan.borrowerName,
          },
        });
      }

      return updatedLoan!;
    } else if (loan.status === 'HANDED_OVER') {
      // Transition to RETURNED
      const updatedLoan = await this.loanRepo.updateStatus(loanId, 'RETURNED', {
        returnedAt: new Date().toISOString(),
      });

      if (loan.bookId) {
        await this.bookRepo.update(loan.bookId, {
          status: 'AVAILABLE',
          currentReader: null,
          progress: 0,
        });
      }

      // Award +10 Honesty Points
      await this.userRepo.updateHonestyScore(loan.borrowerId, 10);

      return updatedLoan!;
    }

    throw new Error(`Cannot verify transfer for loan in status: ${loan.status}`);
  }
}
