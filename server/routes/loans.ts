import { Router } from 'express';
import { LoanController } from '../controllers/LoanController';
import { LoanService } from '../services/LoanService';
import { RepositoryFactory } from '../repositories/factory';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createBorrowRequestSchema, verifyHandshakeSchema } from '../dtos/schemas';

const router = Router();

// Instantiate Services and Controllers via Repository Factory
const loanRepository = RepositoryFactory.getLoanRepository();
const bookRepository = RepositoryFactory.getBookRepository();
const userRepository = RepositoryFactory.getUserRepository();

const loanService = new LoanService(loanRepository, bookRepository, userRepository);
const loanController = new LoanController(loanService);

router.get('/', loanController.getAllLoans);

// Creating a borrow request. POST / is the canonical path the client uses;
// /request is kept as an alias so any existing caller keeps working.
router.post('/', requireAuth, validateRequest(createBorrowRequestSchema), loanController.createBorrowRequest);
router.post('/request', requireAuth, validateRequest(createBorrowRequestSchema), loanController.createBorrowRequest);

// Status transitions (approve, reject, hand over, return). Authorisation for
// each transition is enforced in LoanService.updateStatus.
router.patch('/:id/status', requireAuth, loanController.updateStatus);

router.post('/verify', requireAuth, validateRequest(verifyHandshakeSchema), loanController.verifyHandshake);

export default router;
