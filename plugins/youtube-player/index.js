'use strict';

const YT_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

function parseCuratedTiles(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((t) => t && typeof t.videoId === 'string')
      .map((t) => ({
        title: String(t.title || 'Untitled'),
        videoId: String(t.videoId),
        thumbnailUrl: typeof t.thumbnailUrl === 'string' ? t.thumbnailUrl : null,
      }));
  } catch {
    return [];
  }
}

function parseAllowedProfiles(raw) {
  if (!raw) return [];
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseChannelIds(raw) {
  if (!raw) return [];
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function search(ctx, query) {
  const apiKey = ctx.getSetting('youtube_api_key');
  if (!apiKey) return [];
  const enabled = ctx.getSetting('search_enabled');
  if (enabled !== 'true' && enabled !== '1') return [];
  const channelIds = parseChannelIds(ctx.getSetting('allowed_channel_ids'));
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: '12',
    safeSearch: 'strict',
    key: apiKey,
  });
  if (channelIds.length === 1) params.set('channelId', channelIds[0]);
  try {
    const res = await ctx.httpRequest(`${YT_SEARCH_URL}?${params.toString()}`, { timeoutMs: 10000 });
    if (!res.ok) return [];
    const data = JSON.parse(res.body);
    const items = (data && data.items) || [];
    return items
      .map((it) => ({
        videoId: it.id && it.id.videoId,
        title: it.snippet && it.snippet.title,
        thumbnailUrl:
          it.snippet && it.snippet.thumbnails && it.snippet.thumbnails.medium
            ? it.snippet.thumbnails.medium.url
            : null,
      }))
      .filter((x) => x.videoId);
  } catch (err) {
    ctx.logger.warn(`youtube-player search failed: ${err && err.message ? err.message : err}`);
    return [];
  }
}

module.exports = {
  async init(ctx) {
    ctx.registerNavMode({
      id: 'youtube_player',
      label: 'YouTube',
      icon: 'play',
      route: '/plugins/youtube-player',
    });
    ctx.registerWidget({
      id: 'youtube_player_widget',
      title: 'YouTube',
      size: 'medium',
      data: { tiles: parseCuratedTiles(ctx.getSetting('curated_tiles')) },
    });
  },
  _internal: { parseCuratedTiles, parseAllowedProfiles, parseChannelIds, search },
};
