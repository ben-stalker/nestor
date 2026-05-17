import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import YouTubePlayerModal from '../../src/plugins/youtubePlayer/YouTubePlayerModal';

describe('YouTubePlayerModal', () => {
  it('renders an iframe pointing at youtube-nocookie', () => {
    render(<YouTubePlayerModal videoId="abc123" onClose={vi.fn()} />);
    const iframe = screen.getByTitle(/YouTube video/i);
    expect(iframe.getAttribute('src')).toContain('youtube-nocookie.com');
    expect(iframe.getAttribute('src')).toContain('abc123');
  });

  it('close button is 64x64 and invokes onClose', () => {
    const onClose = vi.fn();
    render(<YouTubePlayerModal videoId="abc123" onClose={onClose} />);
    const closeButton = screen.getByLabelText('Close video');
    expect(closeButton.style.width).toBe('64px');
    expect(closeButton.style.height).toBe('64px');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('exposes dialog role and modal flag', () => {
    render(<YouTubePlayerModal videoId="abc" title="Hello" onClose={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe('Hello');
  });
});
