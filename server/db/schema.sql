-- ShinobiShelf SQL Database Schema
-- Compatible with SQLite & PostgreSQL (ANSI SQL standard)

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    photo_url TEXT,
    password_hash TEXT,
    salt TEXT,
    auth_provider TEXT DEFAULT 'email',
    google_id TEXT,
    google_access_token TEXT,
    honesty_score INTEGER DEFAULT 100,
    books_lent_count INTEGER DEFAULT 0,
    books_borrowed_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Books Catalog Table
CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    cover_url TEXT,
    description TEXT,
    genre TEXT,
    isbn TEXT,
    owner_id TEXT NOT NULL,
    status TEXT CHECK (status IN ('AVAILABLE', 'BORROWED', 'RESERVED')) DEFAULT 'AVAILABLE',
    progress INTEGER DEFAULT 0,
    current_reader_id TEXT,
    circle_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (current_reader_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Borrow Requests & Loans Calendar Table
CREATE TABLE IF NOT EXISTS borrow_requests (
    id TEXT PRIMARY KEY,
    book_id TEXT NOT NULL,
    borrower_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    status TEXT CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'HANDED_OVER', 'RETURNED')) DEFAULT 'PENDING',
    requested_duration_days INTEGER DEFAULT 14,
    start_date TEXT,
    due_date TEXT,
    handshake_code TEXT,
    handed_over_at TIMESTAMP,
    returned_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (borrower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Wishlist Board Table
CREATE TABLE IF NOT EXISTS wishlist_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT,
    notes TEXT,
    category TEXT,
    requester_id TEXT NOT NULL,
    fulfilled INTEGER DEFAULT 0,
    fulfilled_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (fulfilled_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. Book Clubs Table
CREATE TABLE IF NOT EXISTS book_clubs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    current_book TEXT,
    meetup_date TEXT,
    creator_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Club Memberships (Many-to-Many Join Table)
CREATE TABLE IF NOT EXISTS club_memberships (
    club_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (club_id, user_id),
    FOREIGN KEY (club_id) REFERENCES book_clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Club Discussion Posts
CREATE TABLE IF NOT EXISTS club_posts (
    id TEXT PRIMARY KEY,
    club_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    content TEXT NOT NULL,
    book_title TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES book_clubs(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. Club Post Likes
CREATE TABLE IF NOT EXISTS post_likes (
    post_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES club_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. Club Post Comments
CREATE TABLE IF NOT EXISTS post_comments (
    id TEXT PRIMARY KEY,
    post_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES club_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 10. Physical Pickup Spots
CREATE TABLE IF NOT EXISTS pickup_spots (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    instructions TEXT,
    category TEXT DEFAULT 'Public Spot',
    added_by TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE
);

-- 11. Physical Swap Events
CREATE TABLE IF NOT EXISTS swap_events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    organizer_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 12. Swap Event Attendees (Many-to-Many Join Table)
CREATE TABLE IF NOT EXISTS event_attendees (
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    rsvp_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES swap_events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 13. Wishlist Upvotes ("Me Too") — Many-to-Many Join Table
-- WishlistItem carries an `upvotes` array but had no table behind it.
CREATE TABLE IF NOT EXISTS wishlist_upvotes (
    item_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (item_id, user_id),
    FOREIGN KEY (item_id) REFERENCES wishlist_items(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 14. Wishlist Lending Offers ("I Can Lend This")
CREATE TABLE IF NOT EXISTS wishlist_offers (
    id TEXT PRIMARY KEY,
    item_id TEXT NOT NULL,
    offerer_id TEXT NOT NULL,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (item_id, offerer_id),
    FOREIGN KEY (item_id) REFERENCES wishlist_items(id) ON DELETE CASCADE,
    FOREIGN KEY (offerer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_books_owner ON books(owner_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_upvotes_item ON wishlist_upvotes(item_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_offers_item ON wishlist_offers(item_id);
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_book ON borrow_requests(book_id);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_borrower ON borrow_requests(borrower_id);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_owner ON borrow_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_requester ON wishlist_items(requester_id);
CREATE INDEX IF NOT EXISTS idx_club_posts_club ON club_posts(club_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_user ON club_memberships(user_id);
