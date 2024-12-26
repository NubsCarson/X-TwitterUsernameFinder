declare namespace NodeJS {
  interface ProcessEnv {
    MONGODB_URI: string;
    SOLANA_RPC_ENDPOINT: string;
    FLASK_SECRET_KEY: string;
    BEARER_TOKEN: string;
    OPENAI_API_KEY: string;
    ANTHROPIC_API_KEY: string;
    GEMINI_API_KEY: string;
  }
} 