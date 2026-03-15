import archiver from 'archiver';
import { PassThrough } from 'stream';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { UAT_ATTACHMENTS_BUCKET } from '@/lib/storage';

export interface AttachmentForZip {
  id: string;
  file_name: string;
  file_type: string;
  github_issue_number: number;
  attachment_id: string;
}

/**
 * Build a streaming ZIP archive from attachment records.
 * Returns a ReadableStream (Web API) for use in NextResponse.
 */
export async function buildZipStream(
  attachments: AttachmentForZip[]
): Promise<ReadableStream<Uint8Array>> {
  const admin = createSupabaseAdminClient();
  const archive = archiver('zip', { zlib: { level: 6 } });
  const passThrough = new PassThrough();

  archive.pipe(passThrough);

  // Add each file from Supabase Storage
  for (const att of attachments) {
    const ext = att.file_type === 'pdf' ? 'pdf' : 'png';
    const storagePath = `issue-${att.github_issue_number}/${att.attachment_id}.${ext}`;

    // Download file from Supabase Storage
    const { data, error } = await admin.storage
      .from(UAT_ATTACHMENTS_BUCKET)
      .download(storagePath);

    if (error || !data) {
      // Skip missing files rather than failing the entire ZIP
      continue;
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    archive.append(buffer, { name: att.file_name });
  }

  archive.finalize();

  // Convert Node.js PassThrough stream to Web ReadableStream
  return new ReadableStream<Uint8Array>({
    start(controller) {
      passThrough.on('data', (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      passThrough.on('end', () => {
        controller.close();
      });
      passThrough.on('error', (err) => {
        controller.error(err);
      });
    },
    cancel() {
      archive.abort();
      passThrough.destroy();
    },
  });
}
