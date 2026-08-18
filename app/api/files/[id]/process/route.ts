import { NextRequest, NextResponse } from 'next/server';
import { getFileById, updateFileMetadata } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'File ID is required' },
        { status: 400 }
      );
    }

    const existingFile = await getFileById(id);
    if (!existingFile) {
      return NextResponse.json(
        { success: false, error: `File with ID '${id}' not found` },
        { status: 404 }
      );
    }

    await updateFileMetadata(id, {
      status: 'processing',
      progress: 30,
      step: 'forwarding_to_n8n',
    });

    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('[Next.js Process] N8N_WEBHOOK_URL unset. Updating status to waiting_for_extraction.');
      const updated = await updateFileMetadata(id, {
        status: 'processing',
        progress: 100,
        step: 'waiting_for_extraction',
      });
      return NextResponse.json({
        success: true,
        message: 'File processed locally (N8N_WEBHOOK_URL unset)',
        data: updated,
      });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No binary file buffer received' },
        { status: 400 }
      );
    }

    const n8nFormData = new FormData();
    n8nFormData.append('file', file, file.name || existingFile.name);
    n8nFormData.append('fileId', id);
    n8nFormData.append('fileName', existingFile.name);
    n8nFormData.append('grade', existingFile.grade || '');
    n8nFormData.append('section', existingFile.section || '');
    n8nFormData.append('subject', existingFile.subject || '');
    n8nFormData.append('examYear', String(existingFile.examYear || ''));
    n8nFormData.append('governorate', existingFile.governorate || '');

    const n8nRes = await fetch(webhookUrl, {
      method: 'POST',
      body: n8nFormData,
    });

    if (n8nRes.ok) {
      const updated = await updateFileMetadata(id, {
        status: 'processing',
        progress: 100,
        step: 'waiting_for_extraction',
      });
      return NextResponse.json({
        success: true,
        message: 'Binary stream successfully forwarded to n8n',
        data: updated,
      });
    } else {
      const errorText = await n8nRes.text();
      console.error(`[Next.js Process] n8n error (${n8nRes.status}):`, errorText);
      await updateFileMetadata(id, {
        status: 'failed',
        progress: 0,
        step: 'n8n_forwarding_failed',
      });
      return NextResponse.json(
        {
          success: false,
          error: `n8n webhook error (${n8nRes.status}): ${errorText}`,
        },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error('API /api/files/[id]/process POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process file binary' },
      { status: 500 }
    );
  }
}
