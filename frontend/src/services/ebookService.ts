import { Ebook } from '../types';
import { authHeaders, getJson, sendJson } from './http';

export async function fetchUserEbooks(): Promise<Ebook[]> {
  return await getJson<Ebook[]>('/api/ebooks');
}

export async function fetchEbookById(id: string): Promise<Ebook> {
  return await getJson<Ebook>(`/api/ebooks/${id}`);
}

export async function uploadEbookFile(
  file: File,
  metadata: { title?: string; author?: string; description?: string; coverUrl?: string }
): Promise<Ebook> {
  const formData = new FormData();
  formData.append('ebookFile', file);
  if (metadata.title) formData.append('title', metadata.title);
  if (metadata.author) formData.append('author', metadata.author);
  if (metadata.description) formData.append('description', metadata.description);
  if (metadata.coverUrl) formData.append('coverUrl', metadata.coverUrl);

  const res = await fetch('/api/ebooks/upload', {
    method: 'POST',
    headers: authHeaders(), // FormData will set multipart boundary automatically
    body: formData,
  });

  const text = await res.text();
  let parsed: any = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      // not json
    }
  }

  if (!res.ok) {
    throw new Error(parsed?.error || `Upload failed with status ${res.status}`);
  }

  return parsed as Ebook;
}

export async function updateEbookProgress(
  id: string,
  progressPercent: number,
  currentLocation?: string
): Promise<Ebook> {
  return await sendJson<Ebook>(`/api/ebooks/${id}/progress`, 'PATCH', {
    progressPercent,
    currentLocation,
  });
}

export async function deleteEbook(id: string): Promise<boolean> {
  await sendJson(`/api/ebooks/${id}`, 'DELETE');
  return true;
}

export function getEbookFileUrl(id: string): string {
  const token = localStorage.getItem('authToken');
  return `/api/ebooks/${id}/file${token ? `?token=${encodeURIComponent(token)}` : ''}`;
}
