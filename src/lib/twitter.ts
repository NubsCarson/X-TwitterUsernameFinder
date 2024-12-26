import { TwitterApi } from 'twitter-api-v2';

export class TwitterHandleChecker {
  private client: TwitterApi;
  private rateLimit: number;
  private requestsMade: number;
  private resetTime: Date;

  constructor(bearerToken: string) {
    this.client = new TwitterApi(bearerToken);
    this.rateLimit = 50;
    this.requestsMade = 0;
    this.resetTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
  }

  private async waitWithCountdown(seconds: number, onProgress?: (remaining: number) => void) {
    const startTime = Date.now();
    while (Date.now() - startTime < seconds * 1000) {
      const remaining = seconds - Math.floor((Date.now() - startTime) / 1000);
      if (onProgress) {
        onProgress(remaining);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async checkHandle(handle: string): Promise<{ handle: string; available?: boolean; error?: string }> {
    if (this.requestsMade >= this.rateLimit) {
      const waitTime = Math.max(0, (this.resetTime.getTime() - Date.now()) / 1000);
      if (waitTime > 0) {
        await this.waitWithCountdown(waitTime);
        this.requestsMade = 0;
        this.resetTime = new Date(Date.now() + 15 * 60 * 1000);
      }
    }

    try {
      const response = await this.client.v2.userByUsername(handle);
      this.requestsMade++;
      return { handle, available: !response.data };
    } catch (error) {
      if (error.code === 429) {
        // Rate limit hit
        const resetTime = error.rateLimit?.reset;
        if (resetTime) {
          const waitTime = Math.max(0, resetTime - Math.floor(Date.now() / 1000));
          await this.waitWithCountdown(waitTime);
        }
        return this.checkHandle(handle);
      }
      return { handle, error: error.message };
    }
  }

  async checkHandles(usernames: string[], onProgress?: (progress: number, result: any) => void): Promise<Array<{ handle: string; available?: boolean; error?: string }>> {
    const results: Array<{ handle: string; available?: boolean; error?: string }> = [];
    const total = usernames.length;
    let checked = 0;

    for (const username of usernames) {
      const result = await this.checkHandle(username);
      results.push(result);
      checked++;
      if (onProgress) {
        onProgress((checked / total) * 100, result);
      }
    }

    return results;
  }
} 