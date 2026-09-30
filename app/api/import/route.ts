
import { NextRequest, NextResponse } from 'next/server';
import { insertFile, insertQuestion } from '@/lib/db';
import { QuestionInput, FileInput } from '@/types/index';
import { normalizeQuestionImportPayload } from '@/lib/jsonRepair';

/**
 * API Route for bulk importing questions from a JSON structure.
 * This handles file creation, question insertion, and duplicate detection.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const normalized = normalizeQuestionImportPayload(rawBody, `Import-${new Date().toISOString().slice(0, 10)}.json`);

    // 1. Validate the normalized payload
    if (!normalized.questions || normalized.questions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid payload. At least one valid question is required.' },
        { status: 400 }
      );
    }

    // 2. Create a virtual file record for this import operation
    const fileInput: FileInput = {
      name: normalized.fileName,
      size: JSON.stringify(normalized.questions).length, // Approximate size
      fileType: 'other',
      grade: (normalized.metadata?.grade as any) || normalized.questions[0]?.grade || 12,
      section: (normalized.metadata?.section as any) || normalized.questions[0]?.section || 'علمي',
      subject: normalized.metadata?.subject || normalized.questions[0]?.subject || 'مستورد',
      examYear: normalized.metadata?.examYear || normalized.questions[0]?.examYear || new Date().getFullYear(),
      governorate: normalized.metadata?.governorate || normalized.questions[0]?.governorate || 'المركزية',
    };

    const fileRecord = await insertFile(fileInput);

    if (!fileRecord) {
      throw new Error('Failed to create a file record for the import.');
    }

    // 3. Iterate and insert each question, tracking results
    let insertedCount = 0;
    let ignoredCount = 0;

    for (const questionInput of normalized.questions) {
      const result = await insertQuestion(fileRecord.id, questionInput);
      
      if (result.status === 'inserted') {
        insertedCount++;
      } else if (result.status === 'ignored') {
        ignoredCount++;
      }
    }

    // 4. Return a success response with the import summary
    return NextResponse.json(
      {
        success: true,
        message: `Import from "${fileRecord.name}" completed.`,
        data: {
          fileId: fileRecord.id,
          fileName: fileRecord.name,
          totalQuestionsInPayload: normalized.questions.length,
          insertedCount,
          ignoredCount,
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('[API /api/import]', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ success: false, error: 'Invalid JSON format.' }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'An unknown error occurred during the import process.' },
      { status: 500 }
    );
  }
}
