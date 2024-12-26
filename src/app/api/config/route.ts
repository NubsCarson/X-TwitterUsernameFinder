import { NextResponse } from 'next/server';

const DEFAULT_RPC = "https://api.mainnet-beta.solana.com";

export async function GET() {
  try {
    const rpc_endpoint = process.env.SOLANA_RPC_ENDPOINT || DEFAULT_RPC;

    // Ensure RPC endpoint starts with https:// if not already present
    const endpoint = rpc_endpoint.startsWith('http')
      ? rpc_endpoint
      : `https://${rpc_endpoint}`;

    console.log('Serving RPC endpoint:', endpoint);

    return NextResponse.json({
      rpc_endpoint: endpoint
    });
  } catch (error) {
    console.error('Error getting configuration:', error);
    return NextResponse.json(
      { 
        error: error.message,
        rpc_endpoint: DEFAULT_RPC 
      },
      { status: 500 }
    );
  }
} 