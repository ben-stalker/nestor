import type { CalendarProvider, RawEvent } from './CalendarProvider';
import type { CalendarAccount, CalendarEvent } from '../../types/calendar';

const LocalProvider: CalendarProvider = {
  pull(_account: CalendarAccount): Promise<RawEvent[]> {
    return Promise.resolve([]);
  },

  push(_account: CalendarAccount, _event: CalendarEvent): Promise<void> {
    return Promise.resolve();
  },

  testCredentials(_account: CalendarAccount): Promise<boolean> {
    return Promise.resolve(true);
  },
};

export default LocalProvider;
