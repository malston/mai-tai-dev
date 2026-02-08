'use client';

import React, { forwardRef } from 'react';
import Link from 'next/link';
import { twMerge } from 'tailwind-merge';

export type BadgeType =
  | 'default'
  | 'primary'
  | 'danger'
  | 'warning'
  | 'success'
  | 'dark'
  | 'light';

interface BadgeProps {
  badgeType?: BadgeType;
  className?: string;
  href?: string;
  children: React.ReactNode;
}

const Badge = forwardRef<HTMLElement, BadgeProps>(
  ({ badgeType = 'default', className, href, children }, ref) => {
    const baseStyles =
      'px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full whitespace-nowrap';

    const typeStyles: Record<BadgeType, string> = {
      default:
        'bg-indigo-500/80 border border-indigo-500 text-indigo-100',
      primary:
        'bg-indigo-500/80 border border-indigo-500 text-indigo-100',
      danger:
        'bg-red-600/80 border border-red-500 text-red-100',
      warning:
        'bg-yellow-500/80 border border-yellow-500 text-yellow-100',
      success:
        'bg-green-500/80 border border-green-500 text-green-100',
      dark:
        'bg-gray-900 border border-gray-700 text-gray-400',
      light:
        'bg-gray-700 border border-gray-600 text-gray-300',
    };

    const hoverStyles: Record<BadgeType, string> = {
      default: 'hover:bg-indigo-500',
      primary: 'hover:bg-indigo-500',
      danger: 'hover:bg-red-500',
      warning: 'hover:bg-yellow-500',
      success: 'hover:bg-green-500',
      dark: 'hover:bg-gray-800',
      light: 'hover:bg-gray-600',
    };

    const classes = twMerge(
      baseStyles,
      typeStyles[badgeType],
      href && `transition cursor-pointer ${hoverStyles[badgeType]}`,
      !href && 'cursor-default',
      className
    );

    // External link
    if (href?.includes('://')) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
          ref={ref as React.Ref<HTMLAnchorElement>}
        >
          {children}
        </a>
      );
    }

    // Internal link
    if (href) {
      return (
        <Link
          href={href}
          className={classes}
          ref={ref as React.Ref<HTMLAnchorElement>}
        >
          {children}
        </Link>
      );
    }

    // Plain badge
    return (
      <span className={classes} ref={ref as React.Ref<HTMLSpanElement>}>
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;

