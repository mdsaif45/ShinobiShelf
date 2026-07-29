import { IWishlistRepository } from '../interfaces/IWishlistRepository';
import { WishlistItem } from '../../../frontend/src/types';
import { dbGet, dbQuery, dbRun } from '../../config/sqlite';

export class SqliteWishlistRepository implements IWishlistRepository {
  /**
   * Requests are always read with the requester's display name joined in, and
   * with upvotes and offers attached, so the UI never has to make follow-up
   * calls per row.
   */
  private static readonly SELECT_WITH_REQUESTER = `
    SELECT w.*, u.display_name AS requester_name
    FROM wishlist_items w
    LEFT JOIN users u ON u.id = w.requester_id
  `;

  async findAll(): Promise<WishlistItem[]> {
    const rows = await dbQuery<any>(
      `${SqliteWishlistRepository.SELECT_WITH_REQUESTER} ORDER BY w.created_at DESC`
    );
    return Promise.all(rows.map((r) => this.hydrate(r)));
  }

  async findById(id: string): Promise<WishlistItem | null> {
    const row = await dbGet<any>(
      `${SqliteWishlistRepository.SELECT_WITH_REQUESTER} WHERE w.id = ?`,
      [id]
    );
    if (!row) return null;
    return this.hydrate(row);
  }

  async create(data: {
    id: string;
    title: string;
    author?: string;
    notes?: string;
    category?: string;
    requesterId: string;
  }): Promise<WishlistItem> {
    await dbRun(
      `INSERT INTO wishlist_items (id, title, author, notes, category, requester_id, fulfilled)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [
        data.id,
        data.title,
        data.author ?? null,
        data.notes ?? null,
        data.category ?? null,
        data.requesterId,
      ]
    );
    return (await this.findById(data.id))!;
  }

  async delete(id: string): Promise<boolean> {
    // Upvotes and offers cascade via their foreign keys.
    await dbRun('DELETE FROM wishlist_items WHERE id = ?', [id]);
    return true;
  }

  async toggleUpvote(itemId: string, userId: string): Promise<WishlistItem | null> {
    const existing = await dbGet<any>(
      'SELECT 1 AS present FROM wishlist_upvotes WHERE item_id = ? AND user_id = ?',
      [itemId, userId]
    );

    if (existing) {
      await dbRun('DELETE FROM wishlist_upvotes WHERE item_id = ? AND user_id = ?', [itemId, userId]);
    } else {
      await dbRun('INSERT INTO wishlist_upvotes (item_id, user_id) VALUES (?, ?)', [itemId, userId]);
    }

    return this.findById(itemId);
  }

  async addOffer(data: {
    id: string;
    itemId: string;
    offererId: string;
    message?: string;
  }): Promise<WishlistItem | null> {
    // UNIQUE (item_id, offerer_id) means a repeat offer would throw, so the
    // existing row is updated instead of failing the request.
    const existing = await dbGet<any>(
      'SELECT id FROM wishlist_offers WHERE item_id = ? AND offerer_id = ?',
      [data.itemId, data.offererId]
    );

    if (existing) {
      await dbRun('UPDATE wishlist_offers SET message = ? WHERE id = ?', [
        data.message ?? null,
        existing.id,
      ]);
    } else {
      await dbRun(
        `INSERT INTO wishlist_offers (id, item_id, offerer_id, message)
         VALUES (?, ?, ?, ?)`,
        [data.id, data.itemId, data.offererId, data.message ?? null]
      );
    }

    return this.findById(data.itemId);
  }

  async setFulfilled(
    itemId: string,
    fulfilled: boolean,
    fulfilledBy?: string
  ): Promise<WishlistItem | null> {
    await dbRun(
      `UPDATE wishlist_items
         SET fulfilled = ?, fulfilled_by = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [fulfilled ? 1 : 0, fulfilled ? fulfilledBy ?? null : null, itemId]
    );
    return this.findById(itemId);
  }

  /** Attaches the upvote and offer collections to a base row. */
  private async hydrate(row: any): Promise<WishlistItem> {
    const upvoteRows = await dbQuery<any>(
      'SELECT user_id FROM wishlist_upvotes WHERE item_id = ?',
      [row.id]
    );

    const offerRows = await dbQuery<any>(
      `SELECT o.id, o.offerer_id, o.message, o.created_at, u.display_name AS offerer_name
         FROM wishlist_offers o
         LEFT JOIN users u ON u.id = o.offerer_id
        WHERE o.item_id = ?
        ORDER BY o.created_at ASC`,
      [row.id]
    );

    return {
      id: row.id,
      title: row.title,
      author: row.author ?? undefined,
      notes: row.notes ?? undefined,
      category: row.category ?? undefined,
      requesterId: row.requester_id,
      requesterName: row.requester_name || 'Reader',
      upvotes: upvoteRows.map((u) => u.user_id),
      offers: offerRows.map((o) => ({
        id: o.id,
        offererId: o.offerer_id,
        offererName: o.offerer_name || 'Reader',
        message: o.message ?? '',
        createdAt: o.created_at,
      })),
      fulfilled: !!row.fulfilled,
      fulfilledBy: row.fulfilled_by ?? undefined,
      createdAt: row.created_at,
    };
  }
}
