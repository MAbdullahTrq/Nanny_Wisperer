import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { authOptions } from '@/lib/auth';
import { getConversation } from '@/lib/db/chat';

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const conversationId = request.headers.get('x-conversation-id') ?? new URL(request.url).searchParams.get('conversationId');
  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId required (header or query)' }, { status: 400 });
  }

  const conversation = await getConversation(conversationId);
  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  const airtableHostId = (session.user as { airtableHostId?: string }).airtableHostId;
  const airtableNannyId = (session.user as { airtableNannyId?: string }).airtableNannyId;
  const isParticipant =
    (airtableHostId && conversation.hostId === airtableHostId) ||
    (airtableNannyId && conversation.nannyId === airtableNannyId);
  if (!isParticipant) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') ?? formData.get('attachment');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided. Use field "file" or "attachment".' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'File must be an image (JPEG, PNG, GIF, WebP) or PDF' },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File must be 5MB or smaller (current: ${(file.size / 1024 / 1024).toFixed(1)}MB)` },
      { status: 400 }
    );
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: 'Upload not configured' }, { status: 503 });
  }

  try {
    const ext = file.name.split('.').pop()?.toLowerCase() || (file.type === 'application/pdf' ? 'pdf' : 'jpg');
    const prefix = `chat-attachments/${conversationId}/${session.user?.email?.replace(/[^a-z0-9]/gi, '-') || 'user'}`;
    const blob = await put(`${prefix}-${Date.now()}.${ext}`, file, {
      access: 'public',
      addRandomSuffix: true,
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error('Chat attachment upload error:', e);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
