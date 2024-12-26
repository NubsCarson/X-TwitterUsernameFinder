import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

export async function generateUsernames(provider: string, model: string, apiKey: string, prompt: string, count: number = 5): Promise<string[]> {
  try {
    switch (provider.toLowerCase()) {
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
              content: `Generate ${count} usernames based on: ${prompt}`
            }
          ]
        });
        return openaiResponse.choices[0].message.content?.split('\n').filter(Boolean) || [];

      case 'google':
        const genAI = new GoogleGenerativeAI(apiKey);
        const model2 = genAI.getGenerativeModel({ model });
        const googleResponse = await model2.generateContent(`Generate ${count} unique and creative usernames based on: ${prompt}. Return only the usernames, one per line.`);
        return googleResponse.response.text().split('\n').filter(Boolean);

      case 'anthropic':
        const anthropic = new Anthropic({ apiKey });
        const anthropicResponse = await anthropic.messages.create({
          model,
          max_tokens: 1000,
          messages: [
            {
              role: 'assistant',
              content: 'You are a creative username generator. Generate unique, creative, and available usernames based on the given prompt. Return only the usernames, one per line.'
            },
            {
              role: 'user',
              content: `Generate ${count} usernames based on: ${prompt}`
            }
          ]
        });
        const content = anthropicResponse.content.find(block => block.type === 'text');
        return content?.text?.split('\n').filter(Boolean) || [];

      default:
        throw new Error('Invalid AI provider');
    }
  } catch (error) {
    console.error('Error generating usernames:', error);
    throw error;
  }
} 