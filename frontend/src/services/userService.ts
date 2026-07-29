import { UserProfile } from '../types';
import { subscribePolled } from './poll';
import { getJson, sendJson } from './http';

const fetchUsers = (): Promise<UserProfile[]> => getJson<UserProfile[]>('/api/users');

export const subscribeToUsers = (callback: (users: UserProfile[]) => void) =>
  subscribePolled('users', fetchUsers, callback);

export const getUserProfile = async (_userId: string): Promise<UserProfile | null> => {
  try {
    const data = await getJson<{ user: UserProfile }>('/api/auth/me');
    return data.user;
  } catch (e) {
    console.warn('Error fetching user profile:', e);
    return null;
  }
};

/**
 * Callers inspect `result.error` rather than catching, so a failed update is
 * returned as `{ error }` instead of throwing.
 */
export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  try {
    return await sendJson<UserProfile>(`/api/users/${userId}`, 'PATCH', updates);
  } catch (err: any) {
    return { error: err?.message || 'Failed to update profile.' } as any;
  }
};
