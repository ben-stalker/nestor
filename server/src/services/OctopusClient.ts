export interface OctopusMeterInfo {
  mpan: string | null;
  meterSerial: string | null;
  gasMprn: string | null;
  gasMeterSerial: string | null;
  tariffCode: string | null;
}

interface OctopusAccountResponse {
  properties?: Array<{
    electricity_meter_points?: Array<{
      mpan?: string;
      meters?: Array<{ serial_number?: string }>;
      agreements?: Array<{ tariff_code?: string }>;
    }>;
    gas_meter_points?: Array<{
      mprn?: string;
      meters?: Array<{ serial_number?: string }>;
    }>;
  }>;
}

interface OctopusConsumptionResult {
  consumption: number;
  interval_start: string;
  interval_end: string;
}

interface OctopusConsumptionResponse {
  results: OctopusConsumptionResult[];
  next: string | null;
}

interface OctopusRateResult {
  value_exc_vat: number;
  value_inc_vat: number;
}

interface OctopusRatesResponse {
  results: OctopusRateResult[];
}

export interface ConsumptionInterval {
  intervalStart: number;
  intervalEnd: number;
  kwh: number;
}

export interface TariffRates {
  unitRatePence: number;
  standingChargePence: number;
}

const OCTOPUS_BASE_URL = 'https://api.octopus.energy';
const TIMEOUT_MS = 10_000;

export async function validateAccount(
  apiKey: string,
  accountNumber: string,
): Promise<OctopusMeterInfo> {
  const url = `${OCTOPUS_BASE_URL}/v1/accounts/${accountNumber}/`;
  const credentials = Buffer.from(`${apiKey}:`).toString('base64');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request to Octopus API timed out');
    }
    throw new Error(`Network error contacting Octopus API: ${String(err)}`);
  }
  clearTimeout(timer);

  if (res.status === 401) {
    throw new Error('Invalid Octopus API key');
  }
  if (res.status === 404) {
    throw new Error('Octopus account not found');
  }
  if (!res.ok) {
    throw new Error(`Octopus API returned ${res.status}`);
  }

  const data = (await res.json()) as OctopusAccountResponse;
  const properties = data.properties ?? [];

  let mpan: string | null = null;
  let meterSerial: string | null = null;
  let tariffCode: string | null = null;
  let gasMprn: string | null = null;
  let gasMeterSerial: string | null = null;

  const firstProp = properties.find((prop) => {
    const hasElec = (prop.electricity_meter_points?.length ?? 0) > 0;
    const hasGas = (prop.gas_meter_points?.length ?? 0) > 0;
    return hasElec || hasGas;
  });

  if (firstProp) {
    const elec = firstProp.electricity_meter_points?.[0];
    if (elec) {
      mpan = elec.mpan ?? null;
      meterSerial = elec.meters?.[0]?.serial_number ?? null;
      tariffCode = elec.agreements?.[0]?.tariff_code ?? null;
    }

    const gas = firstProp.gas_meter_points?.[0];
    if (gas) {
      gasMprn = gas.mprn ?? null;
      gasMeterSerial = gas.meters?.[0]?.serial_number ?? null;
    }
  }

  return { mpan, meterSerial, gasMprn, gasMeterSerial, tariffCode };
}

async function fetchOnePage(url: string, credentials: string): Promise<OctopusConsumptionResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request to Octopus API timed out');
    }
    throw new Error(`Network error contacting Octopus API: ${String(err)}`);
  }
  clearTimeout(timer);

  if (!res.ok) {
    throw new Error(`Octopus API returned ${res.status}`);
  }

  return res.json() as Promise<OctopusConsumptionResponse>;
}

async function fetchPagedConsumption(
  url: string,
  credentials: string,
  accumulated: OctopusConsumptionResult[] = [],
): Promise<OctopusConsumptionResult[]> {
  const data = await fetchOnePage(url, credentials);
  const all = [...accumulated, ...data.results];
  if (data.next) {
    return fetchPagedConsumption(data.next, credentials, all);
  }
  return all;
}

export async function fetchConsumption(
  apiKey: string,
  mpanOrMprn: string,
  meterSerial: string,
  fuelType: 'electricity' | 'gas',
  fromIso: string,
  toIso: string,
): Promise<ConsumptionInterval[]> {
  const credentials = Buffer.from(`${apiKey}:`).toString('base64');
  const meterPointSegment =
    fuelType === 'electricity'
      ? `electricity-meter-points/${mpanOrMprn}`
      : `gas-meter-points/${mpanOrMprn}`;

  const url =
    `${OCTOPUS_BASE_URL}/v1/${meterPointSegment}/meters/${meterSerial}/consumption/` +
    `?period_from=${encodeURIComponent(fromIso)}&period_to=${encodeURIComponent(toIso)}&order_by=period&page_size=100`;

  const raw = await fetchPagedConsumption(url, credentials);

  return raw.map((r) => ({
    intervalStart: Math.floor(new Date(r.interval_start).getTime() / 1000),
    intervalEnd: Math.floor(new Date(r.interval_end).getTime() / 1000),
    kwh: r.consumption,
  }));
}

export async function fetchTariff(apiKey: string, tariffCode: string): Promise<TariffRates | null> {
  const credentials = Buffer.from(`${apiKey}:`).toString('base64');

  // Extract product code: e.g. "E-1R-VAR-22-11-01-A" → "VAR-22-11-01"
  const parts = tariffCode.split('-');
  const productCode = parts.slice(2, -1).join('-');

  if (!productCode) {
    return null;
  }

  const today = new Date().toISOString().slice(0, 10);

  const fetchRate = async (endpoint: string): Promise<number | null> => {
    const url =
      `${OCTOPUS_BASE_URL}/v1/products/${productCode}/electricity-tariffs/${tariffCode}/${endpoint}/` +
      `?period_from=${today}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(url, {
        headers: {
          Authorization: `Basic ${credentials}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
    } catch (err: unknown) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Request to Octopus API timed out');
      }
      throw new Error(`Network error contacting Octopus API: ${String(err)}`);
    }
    clearTimeout(timer);

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as OctopusRatesResponse;
    const first = data.results?.[0];
    return first?.value_inc_vat ?? null;
  };

  const [unitRate, standingCharge] = await Promise.all([
    fetchRate('standard-unit-rates'),
    fetchRate('standing-charges'),
  ]);

  if (unitRate === null || standingCharge === null) {
    return null;
  }

  return { unitRatePence: unitRate, standingChargePence: standingCharge };
}
