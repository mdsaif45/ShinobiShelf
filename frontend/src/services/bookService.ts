import { Book } from '../types';
import { subscribePolled, refreshPolled } from './poll';
import { getJson, sendJson } from './http';

const fetchBooks = (): Promise<Book[]> => getJson<Book[]>('/api/books');

export const subscribeToBooks = (callback: (books: Book[]) => void) =>
  subscribePolled('books', fetchBooks, callback);

// Each mutation refreshes the shared books poll so the change is visible
// straight away rather than on the next interval or a manual reload.

export const addBook = async (bookData: Partial<Book>) => {
  const created = await sendJson<Book>('/api/books', 'POST', bookData);
  refreshPolled('books');
  return created;
};

export const updateBook = async (bookId: string, updates: Partial<Book>) => {
  const updated = await sendJson<Book>(`/api/books/${bookId}`, 'PATCH', updates);
  refreshPolled('books');
  return updated;
};

export const deleteBook = async (bookId: string) => {
  const result = await sendJson(`/api/books/${bookId}`, 'DELETE');
  refreshPolled('books');
  return result;
};
