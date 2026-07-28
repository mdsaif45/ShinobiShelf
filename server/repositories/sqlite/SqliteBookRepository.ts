import { IBookRepository } from '../interfaces/IBookRepository';
import { Book } from '../../../frontend/src/types';
import { dbGet, dbQuery, dbRun } from '../../config/sqlite';

export class SqliteBookRepository implements IBookRepository {
  // Books are always read with their owner's display name joined in, so the
  // UI can name the owner instead of falling back to a literal "Owner".
  private static readonly SELECT_WITH_OWNER = `
    SELECT b.*, u.display_name AS owner_name, u.photo_url AS owner_photo_url
    FROM books b
    LEFT JOIN users u ON u.id = b.owner_id
  `;

  async findAll(): Promise<Book[]> {
    const rows = await dbQuery<any>(
      `${SqliteBookRepository.SELECT_WITH_OWNER} ORDER BY b.created_at DESC`
    );
    return rows.map(r => this.mapToBook(r));
  }

  async findById(id: string): Promise<Book | null> {
    const row = await dbGet<any>(
      `${SqliteBookRepository.SELECT_WITH_OWNER} WHERE b.id = ?`,
      [id]
    );
    if (!row) return null;
    return this.mapToBook(row);
  }

  async create(bookData: Partial<Book>): Promise<Book> {
    const id = bookData.id || `book_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const status = bookData.status || 'AVAILABLE';

    await dbRun(
      `INSERT INTO books (id, title, author, cover_url, description, genre, isbn, owner_id, status, progress, current_reader_id, circle_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        bookData.title || 'Untitled Book',
        bookData.author || 'Unknown Author',
        bookData.coverUrl || '',
        bookData.description || '',
        bookData.genre || 'General',
        bookData.isbn || '',
        bookData.ownerId || 'system',
        status,
        bookData.progress || 0,
        bookData.currentReader?.uid || null,
        bookData.circleId || null,
      ]
    );

    return (await this.findById(id))!;
  }

  async update(id: string, updates: Partial<Book>): Promise<Book | null> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
    if (updates.author !== undefined) { fields.push('author = ?'); values.push(updates.author); }
    if (updates.coverUrl !== undefined) { fields.push('cover_url = ?'); values.push(updates.coverUrl); }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    if (updates.genre !== undefined) { fields.push('genre = ?'); values.push(updates.genre); }
    if (updates.isbn !== undefined) { fields.push('isbn = ?'); values.push(updates.isbn); }
    if (updates.status !== undefined) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.progress !== undefined) { fields.push('progress = ?'); values.push(updates.progress); }
    if (updates.currentReader !== undefined) { fields.push('current_reader_id = ?'); values.push(updates.currentReader?.uid || null); }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await dbRun(`UPDATE books SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await dbRun('DELETE FROM books WHERE id = ?', [id]);
    return result.changes > 0;
  }

  private mapToBook(row: any): Book {
    return {
      id: row.id,
      title: row.title,
      author: row.author,
      coverUrl: row.cover_url,
      description: row.description,
      genre: row.genre,
      isbn: row.isbn,
      ownerId: row.owner_id,
      // Present whenever the row came from a query that joined users.
      owner: row.owner_id
        ? {
            id: row.owner_id,
            uid: row.owner_id,
            name: row.owner_name || undefined,
            avatar: row.owner_photo_url || undefined,
          }
        : undefined,
      status: row.status,
      progress: row.progress,
      currentReader: row.current_reader_id ? { uid: row.current_reader_id } : null,
      circleId: row.circle_id,
      createdAt: row.created_at,
    };
  }
}
