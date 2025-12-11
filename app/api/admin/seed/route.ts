import { seedDatabase } from '@/actions/seed';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await seedDatabase();
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
