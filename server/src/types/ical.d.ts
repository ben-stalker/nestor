/* eslint-disable max-classes-per-file */
// CJS-compatible ambient type declarations for ical.js.
// Using an ambient module declaration avoids TypeScript's ESM/CJS boundary error
// (TS1479/TS1541) while providing accurate types for the APIs used in this project.
declare module 'ical.js' {
  type JCalArray = unknown[];

  interface RecurIterator {
    next(): Time | null;
  }

  class Time {
    isDate: boolean;

    toJSDate(): Date;

    static fromJSDate(date: Date, useUTC?: boolean): Time;
  }

  class Recur {
    iterator(startTime: Time): RecurIterator;

    static fromString(str: string): Recur;
  }

  class Property {
    toICALString(): string;

    getFirstValue(): unknown;
  }

  class Component {
    constructor(jcal: JCalArray, parent?: Component);

    getAllSubcomponents(name: string): Component[];

    getFirstProperty(name: string): Property | null;

    getFirstPropertyValue(name: string): string | null;
  }

  class Event {
    constructor(component: Component, options?: object);

    readonly summary: string;

    readonly description: string;

    readonly startDate: Time;

    readonly endDate: Time;
  }

  function parse(input: string): JCalArray;

  function stringify(jcal: JCalArray): string;

  interface ICALModule {
    parse: typeof parse;
    stringify: typeof stringify;
    Component: typeof Component;
    Event: typeof Event;
    Time: typeof Time;
    Recur: typeof Recur;
    Property: typeof Property;
  }

  const icalDefault: ICALModule;

  export default icalDefault;
  export { parse, stringify, Component, Event, Time, Recur, Property };
  export type { ICALModule };
}
