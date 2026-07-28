import { UserProfile } from '../types';
import { subscribePolled } from './poll';

const fetchUsers = async (): Promise<UserProfile[]> => {
  const res = await fetch('/api/users');
  if (!res.ok) throw new Error(`GET /api/users failed: ${res.status}`);
  return res.json();
};

export const subscribeToUsers = (callback: (users: UserProfile[]) => void) =>
  subscribePolled('users', fetchUsers, callback);

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const token = localStorage.getItem('authToken');
    const res = await fetch('/api/auth/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) {
      const data = await res.json();
      return data.user;
    }
  } catch (e) {
    console.warn('Error fetching user profile:', e);
  }
  return null;
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const token = localStorage.getItem('authToken');
  const res = await fetch(`/api/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(updates),
  });
  return await res.json();
};
