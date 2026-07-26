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
