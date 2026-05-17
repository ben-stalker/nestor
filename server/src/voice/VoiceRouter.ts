import eventBus from '../core/eventBus';
import logger from '../utils/logger';

export interface RouteResult {
  matchedHandler: string | null;
  response: string | null;
}

const NAV_MODES = [
  'calendar',
  'food',
  'family',
  'house',
  'board',
  'finance',
  'pets',
  'ev',
  'vehicles',
  'home',
  'contacts',
];

const MONTH_NAMES: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function parseDatePhrase(phrase: string): string | null {
  const p = phrase.toLowerCase().trim();
  const today = new Date();

  if (p === 'today') return isoDate(today);
  if (p === 'tomorrow') {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return isoDate(d);
  }
  if (p === 'this week') return isoDate(today);
  if (p === 'next week') {
    const d = new Date(today);
    d.setDate(d.getDate() + 7);
    return isoDate(d);
  }

  // "the Nth" / "on the Nth"
  const nthM = p.match(/(?:on )?the (\d+)(?:st|nd|rd|th)?(?:\s+of\s+(\w+))?/);
  if (nthM) {
    const day = parseInt(nthM[1], 10);
    const monthWord = nthM[2] ? MONTH_NAMES[nthM[2].toLowerCase()] : null;
    const d = new Date(today);
    if (monthWord !== null && monthWord !== undefined) d.setMonth(monthWord);
    d.setDate(day);
    return isoDate(d);
  }

  return null;
}

export class VoiceRouter {
  // eslint-disable-next-line class-methods-use-this
  route(rawTranscript: string): RouteResult {
    const transcript = rawTranscript.trim().toLowerCase().replace(/[.,!?]$/, '');
    logger.debug({ transcript }, 'VoiceRouter: routing');

    // "go to <mode>" / "open <mode>" / "show <mode>"
    const gotoM = transcript.match(
      /^(?:go\s+to|open|switch\s+to|navigate\s+to|show)\s+(.+)$/,
    );
    if (gotoM) {
      const target = gotoM[1].trim();
      const mode = NAV_MODES.find((m) => target.includes(m));
      if (mode) {
        eventBus.emit('nav:goto', { mode });
        return { matchedHandler: `nav:goto:${mode}`, response: null };
      }
    }

    // "back to home" / "go home"
    if (transcript.match(/^(?:back\s+to\s+home|go\s+home|home)$/)) {
      eventBus.emit('nav:goto', { mode: 'home' });
      return { matchedHandler: 'nav:goto:home', response: null };
    }

    // "show today" / "show tomorrow" / "show this week" / "show the Nth"
    const showDateM = transcript.match(/^show\s+(.+)$/);
    if (showDateM) {
      const date = parseDatePhrase(showDateM[1]);
      if (date) {
        eventBus.emit('nav:date', { date });
        return { matchedHandler: `nav:date:${date}`, response: date };
      }
    }

    // "what time is it" / "what's the time" / "what is the time"
    if (transcript.match(/what(?:'s)?\s+(?:is\s+)?(?:the\s+)?time(?:\s+is\s+it)?/)) {
      const now = new Date();
      const response = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      return { matchedHandler: 'builtin:time', response };
    }

    // "what day is it" / "what's the date" / "what is the date"
    if (transcript.match(/what(?:'s)?\s+(?:is\s+)?(?:the\s+)?(?:day|date)(?:\s+is\s+it)?/)) {
      const now = new Date();
      const response = now.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      return { matchedHandler: 'builtin:date', response };
    }

    // unmatched — log and return null
    logger.info({ transcript }, 'VoiceRouter: no match — passing to plugins');
    return { matchedHandler: null, response: null };
  }
}

export default new VoiceRouter();
