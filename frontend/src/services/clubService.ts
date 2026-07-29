import { BookClub, ClubPost } from '../types';
import { subscribePolled, refreshPolled } from './poll';
import { getJson, sendJson } from './http';

/**
 * Book clubs and their discussion posts.
 *
 * As with the wishlist, this module previously kept clubs and posts in
 * module-level arrays: everything was lost on reload, and because the arrays
 * lived in the tab rather than per user, a post written by one account was
 * visible to the next account signed in to the same tab. Reading and writing
 * through the server resolves both.
 */

const fetchClubs = (): Promise<BookClub[]> => getJson<BookClub[]>('/api/clubs');
const fetchPosts = (): Promise<ClubPost[]> => getJson<ClubPost[]>('/api/clubs/posts/all');

export const subscribeToBookClubs = (callback: (clubs: BookClub[]) => void) =>
  subscribePolled('clubs', fetchClubs, callback);

export const subscribeToClubPosts = (callback: (posts: ClubPost[]) => void) =>
  subscribePolled('clubPosts', fetchPosts, callback);

export const createBookClub = async (clubData: Partial<BookClub>) => {
  const created = await sendJson<BookClub>('/api/clubs', 'POST', {
    name: clubData.name,
    description: clubData.description,
    currentBook: clubData.currentBook,
    meetupDate: clubData.meetupDate,
  });
  refreshPolled('clubs');
  return created;
};

/**
 * Membership is a toggle on the server, which derives the member from the
 * session; the previous `userId` and `isMember` arguments are no longer needed
 * and are accepted only so existing call sites keep working.
 */
export const toggleClubMembership = async (
  clubId: string,
  _userId?: string,
  _isMember?: boolean
) => {
  const updated = await sendJson<BookClub>(`/api/clubs/${clubId}/membership`, 'POST');
  refreshPolled('clubs');
  return updated;
};

export const createClubPost = async (postData: Partial<ClubPost>) => {
  const created = await sendJson<ClubPost>('/api/clubs/posts', 'POST', {
    clubId: postData.clubId,
    content: postData.content,
    bookTitle: postData.bookTitle,
  });
  refreshPolled('clubPosts');
  return created;
};

export const togglePostLike = async (postId: string, _userId?: string, _hasLiked?: boolean) => {
  const updated = await sendJson<ClubPost>(`/api/clubs/posts/${postId}/like`, 'POST');
  refreshPolled('clubPosts');
  return updated;
};

export const addPostComment = async (postId: string, comment: { text?: string }) => {
  const updated = await sendJson<ClubPost>(`/api/clubs/posts/${postId}/comments`, 'POST', {
    text: comment?.text,
  });
  refreshPolled('clubPosts');
  return updated;
};
