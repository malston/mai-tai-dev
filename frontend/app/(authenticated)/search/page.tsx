'use client';

import { useSearchParams } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-gradient text-3xl font-bold">Search Results</h1>
        {query && (
          <p className="mt-2 text-gray-400">
            Showing results for &quot;<span className="text-gray-200">{query}</span>&quot;
          </p>
        )}
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-700 bg-gray-800 bg-opacity-50 p-16 text-center">
        <MagnifyingGlassIcon className="h-16 w-16 text-gray-600" />
        <h2 className="mt-6 text-xl font-semibold text-gray-300">Coming Soon</h2>
        <p className="mt-2 max-w-md text-gray-500">
          Search will let you find projects, channels, agents, and messages across your entire workspace.
        </p>
      </div>
    </div>
  );
}

