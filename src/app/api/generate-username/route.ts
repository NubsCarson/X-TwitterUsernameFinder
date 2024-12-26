import { NextResponse } from 'next/server';
import { generateUsernames } from '@/lib';

export async function POST(request: Request) {
  try {
    const { provider, model, apiKey, prompt, count } = await request.json();

    if (!provider || !model || !apiKey || !prompt || !count) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const usernames = await generateUsernames(provider, model, apiKey, prompt, count);

    return NextResponse.json({ usernames });
  } catch (error) {
    console.error('Error generating usernames:', error);
    return NextResponse.json(
      { error: 'Failed to generate usernames' },
      { status: 500 }
    );
  }
} 