import { WishlistItem } from '../types';

let memoryWishlist: WishlistItem[] = [];

export const subscribeToWishlist = (callback: (items: WishlistItem[]) => void) => {
  callback(memoryWishlist);
  return () => {};
};

export const addWishlistItem = async (item: Partial<WishlistItem>) => {
  const newItem: WishlistItem = {
    id: 'wish_' + Math.random().toString(36).substring(2, 9),
    title: item.title || 'Book Title',
    requesterId: item.requesterId || 'user',
    requesterName: item.requesterName || 'Reader',
    fulfilled: false,
    createdAt: new Date().toISOString(),
    ...item,
  };
  memoryWishlist.unshift(newItem);
  return newItem;
};

export const toggleUpvote = async (itemId: string, userId: string) => {
  const item = memoryWishlist.find((w) => w.id === itemId);
  if (item) {
    if (!item.upvotes) item.upvotes = [];
    const idx = item.upvotes.indexOf(userId);
    if (idx >= 0) {
      item.upvotes.splice(idx, 1);
    } else {
      item.upvotes.push(userId);
    }
  }
};

export const addOfferToWishlistItem = async (itemId: string, offer: any) => {
  const item = memoryWishlist.find((w) => w.id === itemId);
  if (item) {
    if (!item.offers) item.offers = [];
    item.offers.push(offer);
  }
};

export const toggleWishlistFulfilled = async (
  itemId: string,
  currentState: boolean,
  fulfilledByName?: string
) => {
  const item = memoryWishlist.find((w) => w.id === itemId);
  if (item) {
    item.fulfilled = !currentState;
    item.fulfilledBy = !currentState ? fulfilledByName || 'Generous Member' : '';
  }
};
