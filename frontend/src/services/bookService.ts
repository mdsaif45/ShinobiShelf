import { Book } from '../types';
import { subscribePolled } from './poll';

const fetchBooks = async (): Promise<Book[]> => {
  const res = await fetch('/api/books');
  if (!res.ok) throw new Error(`GET /api/books failed: ${res.status}`);
  return res.json();
};

export const subscribeToBooks = (callback: (books: Book[]) => void) =>
  subscribePolled('books', fetchBooks, callback);

export const addBook = async (bookData: Partial<Book>) => {
  const token = localStorage.getItem('authToken');
  const res = await fetch('/api/books', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(bookData),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || err.message || 'Failed to add book');
  }
  return await res.json();
};

export const updateBook = async (bookId: string, updates: Partial<Book>) => {
  const token = localStorage.getItem('authToken');
  const res = await fetch(`/api/books/${bookId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(updates),
  });
  return await res.json();
};

export const deleteBook = async (bookId: string) => {
  const token = localStorage.getItem('authToken');
  const res = await fetch(`/api/books/${bookId}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return await res.json();
};
