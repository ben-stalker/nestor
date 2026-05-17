import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MicIndicator from '../../src/voice/MicIndicator';

vi.mock('../../src/hooks/useWebSocket', () => ({
  useWebSocket: vi.fn(() => ({ lastMessage: null, readyState: 1, send: vi.fn() })),
}));

vi.mock('../../src/voice/api', () => ({
  getVoiceStatus: vi.fn(),
}));

const { getVoiceStatus } = await import('../../src/voice/api');
const mockGetVoiceStatus = getVoiceStatus as ReturnType<typeof vi.fn>;

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderMic(qc: QueryClient) {
  return render(
    <QueryClientProvider client={qc}>
      <MicIndicator />
    </QueryClientProvider>,
  );
}

describe('MicIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when voice is offline', () => {
    mockGetVoiceStatus.mockResolvedValue({ online: false, status: 'offline' });
    const qc = makeQC();
    const { container } = renderMic(qc);
    // While loading, nothing is shown (online defaults to false)
    expect(container.firstChild).toBeNull();
  });

  it('renders mic icon when voice is idle and online', () => {
    mockGetVoiceStatus.mockResolvedValue({ online: true, status: 'idle' });
    const qc = makeQC();

    // Pre-populate cache to avoid async wait
    qc.setQueryData(['voice-status'], { online: true, status: 'idle' });

    renderMic(qc);
    expect(screen.getByLabelText('Voice idle')).toBeTruthy();
  });

  it('renders listening state with label', () => {
    mockGetVoiceStatus.mockResolvedValue({ online: true, status: 'listening' });
    const qc = makeQC();
    qc.setQueryData(['voice-status'], { online: true, status: 'listening' });

    renderMic(qc);
    expect(screen.getByLabelText('Listening…')).toBeTruthy();
    expect(screen.getByText('Listening…')).toBeTruthy();
  });

  it('renders processing state', () => {
    const qc = makeQC();
    qc.setQueryData(['voice-status'], { online: true, status: 'processing' });

    renderMic(qc);
    expect(screen.getByLabelText('Processing…')).toBeTruthy();
  });

  it('renders speaking state', () => {
    const qc = makeQC();
    qc.setQueryData(['voice-status'], { online: true, status: 'speaking' });

    renderMic(qc);
    expect(screen.getByLabelText('Speaking…')).toBeTruthy();
  });
});
