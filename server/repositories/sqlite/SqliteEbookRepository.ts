import { IEbookRepository, EbookRecord } from '../interfaces/IEbookRepository';
import { dbGet, dbQuery, dbRun } from '../../config/sqlite';

export class SqliteEbookRepository implements IEbookRepository {
  async findAllByOwner(ownerId: string): Promise<EbookRecord[]> {
    const rows = await dbQuery<any>(
      `SELECT * FROM ebooks WHERE owner_id = ? ORDER BY updated_at DESC, created_at DESC`,
      [ownerId]
    );
    return rows.map((r) => this.mapRowToRecord(r));
  }

  async findById(id: string): Promise<EbookRecord | null> {
    const row = await dbGet<any>(`SELECT * FROM ebooks WHERE id = ?`, [id]);
    if (!row) return null;
    return this.mapRowToRecord(row);
  }

  async create(ebook: Partial<EbookRecord>): Promise<EbookRecord> {
    await dbRun(
      `INSERT INTO ebooks (
        id, title, author, description, file_path, file_name, file_size,
        file_format, cover_url, owner_id, progress_percent, current_location
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ebook.id,
        ebook.title,
        ebook.author ?? null,
        ebook.description ?? null,
        ebook.filePath,
        ebook.fileName,
        ebook.fileSize,
        ebook.fileFormat,
        ebook.coverUrl ?? null,
        ebook.ownerId,
        ebook.progressPercent ?? 0,
        ebook.currentLocation ?? null,
      ]
    );
    return (await this.findById(ebook.id!))!;
  }

  async updateProgress(
    id: string,
    progressPercent: number,
    currentLocation?: string
  ): Promise<EbookRecord | null> {
    await dbRun(
      `UPDATE ebooks
       SET progress_percent = ?, current_location = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [progressPercent, currentLocation ?? null, id]
    );
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    await dbRun(`DELETE FROM ebooks WHERE id = ?`, [id]);
    return true;
  }

  private mapRowToRecord(row: any): EbookRecord {
    return {
      id: row.id,
      title: row.title,
      author: row.author ?? undefined,
      description: row.description ?? undefined,
      filePath: row.file_path,
      fileName: row.file_name,
      fileSize: Number(row.file_size || 0),
      fileFormat: row.file_format,
      coverUrl: row.cover_url ?? undefined,
      ownerId: row.owner_id,
      progressPercent: Number(row.progress_percent || 0),
      currentLocation: row.current_location ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
