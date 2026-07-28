import { BorrowRequest } from '../types';
import { subscribePolled } from './poll';

const fetchLoans = async (): Promise<BorrowRequest[]> => {
  const res = await fetch('/api/loans');
  if (!res.ok) throw new Error(`GET /api/loans failed: ${res.status}`);
  return res.json();
};

export const subscribeToBorrowRequests = (callback: (requests: BorrowRequest[]) => void) =>
  subscribePolled('loans', fetchLoans, callback);

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
