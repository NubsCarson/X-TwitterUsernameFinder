import { NextResponse } from 'next/server';
import { UsernameGenerator, AIProvider, AIModel } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const { provider, model, api_key, prompt, count } = await request.json();

    if (!api_key || !prompt) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const generator = new UsernameGenerator(
      api_key,
      provider as AIProvider,
      model as AIModel
    );

    const usernames = await generator.generateUsernames(prompt, count || 10);

    return NextResponse.json({ usernames });
  } catch (error) {
    console.error('Error generating usernames:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 