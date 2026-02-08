/**
 * API endpoint to check which OAuth providers are configured.
 * This allows the UI to conditionally show OAuth buttons.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const providers = {
    github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  };

  return NextResponse.json(providers);
}

