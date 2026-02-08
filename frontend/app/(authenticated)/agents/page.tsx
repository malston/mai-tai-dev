'use client';

import { CpuChipIcon } from '@heroicons/react/24/outline';

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gradient text-3xl font-bold">Agents</h1>
        <p className="mt-2 text-gray-400">Manage your AI agents and their configurations.</p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-700 bg-gray-800 bg-opacity-50 p-16 text-center">
        <CpuChipIcon className="h-16 w-16 text-gray-600" />
        <h2 className="mt-6 text-xl font-semibold text-gray-300">Coming Soon</h2>
        <p className="mt-2 max-w-md text-gray-500">
          Agent management will allow you to configure AI agents, set their capabilities, and monitor their activity across your projects.
        </p>
      </div>
    </div>
  );
}

