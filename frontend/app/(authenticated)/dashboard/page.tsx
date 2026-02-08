'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import {
  getWorkspaces,
  createWorkspace,
  getDashboardStats,
  getDailyActivity,
  getBusiestWorkspaces,
  Workspace,
  DashboardStats,
  DailyActivityItem,
  WorkspaceActivityItem,
  ApiError,
} from '@/lib/api';
import {
  RocketLaunchIcon,
  ChatBubbleLeftRightIcon,
  FolderIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import WorkspaceCard from '@/components/WorkspaceCard';
import Modal from '@/components/Common/Modal';
import Button from '@/components/Common/Button';
import { ActivityHeatmap } from '@/components/ui/calendar-heatmap';

export default function DashboardPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<DailyActivityItem[]>([]);
  const [busiestWorkspaces, setBusiestWorkspaces] = useState<WorkspaceActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      setIsLoading(true);
      Promise.all([
        getWorkspaces(token, { archived: false }),
        getDashboardStats(token),
        getDailyActivity(token, 90),
        getBusiestWorkspaces(token, 6),
      ])
        .then(([workspacesRes, statsRes, activityRes, busiestRes]) => {
          setWorkspaces(workspacesRes.workspaces);
          setStats(statsRes);
          setActivity(activityRes.activity);
          setBusiestWorkspaces(busiestRes.workspaces);
        })
        .finally(() => setIsLoading(false));
    }
  }, [token]);

  // Convert activity data for heatmap
  const heatmapData = activity.map((item) => ({
    date: item.date,
    count: item.count,
  }));

  const handleCreateWorkspace = async () => {
    if (!token || !newWorkspaceName.trim()) return;
    setIsCreating(true);

    try {
      // Create the workspace (no API key creation - user already has a user-level key)
      const workspace = await createWorkspace(token, newWorkspaceName.trim());

      // Store workspace ID for the workspace settings page
      // Note: User already has an API key from registration, they just need the workspace ID
      sessionStorage.setItem('mai-tai-new-workspace', JSON.stringify({
        workspaceId: workspace.id,
        workspaceName: workspace.name,
      }));

      setNewWorkspaceName('');
      setIsDialogOpen(false);

      // Navigate to the workspace with new=true to show the setup card
      router.push(`/workspaces/${workspace.id}?new=true`);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to create workspace',
        description: error instanceof ApiError ? error.message : 'Please try again',
      });
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* New Workspace Modal */}
      <Modal
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Create a new workspace"
        subTitle="Each workspace is a chat room where you and your AI agents collaborate."
        onOk={handleCreateWorkspace}
        okText={isCreating ? 'Creating...' : 'Create Workspace'}
        okDisabled={!newWorkspaceName.trim()}
        okLoading={isCreating}
        cancelText="Cancel"
        size="sm"
      >
        <div className="py-2">
          <input
            type="text"
            placeholder="Workspace name"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isCreating && newWorkspaceName.trim() && handleCreateWorkspace()}
            autoFocus
            className="w-full rounded-lg border border-gray-600 bg-gray-700/80 px-4 py-3 text-white placeholder-gray-400 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </Modal>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-6">
          {/* Stats skeleton */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={`stat-skeleton-${i}`} className="h-24 animate-pulse rounded-xl bg-gray-800" />
            ))}
          </div>
          {/* Heatmap skeleton */}
          <div className="h-48 animate-pulse rounded-xl bg-gray-800" />
          {/* Projects skeleton */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {[...Array(6)].map((_, i) => (
              <div key={`project-skeleton-${i}`} className="aspect-[4/3] animate-pulse rounded-xl bg-gray-800" />
            ))}
          </div>
        </div>
      )}

      {/* Welcome banner for new users */}
      {!isLoading && workspaces.length === 0 && (
        <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-8">
          <div className="flex flex-col items-center text-center md:flex-row md:text-left md:items-start md:gap-6">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/20 md:mb-0">
              <RocketLaunchIcon className="h-8 w-8 text-indigo-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">🍹 Welcome to Mai-Tai!</h3>
              <p className="mt-2 text-gray-300">
                Connect your AI coding agent and chat in real-time.
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Each workspace is a chat room for you and your AI agent — create one for each codebase.
              </p>
              <div className="mt-4">
                <Button buttonType="primary" onClick={() => setIsDialogOpen(true)}>
                  <RocketLaunchIcon className="mr-2 h-5 w-5" />
                  Create Your First Workspace
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard content */}
      {!isLoading && workspaces.length > 0 && (
        <>
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white lg:text-3xl">Dashboard</h1>
              <p className="mt-1 text-gray-400">Your activity overview</p>
            </div>
            <Button buttonType="primary" onClick={() => setIsDialogOpen(true)}>
              <RocketLaunchIcon className="mr-2 h-5 w-5" />
              Add Workspace
            </Button>
          </div>

          {/* Stats Row */}
          {stats && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatCard
                icon={<ChatBubbleLeftRightIcon className="h-6 w-6" />}
                label="Total Messages"
                value={stats.total_messages.toLocaleString()}
                color="indigo"
              />
              <StatCard
                icon={<ArrowTrendingUpIcon className="h-6 w-6" />}
                label="This Week"
                value={stats.messages_this_week.toLocaleString()}
                color="purple"
              />
              <StatCard
                icon={<FolderIcon className="h-6 w-6" />}
                label="Active Workspaces"
                value={(stats.active_workspaces ?? 0).toString()}
                color="blue"
              />
              <StatCard
                icon={<CalendarDaysIcon className="h-6 w-6" />}
                label="Total Workspaces"
                value={(stats.total_workspaces ?? 0).toString()}
                color="gray"
              />
            </div>
          )}

          {/* Activity Heatmap */}
          <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
            <h2 className="mb-3 text-lg font-semibold text-white">Activity</h2>
            <ActivityHeatmap data={heatmapData} />
          </div>

          {/* Busiest Workspaces */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Most Active Workspaces</h2>
              <Link
                href="/workspaces"
                className="text-sm text-indigo-400 hover:text-indigo-300 transition"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {busiestWorkspaces.map((workspace, index) => (
                <WorkspaceCard
                  key={workspace.id}
                  id={workspace.id}
                  name={workspace.name}
                  createdAt={workspace.last_activity || ''}
                  colorIndex={index}
                  badge={workspace.message_count > 0 ? `${workspace.message_count} msgs` : undefined}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Stat card component
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'indigo' | 'purple' | 'blue' | 'gray';
}) {
  const colorClasses = {
    indigo: 'bg-indigo-500/20 text-indigo-400',
    purple: 'bg-purple-500/20 text-purple-400',
    blue: 'bg-blue-500/20 text-blue-400',
    gray: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-4">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${colorClasses[color]}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-sm text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

