/**
 * Shared TypeScript types for mai-tai frontend.
 */

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Legacy alias
export type Project = Workspace;

export interface Agent {
  id: string;
  name: string;
  type: 'pm' | 'qa' | 'coordinator';
  status: 'active' | 'inactive';
}

export interface Message {
  id: string;
  workspaceId: string;
  agentName: string | null;
  userId: string | null;
  content: string;
  createdAt: string;
}

