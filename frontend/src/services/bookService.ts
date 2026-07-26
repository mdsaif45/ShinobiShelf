import { Book } from '../types';

export const subscribeToBooks = (callback: (books: Book[]) => void) => {
  let active = true;
  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/books');
      if (res.ok) {
        const books = await res.json();
        if (active) callback(books);
      }
    } catch (e) {
      console.warn('Error fetching books:', e);
    }
  };

  fetchBooks();
  const interval = setInterval(fetchBooks, 3000);

  return () => {
    active = false;
    clearInterval(interval);
  };
};

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
