/**
 * Status badge component.
 */

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'loading';
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const colors = {
    online: 'bg-green-100 text-green-800',
    offline: 'bg-red-100 text-red-800',
    loading: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-sm ${colors[status]}`}>
      {label || status}
    </span>
  );
}

