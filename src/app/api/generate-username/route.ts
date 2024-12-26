import { NextResponse } from 'next/server';
import { UsernameGenerator } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const { provider, model, apiKey, prompt, numUsernames } = await request.json();

    const usernames = await UsernameGenerator({
      provider,
      model,
      apiKey,
      prompt,
      numUsernames
    });

    return NextResponse.json({ usernames });
  } catch (error) {
    console.error('Error generating usernames:', error);
    return NextResponse.json(
      { error: 'Failed to generate usernames' },
      { status: 500 }
    );
  }
} 