/**
 * NextAuth.js configuration for OAuth providers
 */

import { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';

// Get API URL for server-side backend calls (NextAuth runs server-side)
// Use INTERNAL_API_URL for Docker-to-Docker communication, fallback to NEXT_PUBLIC_API_URL
function getApiUrl(): string {
  // Server-side: prefer internal Docker URL
  const internalUrl = process.env.INTERNAL_API_URL;
  if (internalUrl) return internalUrl;

  // Fallback to public URL (works for local dev outside Docker)
  const publicUrl = process.env.NEXT_PUBLIC_API_URL;
  if (publicUrl) return publicUrl;

  return 'http://localhost:8000';
}

// Build providers list dynamically based on available credentials
const providers = [];

// Only add GitHub provider if credentials are configured
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
  );
}

// Only add Google provider if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (!account || !user.email) return false;

      try {
        // Call backend to create/link user
        const response = await fetch(`${getApiUrl()}/api/v1/auth/oauth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: account.provider,
            oauth_id: account.providerAccountId,
            email: user.email,
            name: user.name || user.email.split('@')[0],
            avatar_url: user.image,
          }),
        });

        if (!response.ok) {
          console.error('OAuth backend error:', await response.text());
          return false;
        }

        const data = await response.json();
        // Store backend tokens in the user object for jwt callback
        (user as any).backendTokens = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        };
        (user as any).isNewUser = data.is_new_user;
        (user as any).backendUser = data.user;
        // For new users, store provisioned workspace and API key
        if (data.is_new_user && data.workspace && data.api_key) {
          (user as any).provisionedWorkspace = data.workspace;
          (user as any).provisionedApiKey = data.api_key;
        }

        return true;
      } catch (error) {
        console.error('OAuth signIn error:', error);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      // Initial sign in - transfer backend tokens to JWT
      if (user && (user as any).backendTokens) {
        token.accessToken = (user as any).backendTokens.accessToken;
        token.refreshToken = (user as any).backendTokens.refreshToken;
        token.isNewUser = (user as any).isNewUser;
        token.backendUser = (user as any).backendUser;
        // For new users, include provisioned resources
        if ((user as any).provisionedWorkspace) {
          token.provisionedWorkspace = (user as any).provisionedWorkspace;
        }
        if ((user as any).provisionedApiKey) {
          token.provisionedApiKey = (user as any).provisionedApiKey;
        }
      }
      return token;
    },

    async session({ session, token }) {
      // Add backend tokens to session for client-side use
      (session as any).accessToken = token.accessToken;
      (session as any).refreshToken = token.refreshToken;
      (session as any).isNewUser = token.isNewUser;
      if (token.backendUser) {
        session.user = token.backendUser as any;
      }
      // For new users, include provisioned resources for onboarding
      if (token.provisionedWorkspace) {
        (session as any).provisionedWorkspace = token.provisionedWorkspace;
      }
      if (token.provisionedApiKey) {
        (session as any).provisionedApiKey = token.provisionedApiKey;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
};

