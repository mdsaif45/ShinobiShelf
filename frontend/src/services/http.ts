/**
 * Authenticated fetch helper.
 *
 * Every read endpoint now requires a token, so the Authorization header was
 * being rebuilt in each service. Centralising it means a service cannot forget
 * the header and silently start 401-ing.
 */

export function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = localStorage.getItem('authToken');
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** GET a JSON resource with the caller's token attached. */
export async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: authHeaders() });
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Send a JSON body and read the response defensively.
 *
 * A 201 or 204 can legitimately carry an empty body, and calling res.json() on
 * one throws "Unexpected end of JSON input" — which used to surface to users as
 * a raw browser exception on borrow requests that had actually succeeded.
 */
export async function sendJson<T = unknown>(
  path: string,
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  body?: unknown
): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const text = await res.text();
  let parsed: any = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      // Not JSON. Kept as null; the status decides success below.
    }
  }

  if (!res.ok) {
    throw new Error(parsed?.error || `${method} ${path} failed: ${res.status}`);
  }

  return parsed as T;
}
