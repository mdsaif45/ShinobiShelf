import { BorrowRequest } from '@/types';

export interface ILoanRepository {
  findAll(): Promise<BorrowRequest[]>;
  findById(id: string): Promise<BorrowRequest | null>;
  create(data: Partial<BorrowRequest>): Promise<BorrowRequest>;
  updateStatus(id: string, status: BorrowRequest['status'], updates?: Partial<BorrowRequest>): Promise<BorrowRequest | null>;
  findByUser(userId: string): Promise<BorrowRequest[]>;
}
