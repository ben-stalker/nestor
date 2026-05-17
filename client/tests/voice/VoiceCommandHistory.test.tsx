import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import VoiceCommandHistory from '../../src/voice/VoiceCommandHistory';
import type { VoiceCommand } from '../../src/voice/api';

vi.mock('../../src/voice/api', () => ({
  getVoiceCommands: vi.fn(),
  clearVoiceCommands: vi.fn(),
}));

const { getVoiceCommands, clearVoiceCommands } = await import('../../src/voice/api');
const mockGet = getVoiceCommands as ReturnType<typeof vi.fn>;
const mockClear = clearVoiceCommands as ReturnType<typeof vi.fn>;

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

const SAMPLE_COMMANDS: VoiceCommand[] = [
  {
    id: 1,
    created_at: 1716000000,
    transcript: 'go to calendar',
    matched_handler: 'nav:goto:calendar',
    response: null,
    duration_ms: 120,
  },
  {
    id: 2,
    created_at: 1716000060,
    transcript: 'what time is it',
    matched_handler: 'builtin:time',
    response: '10:30',
    duration_ms: 50,
  },
  {
    id: 3,
    created_at: 1716000120,
    transcript: 'set a timer',
    matched_handler: null,
    response: null,
    duration_ms: null,
  },
];

function renderHistory(qc: QueryClient) {
  return render(
    <QueryClientProvider client={qc}>
      <VoiceCommandHistory />
    </QueryClientProvider>,
  );
}

describe('VoiceCommandHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty state when no commands', () => {
    mockGet.mockResolvedValue([]);
    const qc = makeQC();
    qc.setQueryData(['admin', 'voice-commands'], []);
    renderHistory(qc);
    expect(screen.getByText(/no voice commands recorded yet/i)).toBeTruthy();
  });

  it('renders command rows', () => {
    const qc = makeQC();
    qc.setQueryData(['admin', 'voice-commands'], SAMPLE_COMMANDS);
    renderHistory(qc);
    expect(screen.getByText('go to calendar')).toBeTruthy();
    expect(screen.getByText('what time is it')).toBeTruthy();
    expect(screen.getByText('set a timer')).toBeTruthy();
  });

  it('shows matched handler badge', () => {
    const qc = makeQC();
    qc.setQueryData(['admin', 'voice-commands'], SAMPLE_COMMANDS);
    renderHistory(qc);
    expect(screen.getByText('nav:goto:calendar')).toBeTruthy();
    expect(screen.getByText('unmatched')).toBeTruthy();
  });

  it('shows Clear button when commands exist', () => {
    const qc = makeQC();
    qc.setQueryData(['admin', 'voice-commands'], SAMPLE_COMMANDS);
    renderHistory(qc);
    expect(screen.getByLabelText('Clear voice command log')).toBeTruthy();
  });

  it('does not show Clear button when empty', () => {
    const qc = makeQC();
    qc.setQueryData(['admin', 'voice-commands'], []);
    renderHistory(qc);
    expect(screen.queryByLabelText('Clear voice command log')).toBeNull();
  });

  it('calls clearVoiceCommands on clear button click', async () => {
    mockClear.mockResolvedValue(undefined);
    const qc = makeQC();
    qc.setQueryData(['admin', 'voice-commands'], SAMPLE_COMMANDS);
    renderHistory(qc);

    fireEvent.click(screen.getByLabelText('Clear voice command log'));
    await waitFor(() => expect(mockClear).toHaveBeenCalledTimes(1));
  });

  it('expands row detail on click', () => {
    const qc = makeQC();
    qc.setQueryData(['admin', 'voice-commands'], SAMPLE_COMMANDS);
    renderHistory(qc);

    const timeRow = screen.getByText('what time is it').closest('button');
    expect(timeRow).toBeTruthy();
    fireEvent.click(timeRow!);

    expect(screen.getByText(/10:30/)).toBeTruthy();
    expect(screen.getByText(/50 ms/)).toBeTruthy();
  });
});
