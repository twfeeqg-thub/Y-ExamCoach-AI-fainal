import { NextRequest, NextResponse } from 'next/server';
import { listFiles, insertFile, deleteFile } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const files = await listFiles(limit, offset);
    return NextResponse.json({ success: true, data: files });
  } catch (error: any) {
    console.error('API /api/files GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list files' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !body.size || !body.fileType) {
      return NextResponse.json(
        { success: false, error: 'Missing required file fields' },
        { status: 400 }
      );
    }
    const file = await insertFile({
      name: body.name,
      size: body.size,
      fileType: body.fileType,
      grade: body.grade || null,
      section: body.section || null,
      subject: body.subject || null,
      examYear: body.examYear || null,
      governorate: body.governorate || null,
      previewUrl: body.previewUrl || null,
    });
    return NextResponse.json({ success: true, data: file }, { status: 201 });
  } catch (error: any) {
    console.error('API /api/files POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create file' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'File ID is required' },
        { status: 400 }
      );
    }
    const deleted = await deleteFile(id);
    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    console.error('API /api/files DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete file' },
      { status: 500 }
    );
  }
}
