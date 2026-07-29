import { BorrowRequest } from '../types';
import { subscribePolled, refreshPolled } from './poll';
import { getJson, sendJson } from './http';

const fetchLoans = (): Promise<BorrowRequest[]> => getJson<BorrowRequest[]>('/api/loans');

export const subscribeToBorrowRequests = (callback: (requests: BorrowRequest[]) => void) =>
  subscribePolled('loans', fetchLoans, callback);

export const createBorrowRequest = async (data: Partial<BorrowRequest>) => {
  const created = await sendJson<BorrowRequest>('/api/loans', 'POST', data);
  refreshPolled('loans');
  return created;
};

export const updateBorrowRequestStatus = async (
  requestId: string,
  status: BorrowRequest['status'],
  additionalFields: Partial<BorrowRequest> = {}
) => {
  const updated = await sendJson<BorrowRequest>(`/api/loans/${requestId}/status`, 'PATCH', {
    status,
    ...additionalFields,
  });
  // A status change alters book availability too, so both polls refresh.
  refreshPolled('loans');
  refreshPolled('books');
  return updated;
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
