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

  async deleteBook(id: string): Promise<boolean> {
    return await this.bookRepo.delete(id);
  }
}
