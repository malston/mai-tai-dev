'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { submitFeedback } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';

interface FeedbackModalProps {
  trigger?: React.ReactNode;
}

export function FeedbackModal({ trigger }: FeedbackModalProps) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !subject.trim() || !message.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await submitFeedback(token, subject.trim(), message.trim());
      setSuccess(true);
      setSubject('');
      setMessage('');
      // Close after showing success briefly
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when closing
      setSubject('');
      setMessage('');
      setError(null);
      setSuccess(false);
    }
  };

  const defaultTrigger = (
    <button
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-700/50 hover:text-white"
      title="Send Feedback"
    >
      <ChatBubbleLeftEllipsisIcon className="h-5 w-5" />
      <span className="hidden sm:inline">Feedback</span>
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="border-gray-700 bg-gray-800 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Send Feedback</DialogTitle>
          <DialogDescription className="text-gray-400">
            We read every piece of feedback. Let us know how we can improve!
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
              <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-medium text-white">Thanks for your feedback!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-gray-300">
                Subject
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What's this about?"
                className="border-gray-600 bg-gray-700 text-white placeholder:text-gray-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-gray-300">
                Message
              </Label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us more..."
                rows={4}
                className="w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                required
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !subject.trim() || !message.trim()}
                className="bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Feedback'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

