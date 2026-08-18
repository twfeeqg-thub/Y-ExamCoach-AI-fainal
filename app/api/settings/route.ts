import { NextRequest, NextResponse } from 'next/server';
import { UserSettings } from '@/types/index';

let userSettingsMemory: UserSettings = {
  themeColor: 'blue',
  fontSize: 'md',
  isDarkMode: false,
  autoSync: true,
  updatedAt: new Date().toISOString(),
};

export async function GET() {
  return NextResponse.json({ success: true, data: userSettingsMemory });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    userSettingsMemory = {
      ...userSettingsMemory,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    return NextResponse.json({ success: true, data: userSettingsMemory });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}
