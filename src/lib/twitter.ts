import { TwitterApi } from 'twitter-api-v2';

export interface HandleStatus {
  username: string;
  available: boolean;
  error?: string;
}

interface TwitterError {
  code?: number;
  message: string;
}

export async function checkHandle(bearerToken: string, username: string): Promise<HandleStatus> {
  try {
    const client = new TwitterApi(bearerToken);
    const user = await client.v2.userByUsername(username);

    return {
      username,
      available: !user.data,
    };
  } catch (error) {
    const twitterError = error as TwitterError;
    if (twitterError.code === 50) {
      // User not found error means the username is available
      return {
        username,
        available: true,
      };
    }

    return {
      username,
      available: false,
      error: twitterError.message,
    };
  }
}

export async function checkHandles(bearerToken: string, usernames: string[]): Promise<HandleStatus[]> {
  const results: HandleStatus[] = [];
  const uniqueUsernames = Array.from(new Set(usernames));

  for (const username of uniqueUsernames) {
    try {
      const result = await checkHandle(bearerToken, username);
      results.push(result);
    } catch (error) {
      const twitterError = error as TwitterError;
      results.push({
        username,
        available: false,
        error: twitterError.message,
      });
    }
  }

  return results;
} 