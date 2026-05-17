import { execFile } from 'child_process';

export interface AudioDevice {
  card: number;
  device: number;
  name: string;
}

/**
 * Lists capture (input) devices via `arecord -l`.
 * Resolves to an empty array if the command is unavailable or no cards are found.
 */
export function listCaptureDevices(): Promise<AudioDevice[]> {
  return new Promise((resolve) => {
    execFile('arecord', ['-l'], (_err, stdout) => {
      if (!stdout) {
        resolve([]);
        return;
      }
      // "card 1: USB [USB Audio Device], device 0: USB Audio [USB Audio]"
      const devices = stdout
        .split('\n')
        .map((line) => line.match(/^card (\d+): (.+?),\s+device (\d+):/))
        .filter((m): m is RegExpMatchArray => m !== null)
        .map((m) => ({ card: Number(m[1]), device: Number(m[3]), name: m[2].trim() }));
      resolve(devices);
    });
  });
}

export async function hasUsbAudio(): Promise<boolean> {
  const devices = await listCaptureDevices();
  return devices.length > 0;
}
