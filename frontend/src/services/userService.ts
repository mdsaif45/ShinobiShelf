import { UserProfile } from '../types';

export const subscribeToUsers = (callback: (users: UserProfile[]) => void) => {
  let active = true;
  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const users = await res.json();
        if (active) callback(users);
      }
    } catch (e) {
      console.warn('Error fetching users:', e);
    }
  };

  fetchUsers();
  const interval = setInterval(fetchUsers, 5000);

  return () => {
    active = false;
    clearInterval(interval);
  };
};

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
