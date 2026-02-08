'use client';

import { Fragment } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { BoltIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useChatShortcuts } from '@/lib/chat-shortcuts';

interface ShortcutsPopupProps {
  disabled?: boolean;
}

export default function ShortcutsPopup({ disabled = false }: ShortcutsPopupProps) {
  const { shortcuts, selectShortcut, isInChatContext } = useChatShortcuts();

  // If not in chat context, show disabled state
  if (!isInChatContext || disabled) {
    return (
      <div className="flex flex-1 flex-col items-center py-3 text-xs font-medium text-gray-600 cursor-not-allowed">
        <BoltIcon className="h-6 w-6" />
        <span className="mt-1">Quick</span>
      </div>
    );
  }

  return (
    <Popover className="relative flex flex-1">
      {({ open, close }) => (
        <>
          <Popover.Button className="flex flex-1 flex-col items-center py-3 text-xs font-medium text-gray-400 active:text-gray-200 transition-colors touch-manipulation focus:outline-none">
            {open ? (
              <XMarkIcon className="h-6 w-6 text-indigo-400" />
            ) : (
              <BoltIcon className="h-6 w-6" />
            )}
            <span className={`mt-1 ${open ? 'text-indigo-400' : ''}`}>Quick</span>
          </Popover.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-4"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-4"
          >
            <Popover.Panel className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 origin-bottom rounded-lg shadow-lg ring-1 ring-gray-700 focus:outline-none overflow-hidden z-50">
              <div className="glass-effect">
                <div className="px-4 py-3 border-b border-gray-700">
                  <h3 className="text-sm font-medium text-gray-200">Quick Shortcuts</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Tap to add to chat</p>
                </div>
                <div className="py-1">
                  {shortcuts.map((shortcut) => {
                    const maxLength = 35;
                    const displayLabel = shortcut.label.length > maxLength
                      ? shortcut.label.slice(0, maxLength) + '…'
                      : shortcut.label;
                    return (
                      <button
                        key={shortcut.id}
                        onClick={() => {
                          selectShortcut(shortcut.text);
                          close();
                        }}
                        className="flex w-full items-center px-4 py-3 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors touch-manipulation"
                        title={shortcut.label}
                      >
                        <span className="font-medium">{displayLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}

