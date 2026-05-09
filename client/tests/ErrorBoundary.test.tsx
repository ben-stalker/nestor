import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from '../src/components/ErrorBoundary';

// Silence expected console.error output from React during error boundary tests
const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test render error');
  return <div>OK</div>;
}

beforeEach(() => {
  consoleError.mockClear();
});

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('shows recovery card when a child throws', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('resets error state when Try again is clicked', () => {
    let shouldThrow = true;
    function Controlled() {
      if (shouldThrow) throw new Error('Test error');
      return <div>OK</div>;
    }

    render(
      <ErrorBoundary>
        <Controlled />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();

    // Stop throwing before the reset re-render
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.getByText('OK')).toBeInTheDocument();
  });
});
