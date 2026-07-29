import { WishlistItem } from '../types';
import { subscribePolled, refreshPolled } from './poll';
import { getJson, sendJson } from './http';

/**
 * Wishlist board.
 *
 * This module previously kept its data in a module-level array, which had two
 * consequences: everything was lost on reload, and because the array lived in
 * the tab rather than per user, two accounts signing in one after the other in
 * the same tab saw each other's uncommitted requests. Both are resolved by
 * reading and writing through the server.
 */

const fetchWishlist = (): Promise<WishlistItem[]> => getJson<WishlistItem[]>('/api/wishlist');

export const subscribeToWishlist = (callback: (items: WishlistItem[]) => void) =>
  subscribePolled('wishlist', fetchWishlist, callback);

export const addWishlistItem = async (item: Partial<WishlistItem>) => {
  const created = await sendJson<WishlistItem>('/api/wishlist', 'POST', {
    title: item.title,
    author: item.author,
    notes: item.notes,
    category: item.category,
  });
  refreshPolled('wishlist');
  return created;
};

/** The server derives the voter from the session, so no user id is sent. */
export const toggleUpvote = async (itemId: string, _userId?: string) => {
  const updated = await sendJson<WishlistItem>(`/api/wishlist/${itemId}/upvote`, 'POST');
  refreshPolled('wishlist');
  return updated;
};

export const addOfferToWishlistItem = async (itemId: string, offer: { message?: string } = {}) => {
  const updated = await sendJson<WishlistItem>(`/api/wishlist/${itemId}/offers`, 'POST', {
    message: offer?.message,
  });
  refreshPolled('wishlist');
  return updated;
};

export const toggleWishlistFulfilled = async (itemId: string, fulfilled: boolean) => {
  const updated = await sendJson<WishlistItem>(`/api/wishlist/${itemId}/fulfilled`, 'PATCH', {
    fulfilled,
  });
  refreshPolled('wishlist');
  return updated;
};

export const deleteWishlistItem = async (itemId: string) => {
  const result = await sendJson(`/api/wishlist/${itemId}`, 'DELETE');
  refreshPolled('wishlist');
  return result;
};
