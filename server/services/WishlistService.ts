import crypto from 'crypto';
import { IWishlistRepository } from '../repositories/interfaces/IWishlistRepository';
import { WishlistItem } from '@/types';

export class WishlistService {
  constructor(private wishlistRepo: IWishlistRepository) {}

  async getAll(): Promise<WishlistItem[]> {
    return await this.wishlistRepo.findAll();
  }

  async create(data: {
    title?: string;
    author?: string;
    notes?: string;
    category?: string;
    requesterId: string;
  }): Promise<WishlistItem> {
    const title = data.title?.trim();
    if (!title) {
      throw Object.assign(new Error('A book title is required.'), { status: 400 });
    }

    return await this.wishlistRepo.create({
      id: 'wish_' + crypto.randomBytes(6).toString('hex'),
      title,
      author: data.author?.trim() || undefined,
      notes: data.notes?.trim() || undefined,
      category: data.category?.trim() || undefined,
      requesterId: data.requesterId,
    });
  }

  async toggleUpvote(itemId: string, userId: string): Promise<WishlistItem> {
    const item = await this.requireItem(itemId);

    // Upvoting your own request would inflate a signal meant to show how many
    // other people want the book.
    if (item.requesterId === userId) {
      throw Object.assign(new Error('You cannot upvote your own request.'), { status: 400 });
    }

    return (await this.wishlistRepo.toggleUpvote(itemId, userId))!;
  }

  async addOffer(itemId: string, offererId: string, message?: string): Promise<WishlistItem> {
    const item = await this.requireItem(itemId);

    // Offering to lend against your own request is meaningless, and the UI's
    // guard was ineffective, so it is enforced here.
    if (item.requesterId === offererId) {
      throw Object.assign(
        new Error('You cannot offer to lend against your own request.'),
        { status: 400 }
      );
    }

    return (await this.wishlistRepo.addOffer({
      id: 'offer_' + crypto.randomBytes(6).toString('hex'),
      itemId,
      offererId,
      message: message?.trim() || undefined,
    }))!;
  }

  /** Only the requester may mark their own request fulfilled or reopen it. */
  async setFulfilled(
    itemId: string,
    fulfilled: boolean,
    callerId: string
  ): Promise<WishlistItem> {
    const item = await this.requireItem(itemId);
    if (item.requesterId !== callerId) {
      throw Object.assign(
        new Error('Only the requester can change this.'),
        { status: 403 }
      );
    }
    return (await this.wishlistRepo.setFulfilled(itemId, fulfilled, callerId))!;
  }

  /** Only the requester may delete their own request. */
  async delete(itemId: string, callerId: string): Promise<void> {
    const item = await this.requireItem(itemId);
    if (item.requesterId !== callerId) {
      throw Object.assign(
        new Error('Only the requester can delete this request.'),
        { status: 403 }
      );
    }
    await this.wishlistRepo.delete(itemId);
  }

  private async requireItem(itemId: string): Promise<WishlistItem> {
    const item = await this.wishlistRepo.findById(itemId);
    if (!item) {
      throw Object.assign(new Error('That request no longer exists.'), { status: 404 });
    }
    return item;
  }
}
