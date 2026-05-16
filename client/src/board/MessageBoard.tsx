import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { EmptyState, Button } from '../shared/ui';
import {
  useMessages,
  useCreateMessage,
  useUpdateMessage,
  useArchiveMessage,
} from './hooks';
import type { BoardMessage } from './types';
import { useWebSocket } from '../hooks/useWebSocket';

const PROFILE_COLOURS = [
  '#f87171', '#fb923c', '#fbbf24', '#a3e635',
  '#34d399', '#22d3ee', '#818cf8', '#c084fc',
];

function colourForProfile(id: number | null): string {
  if (id === null) return '#94a3b8';
  return PROFILE_COLOURS[id % PROFILE_COLOURS.length];
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

interface ComposeProps {
  onClose: () => void;
}

function ComposeModal({ onClose }: ComposeProps) {
  const [content, setContent] = useState('');
  const [pinned, setPinned] = useState(false);
  const create = useCreateMessage();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    create.mutate(
      { content: content.trim(), pinned },
      { onSuccess: onClose },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-surface w-full max-w-lg rounded-card shadow-xl p-6 space-y-4">
        <h2 className="text-h2 font-semibold text-primary">New Message</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="w-full rounded-lg border border-surface-elev bg-background p-3 text-body text-primary resize-none focus:outline-none focus:ring-2 focus:ring-accent"
            rows={4}
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={2000}
            autoFocus
          />
          <label className="flex items-center gap-2 text-body text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="accent-accent"
            />
            Pin to top
          </label>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!content.trim() || create.isPending}>
              {create.isPending ? 'Posting…' : 'Post'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface MessageCardProps {
  message: BoardMessage;
}

function MessageCard({ message }: MessageCardProps) {
  const update = useUpdateMessage();
  const archive = useArchiveMessage();
  const colour = colourForProfile(message.profile_id);

  return (
    <div
      className="relative rounded-card p-4 shadow-sm"
      style={{ backgroundColor: `${colour}20`, borderLeft: `4px solid ${colour}` }}
      data-testid="message-card"
    >
      {message.pinned && (
        <span className="absolute top-2 right-2 text-caption font-bold text-accent">📌</span>
      )}
      <p className="text-body text-primary whitespace-pre-wrap">{message.content}</p>
      <p className="mt-2 text-caption text-secondary">{timeAgo(message.created_at)}</p>
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={() => update.mutate({ id: message.id, patch: { pinned: !message.pinned } })}
          className="text-caption text-secondary hover:text-primary transition-colors"
        >
          {message.pinned ? 'Unpin' : 'Pin'}
        </button>
        <button
          type="button"
          onClick={() => archive.mutate(message.id)}
          className="text-caption text-secondary hover:text-primary transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default function MessageBoard() {
  const { data: messages = [], isLoading } = useMessages();
  const [composing, setComposing] = useState(false);
  const qc = useQueryClient();
  const { lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage?.event === 'board:message_new') {
      void qc.invalidateQueries({ queryKey: ['board', 'messages'] });
    }
  }, [lastMessage, qc]);

  if (isLoading) {
    return <p className="text-secondary text-body p-4">Loading messages…</p>;
  }

  const pinned = messages.filter((m) => m.pinned);
  const unpinned = messages.filter((m) => !m.pinned);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-semibold text-primary">Message Board</h2>
        <Button onClick={() => setComposing(true)}>+ Post</Button>
      </div>

      {messages.length === 0 && (
        <EmptyState
          heading="No messages yet"
          body="Post a quick note for your household."
        />
      )}

      {pinned.length > 0 && (
        <section>
          <h3 className="text-caption font-semibold text-secondary uppercase tracking-wide mb-2">
            Pinned
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {pinned.map((m) => (
              <MessageCard key={m.id} message={m} />
            ))}
          </div>
        </section>
      )}

      {unpinned.length > 0 && (
        <section>
          {pinned.length > 0 && (
            <h3 className="text-caption font-semibold text-secondary uppercase tracking-wide mb-2">
              Recent
            </h3>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {unpinned.map((m) => (
              <MessageCard key={m.id} message={m} />
            ))}
          </div>
        </section>
      )}

      {composing && <ComposeModal onClose={() => setComposing(false)} />}
    </div>
  );
}
