import { BorrowRequest } from '../types';

export const subscribeToBorrowRequests = (callback: (requests: BorrowRequest[]) => void) => {
  let active = true;
  const fetchLoans = async () => {
    try {
      const res = await fetch('/api/loans');
      if (res.ok) {
        const requests = await res.json();
        if (active) callback(requests);
      }
    } catch (e) {
      console.warn('Error fetching borrow requests:', e);
    }
  };

  fetchLoans();
  const interval = setInterval(fetchLoans, 3000);

  return () => {
    active = false;
    clearInterval(interval);
  };
};

export const createBorrowRequest = async (data: Partial<BorrowRequest>) => {
  const token = localStorage.getItem('authToken');
  const res = await fetch('/api/loans', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  return await res.json();
};

export const updateBorrowRequestStatus = async (
  requestId: string,
  status: BorrowRequest['status'],
  additionalFields: Partial<BorrowRequest> = {}
) => {
  const token = localStorage.getItem('authToken');
  const res = await fetch(`/api/loans/${requestId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ status, ...additionalFields }),
  });
  return await res.json();
};

export const awardHonestyPoints = async (userId: string, points: number) => {
  const token = localStorage.getItem('authToken');
  const res = await fetch(`/api/users/${userId}/honesty`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ points }),
  });
  return await res.json();
};
