import { Router } from 'express';
import { BookController } from '../controllers/BookController';
import { BookService } from '../services/BookService';
import { RepositoryFactory } from '../repositories/factory';
import { requireAuth } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { createBookSchema } from '../dtos/schemas';

const router = Router();

// Instantiate Service and Controller via Repository Factory Dependency Injection
const bookRepository = RepositoryFactory.getBookRepository();
const bookService = new BookService(bookRepository);
const bookController = new BookController(bookService);

router.get('/', bookController.getAllBooks);
router.get('/:id', bookController.getBookById);
router.post('/', requireAuth, validateRequest(createBookSchema), bookController.createBook);
router.delete('/:id', requireAuth, bookController.deleteBook);

export default router;
