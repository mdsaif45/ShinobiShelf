export interface BookOwner {
  id?: string;
  uid?: string;
  name?: string;
  email?: string;
  avatar?: string;
}

export interface CurrentReader {
  uid?: string;
  name?: string;
  dueDate?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  description?: string;
  genre?: string;
  isbn?: string;
  ownerId?: string;
  owner?: BookOwner;
  status?: 'AVAILABLE' | 'BORROWED' | 'RESERVED';
  progress?: number;
  currentReader?: CurrentReader | null;
  pendingBorrower?: any;
  circleId?: string;
  createdAt?: any;
}

export interface BorrowRequest {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor?: string;
  bookCoverUrl?: string;
  bookIsbn?: string;
  book?: any;
  borrowerId: string;
  borrowerName: string;
  borrowerEmail?: string;
  borrowerAvatar?: string;
  ownerId: string;
  ownerName?: string;
  ownerAvatar?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HANDED_OVER' | 'RETURNED';
  requestedDurationDays?: number;
  durationDays?: number;
  startDate?: string;
  dueDate?: string;
  note?: string;
  handshakeCode?: string;
  returnedOnTime?: boolean;
  createdAt?: any;
  handedOverAt?: any;
  returnedAt?: any;
}

export interface WishlistItem {
  id: string;
  title: string;
  author?: string;
  notes?: string;
  category?: string;
  requesterId: string;
  requesterName: string;
  upvotes?: string[];
  offers?: any[];
  fulfilled?: boolean;
  fulfilledBy?: string;
  createdAt?: any;
}

export interface BookClub {
  id: string;
  name: string;
  description: string;
  currentBook: string;
  meetupDate?: string;
  members: string[];
  creatorId: string;
  creatorName: string;
  createdAt?: any;
}

export interface PostComment {
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
}

export interface ClubPost {
  id: string;
  content: string;
  bookTitle?: string;
  clubId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  likes: string[];
  comments: PostComment[];
  createdAt?: any;
}

export interface PickupSpot {
  id: string;
  name: string;
  address: string;
  instructions?: string;
  category: string;
  addedBy: string;
  createdAt?: any;
}

export interface SwapEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  description?: string;
  attendees: string[];
  organizer: string;
  createdAt?: any;
}

export interface NotificationPreferences {
  borrowAlerts: boolean;
  clubAlerts: boolean;
  returnReminders: boolean;
  weeklyDigest: boolean;
}

export interface UserProfile {
  id: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  bio?: string;
  favoriteGenres?: string[];
  notificationPreferences?: NotificationPreferences;
  honestyScore?: number;
  booksLentCount?: number;
  booksBorrowedCount?: number;
  createdAt?: any;
}

export interface Ebook {
  id: string;
  title: string;
  author: string;
  description?: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  fileFormat: 'epub' | 'pdf' | 'txt';
  coverUrl?: string;
  ownerId: string;
  progressPercent: number;
  currentLocation?: string;
  createdAt?: string;
  updatedAt?: string;
}

