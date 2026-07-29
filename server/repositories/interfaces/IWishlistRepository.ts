import { WishlistItem } from '@/types';

export interface IWishlistRepository {
  /** Every request, newest first, with upvotes and offers joined in. */
  findAll(): Promise<WishlistItem[]>;
  findById(id: string): Promise<WishlistItem | null>;
  create(data: {
    id: string;
    title: string;
    author?: string;
    notes?: string;
    category?: string;
    requesterId: string;
  }): Promise<WishlistItem>;
  delete(id: string): Promise<boolean>;

  /** Adds or removes the caller's "me too" vote. Returns the new state. */
  toggleUpvote(itemId: string, userId: string): Promise<WishlistItem | null>;

  /** Records an offer to lend. One offer per user per item. */
  addOffer(data: {
    id: string;
    itemId: string;
    offererId: string;
    message?: string;
  }): Promise<WishlistItem | null>;

  setFulfilled(itemId: string, fulfilled: boolean, fulfilledBy?: string): Promise<WishlistItem | null>;
}
