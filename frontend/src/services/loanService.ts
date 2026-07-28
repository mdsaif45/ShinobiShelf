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

/**
 * Deprecated no-op, kept so existing call sites keep compiling.
 *
 * This used to POST /api/users/:id/honesty, which never existed — every call
 * 404'd. It is intentionally not being added: an endpoint that lets a client
 * award points to any user is a trust hole, since anyone could inflate their
 * own score with a single fetch.
 *
 * Honesty points are now applied server-side inside the RETURNED transition in
 * LoanService.updateStatus, where the loan's due date is known and the caller
 * has already been authorised.
 */
export const awardHonestyPoints = async (_userId: string, _points: number) => {
  return { ok: true, note: 'Honesty points are applied server-side on return.' };
};
