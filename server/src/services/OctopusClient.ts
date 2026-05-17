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
