import { VoiceRouter } from '../../src/voice/VoiceRouter';
import eventBus from '../../src/core/eventBus';

jest.mock('../../src/utils/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

let navGotos: { mode: string }[] = [];
let navDates: { date: string }[] = [];

beforeEach(() => {
  navGotos = [];
  navDates = [];
  eventBus.removeAllListeners();
  eventBus.on('nav:goto', (p) => navGotos.push(p));
  eventBus.on('nav:date', (p) => navDates.push(p));
});

afterEach(() => {
  eventBus.removeAllListeners();
});

describe('VoiceRouter — navigation commands', () => {
  const router = new VoiceRouter();

  it.each([
    ['go to calendar', 'calendar'],
    ['open food', 'food'],
    ['navigate to family', 'family'],
    ['show house', 'house'],
    ['switch to finance', 'finance'],
    ['go to pets', 'pets'],
    ['go to board', 'board'],
    ['open ev', 'ev'],
  ])('"%s" → nav:goto:%s', (transcript, expectedMode) => {
    const result = router.route(transcript);
    expect(result.matchedHandler).toBe(`nav:goto:${expectedMode}`);
    expect(navGotos).toHaveLength(1);
    expect(navGotos[0].mode).toBe(expectedMode);
  });

  it.each([['back to home'], ['go home'], ['home']])('"%s" → nav:goto:home', (transcript) => {
    const result = router.route(transcript);
    expect(result.matchedHandler).toBe('nav:goto:home');
    expect(navGotos[0].mode).toBe('home');
  });
});

describe('VoiceRouter — date navigation', () => {
  const router = new VoiceRouter();

  it('show today → nav:date with today ISO', () => {
    const result = router.route('show today');
    expect(result.matchedHandler).toMatch(/^nav:date:\d{4}-\d{2}-\d{2}$/);
    expect(navDates).toHaveLength(1);
  });

  it('show tomorrow → nav:date with tomorrow ISO', () => {
    router.route('show tomorrow');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(navDates[0].date).toBe(tomorrow.toISOString().slice(0, 10));
  });

  it('show this week → nav:date', () => {
    router.route('show this week');
    expect(navDates).toHaveLength(1);
  });
});

describe('VoiceRouter — built-in queries', () => {
  const router = new VoiceRouter();

  it('what time is it → builtin:time with response', () => {
    const result = router.route('what time is it');
    expect(result.matchedHandler).toBe('builtin:time');
    expect(result.response).toMatch(/^\d{2}:\d{2}$/);
    expect(navGotos).toHaveLength(0);
  });

  it("what's the time → builtin:time", () => {
    const result = router.route("what's the time");
    expect(result.matchedHandler).toBe('builtin:time');
  });

  it('what day is it → builtin:date with response', () => {
    const result = router.route('what day is it');
    expect(result.matchedHandler).toBe('builtin:date');
    expect(result.response).toBeTruthy();
  });

  it('what is the date → builtin:date', () => {
    const result = router.route('what is the date');
    expect(result.matchedHandler).toBe('builtin:date');
  });
});

describe('VoiceRouter — unmatched fallthrough', () => {
  const router = new VoiceRouter();

  it('unrecognised phrase → null handler, no events', () => {
    const result = router.route('set a timer for five minutes');
    expect(result.matchedHandler).toBeNull();
    expect(result.response).toBeNull();
    expect(navGotos).toHaveLength(0);
    expect(navDates).toHaveLength(0);
  });

  it('empty string → null handler', () => {
    const result = router.route('   ');
    expect(result.matchedHandler).toBeNull();
  });
});

describe('VoiceRouter — punctuation tolerance', () => {
  const router = new VoiceRouter();

  it('strips trailing period', () => {
    const result = router.route('go to calendar.');
    expect(result.matchedHandler).toBe('nav:goto:calendar');
  });

  it('strips trailing question mark', () => {
    const result = router.route('what time is it?');
    expect(result.matchedHandler).toBe('builtin:time');
  });
});
