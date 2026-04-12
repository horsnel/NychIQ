/**
 * NychIQ Worker — File Storage Routes
 * Upload, download, and delete files with fallback:
 * Supabase Storage → Backblaze B2 → CloudFlare R2
 */

import { Hono } from 'hono';
import type { Env } from '../lib/env';
import { uploadFile, downloadFile, deleteFile } from '../lib/fallback-storage';

export const storageRoutes = new Hono<{ Bindings: Env }>();

/**
 * POST /api/storage/upload — Upload a file
 * Body (multipart/form-data): file, path (optional prefix)
 * Headers: Authorization: Bearer <token>
 */
storageRoutes.post('/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File | null;
    const path = formData.get('path') as string | null;

    if (!file) {
      return c.json({ error: 'file field is required in form data' }, 400);
    }

    // Max 10MB upload
    if (file.size > 10 * 1024 * 1024) {
      return c.json({ error: 'File size exceeds 10MB limit' }, 400);
    }

    const filePath = path
      ? `${path.replace(/^\//, '').replace(/\/$/, '')}/${Date.now()}-${file.name}`
      : `uploads/${Date.now()}-${file.name}`;

    const buffer = await file.arrayBuffer();
    const result = await uploadFile(c.env, filePath, buffer, file.type || 'application/octet-stream');

    if (result.success) {
      return c.json({ uploaded: true, path: filePath, url: result.url, source: result.source });
    }

    return c.json({ error: result.error || 'Upload failed' }, 500);
  } catch (err: any) {
    console.error('Storage upload error:', err?.message);
    return c.json({ error: err?.message || 'Upload failed' }, 500);
  }
});

/**
 * GET /api/storage/download/:path+ — Download a file
 */
storageRoutes.get('/download/*', async (c) => {
  const filePath = c.req.path.replace('/api/storage/download/', '');

  if (!filePath) {
    return c.json({ error: 'File path is required' }, 400);
  }

  const result = await downloadFile(c.env, filePath);

  if (result) {
    return new Response(result.data, {
      headers: {
        'Content-Type': result.contentType,
        'Cache-Control': 'public, max-age=86400',
        'X-Storage-Source': result.source,
      },
    });
  }

  return c.json({ error: 'File not found' }, 404);
});

/**
 * DELETE /api/storage/delete — Delete a file
 * Body: { path: string }
 */
storageRoutes.delete('/delete', async (c) => {
  try {
    const { path } = await c.req.json<{ path?: string }>();

    if (!path) {
      return c.json({ error: 'path is required' }, 400);
    }

    const result = await deleteFile(c.env, path);
    return c.json({ deleted: result.deleted, source: result.source });
  } catch (err: any) {
    console.error('Storage delete error:', err?.message);
    return c.json({ error: err?.message || 'Delete failed' }, 500);
  }
});
