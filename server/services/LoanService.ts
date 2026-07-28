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

    const updated = await this.loanRepo.updateStatus(loanId, status, updates);
    if (!updated) {
      throw Object.assign(new Error('Loan request not found'), { status: 404 });
    }

    // Keep the book's availability in step with the loan.
    if (loan.bookId) {
      if (status === 'HANDED_OVER') {
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
