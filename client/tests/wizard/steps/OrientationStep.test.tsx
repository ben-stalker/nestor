import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import OrientationStep from '../../../src/wizard/steps/OrientationStep';

vi.mock('../../../src/wizard/api', () => ({
  patchSettings: vi.fn().mockResolvedValue(undefined),
}));

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderStep(onNext = vi.fn()) {
  return render(
    <QueryClientProvider client={makeQC()}>
      <OrientationStep onNext={onNext} />
    </QueryClientProvider>,
  );
}

describe('OrientationStep', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: originalInnerWidth });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: originalInnerHeight });
  });

  it('renders both portrait and landscape options', () => {
    renderStep();
    expect(screen.getByText('Portrait')).toBeInTheDocument();
    expect(screen.getByText('Landscape')).toBeInTheDocument();
  });

  it('auto-detects landscape when window is wider than tall', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1280 });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 720 });

    renderStep();

    const landscapeBtn = screen.getByRole('button', { name: /landscape/i });
    expect(landscapeBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('auto-detects portrait when window is taller than wide', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 768 });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 1024 });

    renderStep();

    const portraitBtn = screen.getByRole('button', { name: /portrait/i });
    expect(portraitBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('allows switching from landscape to portrait', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1280 });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 720 });

    renderStep();

    const portraitBtn = screen.getByRole('button', { name: /portrait/i });
    fireEvent.click(portraitBtn);

    expect(portraitBtn).toHaveAttribute('aria-pressed', 'true');

    const landscapeBtn = screen.getByRole('button', { name: /landscape/i });
    expect(landscapeBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('allows switching from portrait to landscape', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 768 });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 1024 });

    renderStep();

    const landscapeBtn = screen.getByRole('button', { name: /landscape/i });
    fireEvent.click(landscapeBtn);

    expect(landscapeBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders a Next button', () => {
    renderStep();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('calls patchSettings with orientation on Next click', async () => {
    const { patchSettings } = await import('../../../src/wizard/api');
    const onNext = vi.fn();

    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1280 });
    Object.defineProperty(window, 'innerHeight', { writable: true, value: 720 });

    renderStep(onNext);

    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await vi.waitFor(() => {
      expect(patchSettings).toHaveBeenCalledWith({ orientation: 'landscape' });
      expect(onNext).toHaveBeenCalled();
    });
  });
});
