import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface UsernameGeneratorOptions {
  provider: string;
  model: string;
  apiKey: string;
  prompt: string;
  numUsernames: number;
}

export async function UsernameGenerator(options: UsernameGeneratorOptions): Promise<string[]> {
  const { provider, model, apiKey, prompt, numUsernames } = options;
  let usernames: string[] = [];

  try {
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
        usernames = openaiResponse.choices[0].message.content?.split('\n').filter(Boolean) || [];
        break;

      case 'anthropic':
        const anthropic = new Anthropic({ apiKey });
        const anthropicResponse = await anthropic.messages.create({
          model,
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `Generate ${numUsernames} unique usernames based on this theme or description: ${prompt}. Return only the usernames, one per line.`
            }
          ],
          temperature: 0.9,
        });
        usernames = anthropicResponse.content[0].text.split('\n').filter(Boolean);
        break;

      case 'google':
        const genAI = new GoogleGenerativeAI(apiKey);
        const googleModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const googleResponse = await googleModel.generateContent(
          `Generate ${numUsernames} unique usernames based on this theme or description: ${prompt}. Return only the usernames, one per line.`
        );
        const result = await googleResponse.response;
        usernames = result.text().split('\n').filter(Boolean);
        break;

      default:
        throw new Error('Unsupported AI provider');
    }

    // Clean up usernames
    return usernames
      .map(username => username.trim()
        .replace(/^\d+\.\s*/, '')
        .replace(/^\d+\)\s*/, '')
        .replace(/^\(\d+\)\s*/, '')
        .replace(/^\d+\s*/, '')
      )
      .filter(username => username.length > 0 && username.length <= 15)
      .slice(0, numUsernames);

  } catch (error) {
    console.error('Error generating usernames:', error);
    throw error;
  }
} 