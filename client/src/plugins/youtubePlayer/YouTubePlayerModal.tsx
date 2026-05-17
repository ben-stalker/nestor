import { X } from 'lucide-react';

interface Props {
  videoId: string;
  title?: string;
  onClose: () => void;
}

export default function YouTubePlayerModal({ videoId, title, onClose }: Props) {
  const src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0&modestbranding=1`;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title ?? 'YouTube video'}
      className="fixed inset-0 z-50 flex flex-col bg-black"
      data-testid="youtube-player-modal"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close video"
        className="absolute right-4 top-4 z-10 flex items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
        style={{ width: 64, height: 64 }}
      >
        <X size={36} />
      </button>
      <iframe
        title={title ?? 'YouTube video player'}
        src={src}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}
