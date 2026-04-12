/**
 * NychIQ Worker — Fallback Storage
 * Primary: Supabase Storage → Backblaze B2 → CloudFlare R2
 * All methods are abstracted so callers don't need to know the backend.
 */

import type { Env } from './env';

interface StorageResult {
  success: boolean;
  url?: string;
  source: string;
  error?: string;
}

/**
 * Upload a file to storage (tries each backend in order).
 */
export async function uploadFile(
  env: Env,
  path: string,
  data: ArrayBuffer | Uint8Array | string,
  contentType: string
): Promise<StorageResult> {
  // 1. Supabase Storage (primary)
  try {
    if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
      const res = await fetch(
        `${env.SUPABASE_URL}/storage/v1/object/nychiq-files/${path}`,
        {
          method: 'POST',
          headers: {
            'apikey': env.SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
            'Content-Type': contentType,
            'x-upsert': 'true',
          },
          body: typeof data === 'string' ? data : data,
        }
      );
      if (res.ok) {
        return {
          success: true,
          url: `${env.SUPABASE_URL}/storage/v1/object/public/nychiq-files/${path}`,
          source: 'supabase',
        };
      }
    }
  } catch (err: any) {
    console.error('Supabase storage upload error:', err?.message);
  }

  // 2. Backblaze B2 (fallback)
  try {
    if (env.BACKBLAZE_KEY_ID && env.BACKBLAZE_APP_KEY && env.BACKBLAZE_BUCKET) {
      const result = await b2Upload(env, path, data, contentType);
      if (result.success) return result;
    }
  } catch (err: any) {
    console.error('Backblaze B2 upload error:', err?.message);
  }

  // 3. CloudFlare R2 (last resort)
  try {
    const body = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    await env.STORAGE.put(path, body, {
      httpMetadata: { contentType },
      customMetadata: { uploadedAt: new Date().toISOString() },
    });
    return {
      success: true,
      url: `/api/storage/download/${path}`,
      source: 'r2',
    };
  } catch (err: any) {
    console.error('R2 upload error:', err?.message);
  }

  return { success: false, source: 'none', error: 'All storage providers failed' };
}

/**
 * Download a file from storage.
 */
export async function downloadFile(
  env: Env,
  path: string
): Promise<{ data: ArrayBuffer; contentType: string; source: string } | null> {
  // 1. Supabase Storage
  try {
    if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
      const res = await fetch(
        `${env.SUPABASE_URL}/storage/v1/object/nychiq-files/${path}`,
        {
          headers: {
            'apikey': env.SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          },
        }
      );
      if (res.ok) {
        return {
          data: await res.arrayBuffer(),
          contentType: res.headers.get('content-type') || 'application/octet-stream',
          source: 'supabase',
        };
      }
    }
  } catch (err: any) {
    console.error('Supabase storage download error:', err?.message);
  }

  // 2. Backblaze B2
  try {
    if (env.BACKBLAZE_KEY_ID && env.BACKBLAZE_APP_KEY && env.BACKBLAZE_BUCKET) {
      const result = await b2Download(env, path);
      if (result) return result;
    }
  } catch (err: any) {
    console.error('Backblaze B2 download error:', err?.message);
  }

  // 3. CloudFlare R2
  try {
    const object = await env.STORAGE.get(path);
    if (object) {
      return {
        data: await object.arrayBuffer(),
        contentType: object.httpMetadata?.contentType || 'application/octet-stream',
        source: 'r2',
      };
    }
  } catch (err: any) {
    console.error('R2 download error:', err?.message);
  }

  return null;
}

/**
 * Delete a file from all storage backends.
 */
