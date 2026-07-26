import { Book } from '@/types';

export interface IBookRepository {
  findAll(): Promise<Book[]>;
  findById(id: string): Promise<Book | null>;
  create(book: Partial<Book>): Promise<Book>;
  update(id: string, updates: Partial<Book>): Promise<Book | null>;
  delete(id: string): Promise<boolean>;
}
