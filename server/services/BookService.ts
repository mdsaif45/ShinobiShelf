import { IBookRepository } from '../repositories/interfaces/IBookRepository';
import { Book } from '@/types';

export class BookService {
  constructor(private bookRepo: IBookRepository) {}

  async getAllBooks(): Promise<Book[]> {
    return await this.bookRepo.findAll();
  }

  async getBookById(id: string): Promise<Book | null> {
    return await this.bookRepo.findById(id);
  }

  async createBook(bookData: Partial<Book>, ownerId: string, ownerName: string): Promise<Book> {
    if (!bookData.title || !bookData.author) {
      throw new Error('Title and Author are required');
    }

    return await this.bookRepo.create({
      ...bookData,
      ownerId,
      owner: { uid: ownerId, name: ownerName },
      status: 'AVAILABLE',
    });
  }

  async updateBook(id: string, updates: Partial<Book>): Promise<Book | null> {
    return await this.bookRepo.update(id, updates);
  }

  /**
   * Delete a book, which only its owner may do.
   *
   * The check lives here rather than in the UI: hiding a delete control does
   * not stop a direct API call, and previously any authenticated user could
   * delete any other user's book.
   */
  async deleteBook(id: string, callerId: string): Promise<boolean> {
    const book = await this.bookRepo.findById(id);
    if (!book) {
      throw Object.assign(new Error('Book not found'), { status: 404 });
    }
    if (book.ownerId !== callerId) {
      throw Object.assign(new Error('Only the owner can delete this book'), { status: 403 });
    }
    return await this.bookRepo.delete(id);
  }
}
