import { NextResponse } from 'next/server';

const DEFAULT_RPC = 'https://api.mainnet-beta.solana.com';

export async function GET() {
  try {
    const rpcEndpoint = process.env.SOLANA_RPC_ENDPOINT || DEFAULT_RPC;
    return NextResponse.json({
      rpc_endpoint: rpcEndpoint
    });
  } catch (error: unknown) {
    console.error('Error fetching config:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        rpc_endpoint: DEFAULT_RPC 
      },
      { status: 500 }
    );
  }
} 