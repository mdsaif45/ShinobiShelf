import { IUserRepository } from '../interfaces/IUserRepository';
import { UserProfile } from '../../../frontend/src/types';
import { dbGet, dbQuery, dbRun } from '../../config/sqlite';

export class SqliteUserRepository implements IUserRepository {
  async findById(id: string): Promise<UserProfile | null> {
    const row = await dbGet<any>('SELECT * FROM users WHERE id = ?', [id]);
    if (!row) return null;
    return this.mapToUserProfile(row);
  }

  async findByEmail(email: string): Promise<any | null> {
    const row = await dbGet<any>('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
    if (!row) return null;
    return {
      ...this.mapToUserProfile(row),
      passwordHash: row.password_hash,
      salt: row.salt,
      authProvider: row.auth_provider,
      googleId: row.google_id,
      googleAccessToken: row.google_access_token,
    };
  }

  async createUserWithPassword(data: { id: string; email: string; displayName?: string; passwordHash: string; salt: string }): Promise<UserProfile> {
    await dbRun(
      `INSERT INTO users (id, email, display_name, password_hash, salt, auth_provider, honesty_score, books_lent_count, books_borrowed_count)
       VALUES (?, ?, ?, ?, ?, 'email', 100, 0, 0)`,
      [
        data.id,
        data.email.toLowerCase(),
        data.displayName || data.email.split('@')[0],
        data.passwordHash,
        data.salt,
      ]
    );
    return (await this.findById(data.id))!;
  }

  async saveGoogleUser(data: { id: string; email: string; displayName?: string; photoURL?: string; googleId: string; googleAccessToken?: string }): Promise<UserProfile> {
    const existingByEmail = await this.findByEmail(data.email);
    const userId = existingByEmail ? existingByEmail.id : data.id;

    if (existingByEmail) {
      await dbRun(
        `UPDATE users SET
           display_name = COALESCE(?, display_name),
           photo_url = COALESCE(?, photo_url),
           auth_provider = 'google',
           google_id = ?,
           google_access_token = COALESCE(?, google_access_token),
           updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          // sql.js rejects `undefined` as a bind value; use null so the
          // COALESCE(?, col) keeps the existing column value.
          data.displayName ?? null,
          data.photoURL ?? null,
          data.googleId,
          data.googleAccessToken || '',
          userId,
        ]
      );
    } else {
      await dbRun(
        `INSERT INTO users (id, email, display_name, photo_url, auth_provider, google_id, google_access_token, honesty_score, books_lent_count, books_borrowed_count)
         VALUES (?, ?, ?, ?, 'google', ?, ?, 100, 0, 0)`,
        [
          userId,
          data.email.toLowerCase(),
          data.displayName || data.email.split('@')[0],
          data.photoURL || '',
          data.googleId,
          data.googleAccessToken || '',
        ]
      );
    }

    return (await this.findById(userId))!;
  }

  async createOrUpdate(user: Partial<UserProfile>): Promise<UserProfile> {
    if (!user.id) throw new Error('User ID is required');
    const existing = await this.findById(user.id);

    const favGenresStr = user.favoriteGenres ? JSON.stringify(user.favoriteGenres) : undefined;
    const notifPrefsStr = user.notificationPreferences ? JSON.stringify(user.notificationPreferences) : undefined;
    
    if (!existing) {
      await dbRun(
        `INSERT INTO users (id, email, display_name, photo_url, bio, favorite_genres, notification_preferences, honesty_score, books_lent_count, books_borrowed_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          user.email || '',
          user.displayName || 'Anonymous Reader',
          user.photoURL || '',
          user.bio || '',
          favGenresStr || JSON.stringify(['Fiction', 'Philosophy', 'Sci-Fi']),
          notifPrefsStr || JSON.stringify({ borrowAlerts: true, clubAlerts: true, returnReminders: true, weeklyDigest: false }),
          user.honestyScore || 100,
          user.booksLentCount || 0,
          user.booksBorrowedCount || 0,
        ]
      );
    } else {
      await dbRun(
        `UPDATE users SET
           email = COALESCE(?, email),
           display_name = COALESCE(?, display_name),
           photo_url = COALESCE(?, photo_url),
           bio = COALESCE(?, bio),
           favorite_genres = COALESCE(?, favorite_genres),
           notification_preferences = COALESCE(?, notification_preferences),
           honesty_score = COALESCE(?, honesty_score),
           updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          user.email !== undefined ? user.email : null,
          user.displayName !== undefined ? user.displayName : null,
          user.photoURL !== undefined ? user.photoURL : null,
          user.bio !== undefined ? user.bio : null,
          favGenresStr !== undefined ? favGenresStr : null,
          notifPrefsStr !== undefined ? notifPrefsStr : null,
          user.honestyScore !== undefined ? user.honestyScore : null,
          user.id,
        ]
      );
    }

    return (await this.findById(user.id))!;
  }

  async updateHonestyScore(userId: string, pointsDelta: number): Promise<number> {
    const user = await this.findById(userId);
    const currentScore = user ? user.honestyScore || 100 : 100;
    const newScore = Math.max(0, currentScore + pointsDelta);

    if (user) {
      await dbRun('UPDATE users SET honesty_score = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newScore, userId]);
    } else {
      await dbRun(
        `INSERT INTO users (id, email, display_name, honesty_score) VALUES (?, ?, ?, ?)`,
        [userId, `${userId}@placeholder.org`, 'Community Reader', newScore]
      );
    }

    return newScore;
  }

  async findAll(): Promise<UserProfile[]> {
    const rows = await dbQuery<any>('SELECT * FROM users ORDER BY honesty_score DESC');
    return rows.map(r => this.mapToUserProfile(r));
  }

  private mapToUserProfile(row: any): UserProfile {
    let favGenres: string[] = ['Fiction', 'Philosophy', 'Sci-Fi'];
    if (row.favorite_genres) {
      try {
        favGenres = JSON.parse(row.favorite_genres);
      } catch (e) {
        favGenres = row.favorite_genres.split(',').map((s: string) => s.trim());
      }
    }

    let notifPrefs = {
      borrowAlerts: true,
      clubAlerts: true,
      returnReminders: true,
      weeklyDigest: false,
    };
    if (row.notification_preferences) {
      try {
        notifPrefs = { ...notifPrefs, ...JSON.parse(row.notification_preferences) };
      } catch (e) {}
    }

    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      photoURL: row.photo_url,
      bio: row.bio || '',
      favoriteGenres: favGenres,
      notificationPreferences: notifPrefs,
      honestyScore: row.honesty_score,
      booksLentCount: row.books_lent_count,
      booksBorrowedCount: row.books_borrowed_count,
      createdAt: row.created_at,
    };
  }
}
