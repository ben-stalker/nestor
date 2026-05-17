import { useMemo, useState } from 'react';
import { usePluginSettings } from '../hooks/usePlugins';
import { useActiveProfile } from '../../core/hooks/useActiveProfile';
import YouTubePlayerModal from './YouTubePlayerModal';

interface Tile {
  videoId: string;
  title: string;
  thumbnailUrl?: string | null;
}

function parseTiles(raw: string | undefined): Tile[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    const items = arr as { videoId?: unknown; title?: unknown; thumbnailUrl?: unknown }[];
    return items
      .filter((t) => typeof t.videoId === 'string')
      .map((t) => ({
        videoId: t.videoId as string,
        title: typeof t.title === 'string' ? t.title : 'Untitled',
        thumbnailUrl: typeof t.thumbnailUrl === 'string' ? t.thumbnailUrl : null,
      }));
  } catch {
    return [];
  }
}

function parseAllowedProfiles(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[\n,]+/)
    .map((s: string) => s.trim())
    .filter(Boolean);
}

export default function YouTubeBrowsePage() {
  const { data: settings } = usePluginSettings('youtube-player');
  const profile = useActiveProfile();
  const [playing, setPlaying] = useState<Tile | null>(null);

  const tiles = useMemo(() => parseTiles(settings?.curated_tiles), [settings?.curated_tiles]);
  const allowedProfiles = useMemo(
    () => parseAllowedProfiles(settings?.allowed_profiles),
    [settings?.allowed_profiles],
  );

  if (allowedProfiles.length > 0 && profile && !allowedProfiles.includes(profile.id.toString())) {
    return (
      <main className="p-4">
        <p role="alert" className="text-body text-secondary">
          You don&apos;t have permission to use the YouTube player.
        </p>
      </main>
    );
  }

  return (
    <main className="space-y-4 p-4">
      <header>
        <h1 className="text-h1 font-semibold text-primary">YouTube</h1>
      </header>
      {tiles.length === 0 ? (
        <p className="text-secondary">No tiles configured.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {tiles.map((tile) => (
            <button
              key={tile.videoId}
              type="button"
              onClick={() => setPlaying(tile)}
              className="overflow-hidden rounded-card bg-surface-elev text-left hover:opacity-90"
              data-testid={`youtube-tile-${tile.videoId}`}
            >
              {tile.thumbnailUrl ? (
                <img
                  src={tile.thumbnailUrl}
                  alt=""
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="aspect-video w-full bg-neutral-200" aria-hidden="true" />
              )}
              <div className="p-2 text-caption font-medium text-primary">{tile.title}</div>
            </button>
          ))}
        </div>
      )}
      {playing && (
        <YouTubePlayerModal
          videoId={playing.videoId}
          title={playing.title}
          onClose={() => setPlaying(null)}
        />
      )}
    </main>
  );
}
