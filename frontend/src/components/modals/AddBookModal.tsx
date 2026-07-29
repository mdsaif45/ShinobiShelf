import React, { useState, useEffect } from 'react';
import { Search, Plus, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { useAuth } from '../../providers/AuthProvider';
import { useToast } from '../../providers/ToastProvider';
import { addBook } from '../../services/bookService';

interface OpenLibraryBook {
  key: string;
  title: string;
  author_name?: string[];
  isbn?: string[];
  cover_i?: number;
  subject?: string[];
}

/**
 * Map Open Library's free-form subjects onto the catalogue's genre options.
 *
 * The catalogue filter compares genres by exact equality, so a value outside
 * this list (previously always the repository default "General") can never be
 * matched by any filter. Order matters: the first hit wins, so the more
 * specific subjects are checked before the broad "fiction" catch-all.
 */
const GENRE_KEYWORDS: Array<[string, string[]]> = [
  ['Philosophy', ['philosophy', 'philosophical', 'ethics', 'metaphysics']],
  ['Biography', ['biography', 'autobiography', 'memoir', 'biographies']],
  ['Non-Fiction', ['history', 'science', 'nonfiction', 'non-fiction', 'politics', 'economics', 'psychology']],
  ['Fiction', ['fiction', 'novel', 'fantasy', 'science fiction', 'mystery', 'fiction in english']],
];

function deriveGenre(subjects?: string[]): string | undefined {
  if (!subjects?.length) return undefined;
  const haystack = subjects.slice(0, 40).join(' | ').toLowerCase();
  for (const [genre, keywords] of GENRE_KEYWORDS) {
    if (keywords.some((k) => haystack.includes(k))) return genre;
  }
  return undefined;
}

export default function AddBookModal({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OpenLibraryBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [searchError, setSearchError] = useState('');
  const { user } = useAuth();
  const { notify, notifyError } = useToast();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        performSearch(query);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      // `fields` keeps the payload small while still returning the subjects
      // used to derive a genre.
      const response = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery)}&limit=10` +
          `&fields=key,title,author_name,isbn,cover_i,subject`
      );
      const data = await response.json();
      setResults(data.docs || []);
    } catch (error) {
      // A failed lookup used to look identical to "no matches found", so the
      // reason is stated instead.
      console.error('Error searching books:', error);
      setResults([]);
      setSearchError('Could not reach the book catalogue. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const searchBooks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      // Previously a silent no-op, which read as a broken button.
      setSearchError('Enter a title, author or ISBN to search.');
      return;
    }
    setSearchError('');
    performSearch(query);
  };

  const handleAddBook = async (book: OpenLibraryBook) => {
    if (!user) {
      console.error("No user logged in");
      return;
    }
    setAdding(book.key);
    try {
      const coverUrl = book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : '';
      
      const genre = deriveGenre(book.subject);

      await addBook({
        title: book.title,
        author: book.author_name ? book.author_name[0] : 'Unknown Author',
        isbn: book.isbn ? book.isbn[0] : '',
        coverUrl,
        ...(genre ? { genre } : {}),
        ownerId: user.id,
        owner: {
          name: user.displayName || user.email?.split('@')[0] || 'Unknown',
          avatar: user.photoURL || ''
        },
        status: 'AVAILABLE'
      });
      onOpenChange(false);
      setQuery('');
      setResults([]);
      notify(`Added ${book.title} to your shelf.`);
    } catch (error: any) {
      console.error('Error adding book:', error);
      // Was a blocking window.alert, which reads as a browser fault rather
      // than an in-app message.
      notifyError(error?.message || 'Could not add that book. Please try again.');
    } finally {
      setAdding(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 font-sans">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[#2C2C2C]">Add a Book</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={searchBooks} className="flex items-center gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Search by title, author, or ISBN..." 
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (searchError) setSearchError('');
              }}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E0D8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4B5320] transition-all shadow-sm"
            />
          </div>
          <Button type="submit" disabled={loading} className="bg-[#4B5320] text-white hover:bg-[#3D441A] rounded-xl">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </Button>
        </form>

        {searchError && (
          <p className="mt-2 text-xs font-medium text-red-500">{searchError}</p>
        )}

        <div className="mt-6 max-h-[60vh] overflow-y-auto space-y-4 pr-2">
          {results.map((book) => (
            <div key={book.key} className="flex gap-4 p-3 rounded-2xl border border-[#E5E0D8] hover:shadow-md transition-shadow bg-white">
              {book.cover_i ? (
                <img 
                  src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`} 
                  alt={book.title} 
                  className="w-16 h-24 object-cover rounded shadow-sm bg-[#E8E4E0]"
                />
              ) : (
                <div className="w-16 h-24 bg-[#E8E4E0] rounded shadow-sm flex items-center justify-center text-xs text-center p-1 text-neutral-500 font-serif">
                  No Cover
                </div>
              )}
              <div className="flex-1 flex flex-col">
                <h4 className="font-serif font-bold text-sm leading-tight line-clamp-2">{book.title}</h4>
                <p className="text-xs text-neutral-500 mt-1">{book.author_name ? book.author_name.join(', ') : 'Unknown Author'}</p>
                {book.isbn && <p className="text-[10px] text-neutral-400 mt-1 truncate">ISBN: {book.isbn[0]}</p>}
                
                <Button 
                  size="sm" 
                  onClick={() => handleAddBook(book)}
                  disabled={adding === book.key}
                  className="mt-auto self-start bg-neutral-100 hover:bg-[#F5F2ED] text-[#2C2C2C] text-xs h-8 rounded-lg"
                >
                  {adding === book.key ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                  Add to Library
                </Button>
              </div>
            </div>
          ))}
          {results.length === 0 && query && !loading && (
            <div className="text-center text-sm text-neutral-500 py-8">
              No books found for "{query}"
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
