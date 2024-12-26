import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  try {
    const { provider, model, apiKey, prompt, numUsernames } = await request.json();

    if (!provider || !model || !apiKey || !prompt || !numUsernames) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    let generatedUsernames: string[] = [];

    switch (provider) {
      case 'openai':
        const openai = new OpenAI({ apiKey });
        const openaiResponse = await openai.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a creative username generator. Generate unique, creative, and available usernames based on the given prompt. Return only the usernames, one per line.'
            },
            {
              role: 'user',
              content: `Generate ${numUsernames} unique usernames based on this theme or description: ${prompt}`
            }
          ],
          temperature: 0.9,
        });
        generatedUsernames = openaiResponse.choices[0].message.content?.split('\n').filter(Boolean) || [];
        break;

      case 'anthropic':
        const anthropic = new Anthropic({ apiKey });
        const anthropicResponse = await anthropic.messages.create({
          model,
          max_tokens: 1000,
          system: 'You are a creative username generator. Generate unique, creative, and available usernames based on the given prompt. Return only the usernames, one per line.',
          messages: [{
            role: 'user',
            content: `Generate ${numUsernames} unique usernames based on this theme or description: ${prompt}. Return only the usernames, one per line.`
          }]
        });
        generatedUsernames = anthropicResponse.content[0].text.split('\n').filter(Boolean);
        break;

      case 'google':
        const genAI = new GoogleGenerativeAI(apiKey);
        const googleModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const googleResponse = await googleModel.generateContent(
          `Generate ${numUsernames} unique usernames based on this theme or description: ${prompt}. Return only the usernames, one per line.`
        );
        const result = await googleResponse.response;
        generatedUsernames = result.text().split('\n').filter(Boolean);
        break;

      default:
        return NextResponse.json({ error: 'Unsupported AI provider' }, { status: 400 });
    }

    // Clean up usernames
    generatedUsernames = generatedUsernames
      .map(username => username.trim()
        .replace(/^\d+\.\s*/, '')
        .replace(/^\d+\)\s*/, '')
        .replace(/^\(\d+\)\s*/, '')
        .replace(/^\d+\s*/, '')
      )
      .filter(username => username.length > 0 && username.length <= 15)
      .slice(0, numUsernames);

    return NextResponse.json({ usernames: generatedUsernames });
  } catch (error: unknown) {
    console.error('Error generating usernames:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
} 