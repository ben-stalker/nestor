import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PinPrompt from '../../src/core/PinPrompt';
import type { Profile } from '../../src/api/profiles';

vi.mock('../../src/api/client', () => ({
  default: vi.fn(),
  // eslint-disable-next-line @typescript-eslint/lines-between-class-members
  ApiError: class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'ApiError';
    }
  },
}));

vi.mock('../../src/api/profiles', async () => {
  const { ApiError } = await import('../../src/api/client');
  return { getProfiles: vi.fn(), verifyPin: vi.fn(), ApiError };
});

vi.mock('../../src/hooks/useReducedMotion', () => ({
  default: vi.fn(() => false),
}));

const { verifyPin } = await import('../../src/api/profiles');
const { ApiError } = await import('../../src/api/client');

const PROFILE: Profile = {
  id: 2,
  name: 'Bob',
  type: 'child',
  colour: '#45b7b8',
  avatar_path: null,
  pinSet: true,
  text_size: 'default',
  simplified_nav: 0,
  created_at: 2000,
};

function renderPrompt(onSuccess = vi.fn(), onClose = vi.fn()) {
  return render(<PinPrompt profile={PROFILE} onSuccess={onSuccess} onClose={onClose} />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PinPrompt — rendering', () => {
  it('renders dialog with profile name in title', () => {
    renderPrompt();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/enter pin for bob/i)).toBeInTheDocument();
  });

  it('renders numeric keypad buttons 0–9', () => {
    renderPrompt();
    '0123456789'.split('').forEach((d) => {
      expect(screen.getByRole('button', { name: d })).toBeInTheDocument();
    });
  });

  it('renders delete button', () => {
    renderPrompt();
    expect(screen.getByRole('button', { name: /delete last digit/i })).toBeInTheDocument();
  });

  it('renders 4 PIN dot indicators', () => {
    renderPrompt();
    const dots = screen.getByLabelText(/0 of 4 digits entered/i);
    expect(dots).toBeInTheDocument();
  });
});

describe('PinPrompt — digit entry', () => {
  it('fills dots as digits are pressed', () => {
    renderPrompt();
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    expect(screen.getByLabelText(/1 of 4 digits entered/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getByLabelText(/2 of 4 digits entered/i)).toBeInTheDocument();
  });

  it('deletes last digit when delete is pressed', () => {
    renderPrompt();
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    fireEvent.click(screen.getByRole('button', { name: '2' }));
    fireEvent.click(screen.getByRole('button', { name: /delete last digit/i }));
    expect(screen.getByLabelText(/1 of 4 digits entered/i)).toBeInTheDocument();
  });

  it('auto-submits when 4th digit is pressed', async () => {
    vi.mocked(verifyPin).mockResolvedValue({ valid: true });
    const onSuccess = vi.fn();
    renderPrompt(onSuccess);

    '1234'.split('').forEach((d) => {
      fireEvent.click(screen.getByRole('button', { name: d }));
    });

    await waitFor(() => expect(verifyPin).toHaveBeenCalledWith(2, '1234'));
  });
});

describe('PinPrompt — correct PIN', () => {
  it('calls onSuccess after valid PIN', async () => {
    vi.mocked(verifyPin).mockResolvedValue({ valid: true });
    const onSuccess = vi.fn();
    renderPrompt(onSuccess);

    '5678'.split('').forEach((d) => {
      fireEvent.click(screen.getByRole('button', { name: d }));
    });

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
  });
});

describe('PinPrompt — incorrect PIN', () => {
  it('shows error message on invalid PIN', async () => {
    vi.mocked(verifyPin).mockResolvedValue({ valid: false });
    renderPrompt();

    '0000'.split('').forEach((d) => {
      fireEvent.click(screen.getByRole('button', { name: d }));
    });

    await waitFor(() => expect(screen.getByText('Incorrect PIN')).toBeInTheDocument());
  });

  it('clears digits after invalid PIN', async () => {
    vi.mocked(verifyPin).mockResolvedValue({ valid: false });
    renderPrompt();

    '1111'.split('').forEach((d) => {
      fireEvent.click(screen.getByRole('button', { name: d }));
    });

    await waitFor(() =>
      expect(screen.getByLabelText(/0 of 4 digits entered/i)).toBeInTheDocument(),
    );
  });

  it('does not call onSuccess on invalid PIN', async () => {
    vi.mocked(verifyPin).mockResolvedValue({ valid: false });
    const onSuccess = vi.fn();
    renderPrompt(onSuccess);

    '9999'.split('').forEach((d) => {
      fireEvent.click(screen.getByRole('button', { name: d }));
    });

    await waitFor(() => expect(screen.getByText('Incorrect PIN')).toBeInTheDocument());
    expect(onSuccess).not.toHaveBeenCalled();
  });
});

describe('PinPrompt — 429 rate limit', () => {
  it('shows "Too many attempts" on 429 response', async () => {
    vi.mocked(verifyPin).mockRejectedValue(new ApiError(429, 'Too Many Requests'));
    renderPrompt();

    '1234'.split('').forEach((d) => {
      fireEvent.click(screen.getByRole('button', { name: d }));
    });

    await waitFor(() =>
      expect(screen.getByText('Too many attempts, try again later')).toBeInTheDocument(),
    );
  });
});

describe('PinPrompt — accessibility', () => {
  it('closes when Escape is pressed', () => {
    const onClose = vi.fn();
    renderPrompt(vi.fn(), onClose);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
