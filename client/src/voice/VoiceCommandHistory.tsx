import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { getVoiceCommands, clearVoiceCommands, type VoiceCommand } from './api';
import Button from '../shared/ui/Button';
import EmptyState from '../shared/ui/EmptyState';

const VOICE_COMMANDS_KEY = ['admin', 'voice-commands'] as const;

function formatTs(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function CommandRow({ cmd }: { cmd: VoiceCommand }) {
  const [expanded, setExpanded] = useState(false);
  const matched = cmd.matched_handler != null;

  return (
    <div className={`voice-cmd-row ${matched ? 'voice-cmd-row--matched' : 'voice-cmd-row--unmatched'}`}>
      <button
        type="button"
        className="voice-cmd-row__header"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span className="voice-cmd-row__ts">{formatTs(cmd.created_at)}</span>
        <span className="voice-cmd-row__transcript">{cmd.transcript}</span>
        <span className={`voice-cmd-row__badge ${matched ? 'voice-cmd-row__badge--match' : 'voice-cmd-row__badge--miss'}`}>
          {matched ? cmd.matched_handler : 'unmatched'}
        </span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {expanded && (
        <div className="voice-cmd-row__detail">
          {cmd.response && (
            <p className="voice-cmd-row__response">
              Response: <em>{cmd.response}</em>
            </p>
          )}
          {cmd.duration_ms != null && (
            <p className="voice-cmd-row__latency">Latency: {cmd.duration_ms} ms</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function VoiceCommandHistory() {
  const { data: commands = [], isLoading } = useQuery<VoiceCommand[]>({
    queryKey: VOICE_COMMANDS_KEY,
    queryFn: () => getVoiceCommands(100),
    staleTime: 30_000,
  });

  const qc = useQueryClient();
  const { mutate: clearAll, isPending } = useMutation({
    mutationFn: clearVoiceCommands,
    onSuccess: () => qc.invalidateQueries({ queryKey: VOICE_COMMANDS_KEY }),
  });

  if (isLoading) {
    return <p className="text-secondary text-body">Loading…</p>;
  }

  return (
    <div className="voice-history">
      <div className="voice-history__header">
        <h3 className="voice-history__title">Voice Command Log</h3>
        {commands.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearAll()}
            disabled={isPending}
            aria-label="Clear voice command log"
          >
            <Trash2 size={14} />
            Clear
          </Button>
        )}
      </div>

      {commands.length === 0 ? (
        <EmptyState heading="No voice commands recorded yet." />
      ) : (
        <div className="voice-history__list">
          {commands.map((cmd) => (
            <CommandRow key={cmd.id} cmd={cmd} />
          ))}
        </div>
      )}
    </div>
  );
}
