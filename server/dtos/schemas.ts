import { z } from 'zod';

export const createBookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  coverUrl: z.string().optional(),
  description: z.string().optional(),
  genre: z.string().optional(),
  isbn: z.string().optional(),
});

export const createBorrowRequestSchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
  bookTitle: z.string().min(1, 'Book Title is required'),
  ownerId: z.string().min(1, 'Owner ID is required'),
  ownerName: z.string().optional(),
  requestedDurationDays: z.number().positive().optional(),
});

export const verifyHandshakeSchema = z.object({
  loanId: z.string().min(1, 'Loan ID is required'),
  passcode: z.string().length(4, 'Passcode must be 4 digits'),
});
