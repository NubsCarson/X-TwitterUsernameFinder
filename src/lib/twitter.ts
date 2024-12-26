import { TwitterApi } from 'twitter-api-v2';

interface TwitterResponse {
  data?: {
    id: string;
    name: string;
    username: string;
  }[];
  errors?: {
    detail: string;
    title: string;
    type: string;
  }[];
}

interface HandleStatus {
  username: string;
  status: 'available' | 'taken' | 'suspended' | 'error';
  error?: string;
}

export async function checkHandles(bearerToken: string, usernames: string[]): Promise<HandleStatus[]> {
  const results: HandleStatus[] = [];
  const uniqueUsernames = [...new Set(usernames)];

  for (const username of uniqueUsernames) {
    try {
      const response = await fetch(
        `https://api.twitter.com/2/users/by/username/${username}`,
        {
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          results.push({ username, status: 'available' });
          continue;
        }

        if (response.status === 403) {
          results.push({ username, status: 'suspended' });
          continue;
        }

        throw new Error(`Twitter API error: ${response.status}`);
      }

      const data: TwitterResponse = await response.json();

      if (data.errors) {
        const error = data.errors[0];
        if (error.type === 'not_found') {
          results.push({ username, status: 'available' });
        } else if (error.type === 'suspended') {
          results.push({ username, status: 'suspended' });
        } else {
          results.push({ 
            username, 
            status: 'error',
            error: error.detail || error.title 
          });
        }
      } else if (data.data && data.data.length > 0) {
        results.push({ username, status: 'taken' });
      } else {
        results.push({ username, status: 'available' });
      }
    } catch (error) {
      results.push({ 
        username, 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
} 