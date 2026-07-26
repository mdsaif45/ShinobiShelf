import { ILoanRepository } from '../interfaces/ILoanRepository';
import { BorrowRequest } from '../../../frontend/src/types';
import { dbGet, dbQuery, dbRun } from '../../config/sqlite';

export class SqliteLoanRepository implements ILoanRepository {
  async findAll(): Promise<BorrowRequest[]> {
    const rows = await dbQuery<any>(`
      SELECT br.*, b.title AS book_title, u.display_name AS borrower_name, o.display_name AS owner_name
      FROM borrow_requests br
      LEFT JOIN books b ON br.book_id = b.id
      LEFT JOIN users u ON br.borrower_id = u.id
      LEFT JOIN users o ON br.owner_id = o.id
      ORDER BY br.created_at DESC
    `);
    return rows.map(r => this.mapToBorrowRequest(r));
  }

  async findById(id: string): Promise<BorrowRequest | null> {
    const row = await dbGet<any>(`
      SELECT br.*, b.title AS book_title, u.display_name AS borrower_name, o.display_name AS owner_name
      FROM borrow_requests br
      LEFT JOIN books b ON br.book_id = b.id
      LEFT JOIN users u ON br.borrower_id = u.id
      LEFT JOIN users o ON br.owner_id = o.id
      WHERE br.id = ?
    `, [id]);
    if (!row) return null;
    return this.mapToBorrowRequest(row);
  }

  async create(data: Partial<BorrowRequest>): Promise<BorrowRequest> {
    const id = data.id || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    await dbRun(
      `INSERT INTO borrow_requests (id, book_id, borrower_id, owner_id, status, requested_duration_days, start_date, due_date, handshake_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.bookId || '',
        data.borrowerId || '',
        data.ownerId || '',
        data.status || 'PENDING',
        data.requestedDurationDays || 14,
        data.startDate || null,
        data.dueDate || null,
        data.handshakeCode || null,
      ]
    );

    return (await this.findById(id))!;
  }

  async updateStatus(id: string, status: BorrowRequest['status'], updates: Partial<BorrowRequest> = {}): Promise<BorrowRequest | null> {
    const fields: string[] = ['status = ?'];
    const values: any[] = [status];

    if (updates.startDate !== undefined) { fields.push('start_date = ?'); values.push(updates.startDate); }
    if (updates.dueDate !== undefined) { fields.push('due_date = ?'); values.push(updates.dueDate); }
    if (updates.handshakeCode !== undefined) { fields.push('handshake_code = ?'); values.push(updates.handshakeCode); }

    if (status === 'HANDED_OVER') {
      fields.push('handed_over_at = CURRENT_TIMESTAMP');
    } else if (status === 'RETURNED') {
      fields.push('returned_at = CURRENT_TIMESTAMP');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await dbRun(`UPDATE borrow_requests SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  async findByUser(userId: string): Promise<BorrowRequest[]> {
    const rows = await dbQuery<any>(`
      SELECT br.*, b.title AS book_title, u.display_name AS borrower_name, o.display_name AS owner_name
      FROM borrow_requests br
      LEFT JOIN books b ON br.book_id = b.id
      LEFT JOIN users u ON br.borrower_id = u.id
      LEFT JOIN users o ON br.owner_id = o.id
      WHERE br.borrower_id = ? OR br.owner_id = ?
      ORDER BY br.created_at DESC
    `, [userId, userId]);
    return rows.map(r => this.mapToBorrowRequest(r));
  }

  private mapToBorrowRequest(row: any): BorrowRequest {
    return {
      id: row.id,
      bookId: row.book_id,
      bookTitle: row.book_title || 'Community Book',
      borrowerId: row.borrower_id,
      borrowerName: row.borrower_name || 'Borrower',
      ownerId: row.owner_id,
      ownerName: row.owner_name || 'Owner',
      status: row.status,
      requestedDurationDays: row.requested_duration_days,
      startDate: row.start_date,
      dueDate: row.due_date,
      handshakeCode: row.handshake_code,
      createdAt: row.created_at,
    };
  }
}
