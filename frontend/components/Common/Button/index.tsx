'use client';

import React, { forwardRef } from 'react';
import Link from 'next/link';
import { twMerge } from 'tailwind-merge';

export type ButtonType =
  | 'default'
  | 'primary'
  | 'danger'
  | 'warning'
  | 'success'
  | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  buttonType?: ButtonType;
  buttonSize?: ButtonSize;
  href?: string;
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      buttonType = 'default',
      buttonSize = 'md',
      href,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center border font-medium rounded-lg focus:outline-none transition ease-in-out duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';

    const typeStyles: Record<ButtonType, string> = {
      primary:
        'text-white border-indigo-500 bg-indigo-600 bg-opacity-80 hover:bg-opacity-100 hover:border-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900',
      danger:
        'text-white border-red-500 bg-red-600 bg-opacity-80 hover:bg-opacity-100 hover:border-red-400 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900',
      warning:
        'text-white border-yellow-500 bg-yellow-500 bg-opacity-80 hover:bg-opacity-100 hover:border-yellow-400 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-900',
      success:
        'text-white border-green-500 bg-green-500 bg-opacity-80 hover:bg-opacity-100 hover:border-green-400 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900',
      ghost:
        'text-gray-300 bg-transparent border-gray-600 hover:text-white hover:border-gray-500 hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900',
      default:
        'text-gray-200 bg-gray-800 bg-opacity-80 border-gray-600 hover:text-white hover:bg-gray-700 hover:border-gray-500 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900',
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2.5',
    };

    const classes = twMerge(
      baseStyles,
      typeStyles[buttonType],
      sizeStyles[buttonSize],
      className
    );

    if (href) {
      return (
        <Link href={href} className={classes}>
          {children}
        </Link>
      );
    }

    return (
      <button ref={ref} className={classes} disabled={disabled} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

