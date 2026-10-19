import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    const dbPath = path.join(process.cwd(), 'data', 'db.json');
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
    return NextResponse.json({ message: 'Database reset to initial demo state' });
  } catch (err) {
    console.error('Error resetting DB:', err);
    return NextResponse.json({ error: 'Failed to reset database' }, { status: 500 });
  }
}
