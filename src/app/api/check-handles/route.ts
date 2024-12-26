import { NextResponse } from 'next/server';
import { checkHandles } from '@/lib/twitter';

export async function POST(request: Request) {
  try {
    const { bearerToken, usernames } = await request.json();

    if (!bearerToken || !usernames) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const results = await checkHandles(bearerToken, usernames);
    return NextResponse.json(results);
  } catch (error: unknown) {
    console.error('Error checking handles:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
} 