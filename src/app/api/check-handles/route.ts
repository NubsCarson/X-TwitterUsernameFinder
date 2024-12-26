import { NextResponse } from 'next/server';
import { TwitterHandleChecker } from '@/lib/twitter';

export async function POST(request: Request) {
  try {
    const { bearer_token, usernames } = await request.json();

    if (!bearer_token || !usernames || !Array.isArray(usernames)) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const checker = new TwitterHandleChecker(bearer_token);
    const results = await checker.checkHandles(usernames);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error checking handles:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 