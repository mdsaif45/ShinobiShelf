import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { BookService } from '../services/BookService';

export class BookController {
  constructor(private bookService: BookService) {}

  getAllBooks = async (req: AuthRequest, res: Response, next: any) => {
    try {
      const books = await this.bookService.getAllBooks();
      res.json(books);
    } catch (err) {
      next(err);
    }
  };

  getBookById = async (req: AuthRequest, res: Response, next: any) => {
    try {
      const { id } = req.params;
      const book = await this.bookService.getBookById(id);
      if (!book) return res.status(404).json({ error: 'Book not found' });
      res.json(book);
    } catch (err) {
      next(err);
    }
  };

  createBook = async (req: AuthRequest, res: Response, next: any) => {
    try {
      if (!req.dbUser) return res.status(401).json({ error: 'Unauthorized' });
      const newBook = await this.bookService.createBook(
        req.body,
        req.dbUser.id || req.user?.uid,
        req.dbUser.displayName || req.user?.displayName || 'Member'
      );
      res.status(201).json(newBook);
    } catch (err) {
      next(err);
    }
  };

  deleteBook = async (req: AuthRequest, res: Response, next: any) => {
    try {
      const { id } = req.params;
      await this.bookService.deleteBook(id);
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  };
}
