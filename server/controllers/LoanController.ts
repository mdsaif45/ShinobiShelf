import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { LoanService } from '../services/LoanService';

export class LoanController {
  constructor(private loanService: LoanService) {}

  getAllLoans = async (req: AuthRequest, res: Response, next: any) => {
    try {
      const loans = await this.loanService.getAllLoans();
      res.json(loans);
    } catch (err) {
      next(err);
    }
  };

  createBorrowRequest = async (req: AuthRequest, res: Response, next: any) => {
    try {
      if (!req.dbUser && !req.user) return res.status(401).json({ error: 'Unauthorized' });
      const borrowerId = req.dbUser?.id || req.user?.uid;
      const borrowerName = req.dbUser?.displayName || req.user?.displayName || 'Reader';

      const request = await this.loanService.createBorrowRequest({
        ...req.body,
        borrowerId,
        borrowerName,
      });

      res.status(201).json(request);
    } catch (err) {
      next(err);
    }
  };

  verifyHandshake = async (req: AuthRequest, res: Response, next: any) => {
    try {
      const { loanId, passcode } = req.body;
      const updatedLoan = await this.loanService.verifyHandshakeAndTransfer(loanId, passcode);
      res.json(updatedLoan);
    } catch (err) {
      next(err);
    }
  };
}
