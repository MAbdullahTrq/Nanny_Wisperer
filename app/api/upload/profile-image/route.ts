import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { authOptions } from '@/lib/auth';

/** Max size for profile image upload: 20MB (client compresses to KBs before sending; this is a safety limit) */
const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') ?? formData.get('image');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided. Use field name "file" or "image".' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image (e.g. JPEG, PNG, HEIC)' }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File must be 20MB or smaller (current: ${(file.size / 1024 / 1024).toFixed(1)}MB)` },
      { status: 400 }
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('BLOB_READ_WRITE_TOKEN is not set');
    return NextResponse.json(
      { error: 'Upload is not configured. Please try again later.' },
      { status: 503 }
    );
  }

  try {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const prefix = `profile-images/${session.user.email?.replace(/[^a-z0-9]/gi, '-') || 'user'}`;
    const blob = await put(`${prefix}-${Date.now()}.${ext}`, file, {
      access: 'public',
      addRandomSuffix: true,
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error('Profile image upload error:', e);
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}