export async function deleteFile(env: Env, path: string): Promise<{ deleted: boolean; source: string }> {
  // Try Supabase
  try {
    if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
      const res = await fetch(
        `${env.SUPABASE_URL}/storage/v1/object/nychiq-files/${path}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': env.SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          },
        }
      );
      if (res.ok || res.status === 404) return { deleted: res.ok, source: 'supabase' };
    }
  } catch (err: any) {
    console.error('Supabase storage delete error:', err?.message);
  }

  // Try R2
  try {
    await env.STORAGE.delete(path);
    return { deleted: true, source: 'r2' };
  } catch (err: any) {
    console.error('R2 delete error:', err?.message);
  }

  return { deleted: false, source: 'none' };
}

// ── Backblaze B2 helpers ──

let b2AuthCache: { token: string; apiUrl: string; bucketId: string; expiresAt: number } | null = null;

async function b2Authorize(env: Env): Promise<{ token: string; apiUrl: string; bucketId: string } | null> {
  if (b2AuthCache && b2AuthCache.expiresAt > Date.now()) {
    return { token: b2AuthCache.token, apiUrl: b2AuthCache.apiUrl, bucketId: b2AuthCache.bucketId };
  }

  const creds = btoa(`${env.BACKBLAZE_KEY_ID}:${env.BACKBLAZE_APP_KEY}`);
  const res = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
    headers: { 'Authorization': `Basic ${creds}` },
  });
  if (!res.ok) return null;

  const data: any = await res.json();
  // Find bucket ID for the configured bucket
  const bucketId = await b2GetBucketId(env, data.apiUrl, data.authorizationToken);
  if (!bucketId) return null;

  b2AuthCache = {
    token: data.authorizationToken,
    apiUrl: data.apiUrl,
    bucketId,
    expiresAt: Date.now() + 20 * 60 * 1000, // cache for 20 min
  };
  return { token: data.authorizationToken, apiUrl: data.apiUrl, bucketId };
}

async function b2GetBucketId(env: Env, apiUrl: string, token: string): Promise<string | null> {
  const res = await fetch(`${apiUrl}/b2api/v2/b2_list_buckets`, {
    method: 'POST',
    headers: { 'Authorization': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucketName: env.BACKBLAZE_BUCKET, bucketType: 'allPrivate' }),
  });
  if (!res.ok) return null;
  const data: any = await res.json();
  return data.buckets?.[0]?.bucketId || null;
}

async function b2GetUploadUrl(env: Env): Promise<{ uploadUrl: string; token: string } | null> {
  const auth = await b2Authorize(env);
  if (!auth) return null;

  const res = await fetch(`${auth.apiUrl}/b2api/v2/b2_get_upload_url`, {
    method: 'POST',
    headers: { 'Authorization': auth.token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucketId: auth.bucketId }),
  });
  if (!res.ok) return null;
  const data: any = await res.json();
  return { uploadUrl: data.uploadUrl, token: data.authorizationToken };
}

async function b2Upload(
  env: Env,
  path: string,
  data: ArrayBuffer | Uint8Array | string,
  contentType: string
): Promise<StorageResult> {
  const uploadInfo = await b2GetUploadUrl(env);
  if (!uploadInfo) return { success: false, source: 'b2', error: 'B2 auth failed' };

  const body = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const sha1 = await crypto.subtle.digest('SHA-1', body).then(b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join(''));

  const res = await fetch(uploadInfo.uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': uploadInfo.token,
      'X-Bz-File-Name': path,
      'Content-Type': contentType,
      'X-Bz-Content-Sha1': sha1,
    },
    body,
  });
  if (!res.ok) return { success: false, source: 'b2', error: `B2 upload ${res.status}` };

  const endpoint = env.BACKBLAZE_ENDPOINT || 's3.us-west-004.backblazeb2.com';
  return {
    success: true,
    url: `https://${endpoint}/file/${env.BACKBLAZE_BUCKET}/${path}`,
    source: 'b2',
  };
}

async function b2Download(
  env: Env,
  path: string
): Promise<{ data: ArrayBuffer; contentType: string; source: string } | null> {
  const auth = await b2Authorize(env);
  if (!auth) return null;

  const res = await fetch(`${auth.apiUrl}/b2api/v2/b2_download_file_by_name?bucketName=${env.BACKBLAZE_BUCKET}&fileName=${encodeURIComponent(path)}`, {
    headers: { 'Authorization': auth.token },
  });
  if (!res.ok) return null;

  return {
    data: await res.arrayBuffer(),
    contentType: res.headers.get('content-type') || 'application/octet-stream',
    source: 'b2',
  };
}
