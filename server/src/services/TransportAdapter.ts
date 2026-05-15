export type JourneyStatus = 'ok' | 'disrupted' | 'unknown';

export interface Disruption {
  id: string;
  severity: 'minor' | 'major' | 'severe';
  description: string;
}

export interface JourneyEta {
  journeyId: number;
  label: string;
  origin: string;
  destination: string;
  transportMode: string;
  etaMinutes: number | null;
  status: JourneyStatus;
  disruptions: Disruption[];
  updatedAt: number;
}

export interface TransportAdapter {
  readonly providerId: string;
  /** Whether this adapter is a stub (returns mocked data). Shown in admin UI. */
  readonly isStub?: boolean;
  getEta(journey: {
    id: number;
    label: string;
    origin: string;
    destination: string;
    transport_mode: string;
  }): Promise<JourneyEta>;
}

/** Default no-op stub — returns a fixed mock travel time until a real adapter is configured. */
export class UkNoOpAdapter implements TransportAdapter {
  readonly providerId = 'uk-no-op';

  readonly isStub = true;

  // eslint-disable-next-line class-methods-use-this
  getEta(journey: {
    id: number;
    label: string;
    origin: string;
    destination: string;
    transport_mode: string;
  }): Promise<JourneyEta> {
    return Promise.resolve({
      journeyId: journey.id,
      label: journey.label,
      origin: journey.origin,
      destination: journey.destination,
      transportMode: journey.transport_mode,
      etaMinutes: 30,
      status: 'ok' as JourneyStatus,
      disruptions: [],
      updatedAt: Date.now(),
    });
  }
}

export const defaultAdapter: TransportAdapter = new UkNoOpAdapter();
