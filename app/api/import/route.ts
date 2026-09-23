
import { NextRequest, NextResponse } from 'next/server';
import { insertFile, insertQuestion } from '@/lib/db';
import { QuestionInput, FileInput } from '@/types/index';

// Define the structure of the incoming JSON payload for validation
interface ImportPayload {
  fileName: string;
  questions: QuestionInput[];
  metadata?: Partial<{
    grade: '9' | '12';
    section: 'علمي' | 'أدبي' | 'تجاري' | 'شرعي' | 'أساسي';
    subject: string;
    examYear: number;
    governorate: string;
  }>;
}

/**
 * API Route for bulk importing questions from a JSON structure.
 * This handles file creation, question insertion, and duplicate detection.
 */
export async function POST(request: NextRequest) {
  try {
    const body: ImportPayload = await request.json();

    // 1. Validate the incoming payload
    if (!body.fileName || !Array.isArray(body.questions) || body.questions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid payload. "fileName" and a non-empty "questions" array are required.' },
        { status: 400 }
      );
    }

    // 2. Create a virtual file record for this import operation
    const fileInput: FileInput = {
      name: body.fileName,
      size: JSON.stringify(body.questions).length, // Approximate size
      fileType: 'other',
      grade: body.metadata?.grade || '12',
      section: body.metadata?.section || 'علمي',
      subject: body.metadata?.subject || 'مستورد',
      examYear: body.metadata?.examYear || new Date().getFullYear(),
      governorate: body.metadata?.governorate || 'المركزية',
    };

    const fileRecord = await insertFile(fileInput);


    if (!fileRecord) {
      throw new Error('Failed to create a file record for the import.');
    }
    
    // Add extractedQuestionsCount to the fileRecord after insertion if needed by business logic
    // For now, we assume the DB handles the final state.

    // 3. Iterate and insert each question, tracking results
    let insertedCount = 0;
    let ignoredCount = 0;

    for (const questionInput of body.questions) {
      // The insertQuestion function from db.ts already handles the logic for
      // sanitization, hashing, and duplicate checking (ON CONFLICT... DO NOTHING).
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
        message: `Import from "${body.fileName}" completed.`,
        data: {
          fileId: fileRecord.id,
          fileName: fileRecord.name,
          totalQuestionsInPayload: body.questions.length,
          insertedCount,
          ignoredCount,
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('[API /api/import]', error);
    // Handle potential JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json({ success: false, error: 'Invalid JSON format.' }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: error.message || 'An unknown error occurred during the import process.' },
      { status: 500 }
    );
  }
}
