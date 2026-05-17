/* eslint-disable no-underscore-dangle */
import path from 'node:path';

const idx = path.join(__dirname, '..', '..', '..', 'plugins', 'youtube-player', 'index.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, import/no-dynamic-require, global-require
const yt = require(idx) as {
  _internal: {
    parseCuratedTiles: (raw?: string) => { videoId: string; title: string; thumbnailUrl: string | null }[];
    parseAllowedProfiles: (raw?: string) => string[];
    parseChannelIds: (raw?: string) => string[];
    search: (ctx: unknown, q: string) => Promise<unknown[]>;
  };
};

describe('youtube-player plugin', () => {
  it('parseCuratedTiles handles missing / bad JSON', () => {
    expect(yt._internal.parseCuratedTiles(undefined)).toEqual([]);
    expect(yt._internal.parseCuratedTiles('not json')).toEqual([]);
    expect(yt._internal.parseCuratedTiles('"not array"')).toEqual([]);
  });

  it('parseCuratedTiles keeps valid entries', () => {
    const tiles = yt._internal.parseCuratedTiles(
      JSON.stringify([
        { title: 'A', videoId: 'aaa' },
        { videoId: 'bbb' },
        { title: 'No video' },
      ]),
    );
    expect(tiles).toHaveLength(2);
    expect(tiles[0].videoId).toBe('aaa');
    expect(tiles[1].title).toBe('Untitled');
  });

  it('parseAllowedProfiles splits on commas and newlines', () => {
    expect(yt._internal.parseAllowedProfiles('alice,bob\ncharlie')).toEqual(['alice', 'bob', 'charlie']);
  });

  it('parseChannelIds splits and trims', () => {
    expect(yt._internal.parseChannelIds('a , b\n c')).toEqual(['a', 'b', 'c']);
  });

  it('search returns empty when no api key', async () => {
    const ctx = { getSetting: () => undefined, logger: { warn: () => undefined } };
    expect(await yt._internal.search(ctx, 'q')).toEqual([]);
  });

  it('search returns empty when search disabled', async () => {
    const ctx = {
      getSetting: (k: string) => (k === 'youtube_api_key' ? 'k' : undefined),
      logger: { warn: () => undefined },
    };
    expect(await yt._internal.search(ctx, 'q')).toEqual([]);
  });
});
