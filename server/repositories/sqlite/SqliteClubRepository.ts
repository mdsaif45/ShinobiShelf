import { IClubRepository } from '../interfaces/IClubRepository';
import { BookClub, ClubPost } from '../../../frontend/src/types';
import { dbGet, dbQuery, dbRun } from '../../config/sqlite';

export class SqliteClubRepository implements IClubRepository {
  /** Clubs always carry their creator's display name. */
  private static readonly SELECT_CLUB = `
    SELECT c.*, u.display_name AS creator_name
    FROM book_clubs c
    LEFT JOIN users u ON u.id = c.creator_id
  `;

  /** Posts always carry their author's display name and avatar. */
  private static readonly SELECT_POST = `
    SELECT p.*, u.display_name AS author_name, u.photo_url AS author_avatar
    FROM club_posts p
    LEFT JOIN users u ON u.id = p.author_id
  `;

  /* -------------------------------------------------------------- clubs */

  async findAllClubs(): Promise<BookClub[]> {
    const rows = await dbQuery<any>(
      `${SqliteClubRepository.SELECT_CLUB} ORDER BY c.created_at DESC`
    );
    return Promise.all(rows.map((r) => this.hydrateClub(r)));
  }

  async findClubById(id: string): Promise<BookClub | null> {
    const row = await dbGet<any>(`${SqliteClubRepository.SELECT_CLUB} WHERE c.id = ?`, [id]);
    if (!row) return null;
    return this.hydrateClub(row);
  }

  async createClub(data: {
    id: string;
    name: string;
    description?: string;
    currentBook?: string;
    meetupDate?: string;
    creatorId: string;
  }): Promise<BookClub> {
    await dbRun(
      `INSERT INTO book_clubs (id, name, description, current_book, meetup_date, creator_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.name,
        data.description ?? null,
        data.currentBook ?? null,
        data.meetupDate ?? null,
        data.creatorId,
      ]
    );

    // The creator is a member from the outset, so a new club is never empty.
    await dbRun('INSERT OR IGNORE INTO club_memberships (club_id, user_id) VALUES (?, ?)', [
      data.id,
      data.creatorId,
    ]);

    return (await this.findClubById(data.id))!;
  }

  async toggleMembership(clubId: string, userId: string): Promise<BookClub | null> {
    const existing = await dbGet<any>(
      'SELECT 1 AS present FROM club_memberships WHERE club_id = ? AND user_id = ?',
      [clubId, userId]
    );

    if (existing) {
      await dbRun('DELETE FROM club_memberships WHERE club_id = ? AND user_id = ?', [
        clubId,
        userId,
      ]);
    } else {
      await dbRun('INSERT INTO club_memberships (club_id, user_id) VALUES (?, ?)', [
        clubId,
        userId,
      ]);
    }

    return this.findClubById(clubId);
  }

  /* -------------------------------------------------------------- posts */

  async findAllPosts(): Promise<ClubPost[]> {
    const rows = await dbQuery<any>(
      `${SqliteClubRepository.SELECT_POST} ORDER BY p.created_at DESC`
    );
    return Promise.all(rows.map((r) => this.hydratePost(r)));
  }

  async findPostById(id: string): Promise<ClubPost | null> {
    const row = await dbGet<any>(`${SqliteClubRepository.SELECT_POST} WHERE p.id = ?`, [id]);
    if (!row) return null;
    return this.hydratePost(row);
  }

  async createPost(data: {
    id: string;
    clubId: string;
    authorId: string;
    content: string;
    bookTitle?: string;
  }): Promise<ClubPost> {
    await dbRun(
      `INSERT INTO club_posts (id, club_id, author_id, content, book_title)
       VALUES (?, ?, ?, ?, ?)`,
      [data.id, data.clubId, data.authorId, data.content, data.bookTitle ?? null]
    );
    return (await this.findPostById(data.id))!;
  }

  async toggleLike(postId: string, userId: string): Promise<ClubPost | null> {
    const existing = await dbGet<any>(
      'SELECT 1 AS present FROM post_likes WHERE post_id = ? AND user_id = ?',
      [postId, userId]
    );

    if (existing) {
      await dbRun('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
    } else {
      await dbRun('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [postId, userId]);
    }

    return this.findPostById(postId);
  }

  async addComment(data: {
    id: string;
    postId: string;
    authorId: string;
    text: string;
  }): Promise<ClubPost | null> {
    await dbRun(
      `INSERT INTO post_comments (id, post_id, author_id, text) VALUES (?, ?, ?, ?)`,
      [data.id, data.postId, data.authorId, data.text]
    );
    return this.findPostById(data.postId);
  }

  /* ----------------------------------------------------------- hydration */

  private async hydrateClub(row: any): Promise<BookClub> {
    const members = await dbQuery<any>(
      'SELECT user_id FROM club_memberships WHERE club_id = ?',
      [row.id]
    );

    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      currentBook: row.current_book || '',
      meetupDate: row.meetup_date ?? undefined,
      members: members.map((m) => m.user_id),
      creatorId: row.creator_id,
      creatorName: row.creator_name || 'Reader',
      createdAt: row.created_at,
    };
  }

  private async hydratePost(row: any): Promise<ClubPost> {
    const likes = await dbQuery<any>('SELECT user_id FROM post_likes WHERE post_id = ?', [row.id]);

    const comments = await dbQuery<any>(
      `SELECT c.author_id, c.text, c.created_at,
              u.display_name AS author_name, u.photo_url AS author_avatar
         FROM post_comments c
         LEFT JOIN users u ON u.id = c.author_id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC`,
      [row.id]
    );

    return {
      id: row.id,
      content: row.content,
      bookTitle: row.book_title ?? undefined,
      clubId: row.club_id,
      authorId: row.author_id,
      authorName: row.author_name || 'Reader',
      authorAvatar: row.author_avatar ?? undefined,
      likes: likes.map((l) => l.user_id),
      comments: comments.map((c) => ({
        authorId: c.author_id,
        authorName: c.author_name || 'Reader',
        authorAvatar: c.author_avatar ?? undefined,
        text: c.text,
        createdAt: c.created_at,
      })),
      createdAt: row.created_at,
    };
  }
}
