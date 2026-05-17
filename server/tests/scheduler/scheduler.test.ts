import { schedule as mockScheduleFn } from 'node-cron';
import logger from '../../src/utils/logger';
import { Scheduler, registerBuiltinJobs } from '../../src/scheduler';

jest.mock('node-cron', () => {
  const stop = jest.fn();
  const mockTask = { id: 'mock-task', stop };
  return {
    schedule: jest.fn().mockReturnValue(mockTask),
    validate: jest.fn().mockReturnValue(true),
  };
});

jest.mock('../../src/utils/logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockedSchedule = mockScheduleFn as jest.Mock;
const mockedLogger = logger as unknown as {
  error: jest.Mock;
  info: jest.Mock;
  debug: jest.Mock;
};

/** Pull the wrapped handler passed to node-cron's schedule() at a given call index. */
function getWrappedFn(callIndex: number): () => Promise<void> {
  const calls = mockedSchedule.mock.calls as Array<[string, () => Promise<void>, unknown]>;
  return calls[callIndex][1];
}

beforeEach(() => {
  Scheduler.clearRegistry();
  jest.clearAllMocks();
});

// -------------------------------------------------------------------
// register()
// -------------------------------------------------------------------
describe('Scheduler.register()', () => {
  it('calls node-cron schedule with the correct cron expression', () => {
    Scheduler.register('test:job', '*/5 * * * *', () => {});
    expect(mockedSchedule).toHaveBeenCalledWith(
      '*/5 * * * *',
      expect.any(Function),
      expect.objectContaining({ name: 'test:job' }),
    );
  });

  it('adds the job to the internal registry', () => {
    Scheduler.register('test:job', '*/5 * * * *', () => {});
    const jobs = Scheduler.list();
    expect(jobs).toHaveLength(1);
    expect(jobs[0].name).toBe('test:job');
    expect(jobs[0].cron).toBe('*/5 * * * *');
  });

  it('initialises runCount to 0', () => {
    Scheduler.register('test:job', '*/5 * * * *', () => {});
    expect(Scheduler.list()[0].runCount).toBe(0);
  });

  it('logs job registration', () => {
    Scheduler.register('log:test', '0 * * * *', () => {});
    expect(mockedLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ job: 'log:test' }),
      'Job registered',
    );
  });

  it('throws for an invalid cron expression', () => {
    const { validate } = jest.requireMock<{ validate: jest.Mock }>('node-cron');
    validate.mockReturnValueOnce(false);
    expect(() => Scheduler.register('bad:job', 'not-valid', () => {})).toThrow(
      /Invalid cron expression/,
    );
  });

  it('overwrites an existing job registered under the same name', () => {
    Scheduler.register('dup:job', '0 * * * *', () => {});
    Scheduler.register('dup:job', '*/30 * * * *', () => {});
    expect(Scheduler.list()).toHaveLength(1);
    expect(Scheduler.list()[0].cron).toBe('*/30 * * * *');
  });
});

// -------------------------------------------------------------------
// Handler isolation — wrapped try/catch
// -------------------------------------------------------------------
describe('Scheduler handler isolation', () => {
  it('catches a synchronous throw and logs the error', async () => {
    const boom = new Error('sync-boom');
    Scheduler.register('throwing:job', '* * * * *', () => {
      throw boom;
    });

    await getWrappedFn(0)();

    expect(mockedLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: boom, job: 'throwing:job' }),
      'Scheduled job threw',
    );
  });

  it('stores the error message in lastError', async () => {
    Scheduler.register('err:job', '* * * * *', () => {
      throw new Error('stored-error');
    });

    await getWrappedFn(0)();

    expect(Scheduler.list()[0].lastError).toBe('stored-error');
  });

  it('increments runCount on each invocation', async () => {
    Scheduler.register('count:job', '* * * * *', () => {});

    const fn = getWrappedFn(0);
    await fn();
    await fn();

    expect(Scheduler.list()[0].runCount).toBe(2);
  });

  it('records lastRun timestamp after each invocation', async () => {
    const before = Date.now();
    Scheduler.register('time:job', '* * * * *', () => {});

    await getWrappedFn(0)();

    const { lastRun } = Scheduler.list()[0];
    expect(lastRun).toBeGreaterThanOrEqual(before);
    expect(lastRun).toBeLessThanOrEqual(Date.now());
  });

  it('catches a rejected async handler and logs the error', async () => {
    const asyncError = new Error('async-boom');
    Scheduler.register('async:job', '* * * * *', () => Promise.reject(asyncError));

    await getWrappedFn(0)();

    expect(mockedLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: asyncError, job: 'async:job' }),
      'Scheduled job threw',
    );
  });

  it('does not propagate the error to the caller', async () => {
    Scheduler.register('safe:job', '* * * * *', () => {
      throw new Error('should not propagate');
    });

    await expect(getWrappedFn(0)()).resolves.toBeUndefined();
  });

  it('second job still runs after first job throws', async () => {
    const called: string[] = [];

    Scheduler.register('job:a', '* * * * *', () => {
      throw new Error('a-boom');
    });
    Scheduler.register('job:b', '* * * * *', () => {
      called.push('b');
    });

    await getWrappedFn(0)();
    await getWrappedFn(1)();

    expect(called).toEqual(['b']);
    expect(mockedLogger.error).toHaveBeenCalledTimes(1);
  });
});

// -------------------------------------------------------------------
// runNow()
// -------------------------------------------------------------------
describe('Scheduler.runNow()', () => {
  it('executes the handler immediately', async () => {
    const spy = jest.fn();
    Scheduler.register('run:now:job', '0 * * * *', spy);

    await Scheduler.runNow('run:now:job');

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('increments runCount and sets lastRun', async () => {
    const before = Date.now();
    Scheduler.register('run:now:meta', '0 * * * *', () => {});

    await Scheduler.runNow('run:now:meta');

    const job = Scheduler.list()[0];
    expect(job.runCount).toBe(1);
    expect(job.lastRun).toBeGreaterThanOrEqual(before);
  });

  it('throws when the job name is not registered', async () => {
    await expect(Scheduler.runNow('nonexistent')).rejects.toThrow(/No such job/);
  });

  it('sets lastError when the handler throws', async () => {
    Scheduler.register('run:now:err', '0 * * * *', () => {
      throw new Error('runNow-error');
    });

    await Scheduler.runNow('run:now:err');

    expect(Scheduler.list()[0].lastError).toBe('runNow-error');
  });
});

// -------------------------------------------------------------------
// list()
// -------------------------------------------------------------------
describe('Scheduler.list()', () => {
  it('returns an empty array when no jobs are registered', () => {
    expect(Scheduler.list()).toEqual([]);
  });

  it('returns all registered jobs', () => {
    Scheduler.register('job:one', '0 * * * *', () => {});
    Scheduler.register('job:two', '*/5 * * * *', () => {});
    const names = Scheduler.list().map((j) => j.name);
    expect(names).toContain('job:one');
    expect(names).toContain('job:two');
  });

  it('does not expose the internal handler or task', () => {
    Scheduler.register('job:check', '0 * * * *', () => {});
    const entry = Scheduler.list()[0] as unknown as Record<string, unknown>;
    expect(entry).not.toHaveProperty('handler');
    expect(entry).not.toHaveProperty('task');
  });

  it('returns a snapshot — mutations do not affect the registry', () => {
    Scheduler.register('job:snap', '0 * * * *', () => {});
    const list = Scheduler.list();
    list.pop();
    expect(Scheduler.list()).toHaveLength(1);
  });
});

// -------------------------------------------------------------------
// registerBuiltinJobs()
// -------------------------------------------------------------------
describe('registerBuiltinJobs()', () => {
  it('registers exactly 9 built-in jobs', () => {
    registerBuiltinJobs();
    expect(Scheduler.list()).toHaveLength(9);
  });

  it('registers the expected job names', () => {
    registerBuiltinJobs();
    const names = Scheduler.list().map((j) => j.name);
    expect(names).toContain('weather-refresh');
    expect(names).toContain('caldav-sync');
    expect(names).toContain('reminder-eval');
    expect(names).toContain('github-update-poll');
    expect(names).toContain('vacuum-db');
    expect(names).toContain('term-dates-sync');
    expect(names).toContain('bin-alert-eval');
    expect(names).toContain('checklist-reset');
    expect(names).toContain('ev-plug-in-eval');
  });
});
