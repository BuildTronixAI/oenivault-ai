/**
 * Simulated IoT sensors — posts readings to /api/climate/ingest.
 *
 * Usage:
 *   npm run simulate:climate
 *   SIMULATE_ALERT=1 npm run simulate:climate   # force out-of-range values
 */
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 4000}`;
const INTERVAL_MS = Number(process.env.SIMULATE_INTERVAL_MS || 5000);
const FORCE_ALERT = process.env.SIMULATE_ALERT === '1';

const SENSORS = [
  { key: 'sensor_zone_a_demo_key', name: 'Zone A' },
  { key: 'sensor_zone_b_demo_key', name: 'Zone B' },
];

function sample(baseTemp: number, baseHum: number) {
  if (FORCE_ALERT) {
    return {
      temperature: Number((Math.random() > 0.5 ? 66 + Math.random() * 4 : 44 + Math.random() * 3).toFixed(1)),
      humidity: Number((Math.random() > 0.5 ? 88 + Math.random() * 5 : 38 + Math.random() * 5).toFixed(1)),
    };
  }
  return {
    temperature: Number((baseTemp + (Math.random() - 0.5) * 1.5).toFixed(1)),
    humidity: Number((baseHum + (Math.random() - 0.5) * 4).toFixed(1)),
  };
}

async function tick() {
  for (const sensor of SENSORS) {
    const body = sample(55, 63);
    try {
      const res = await fetch(`${API_URL}/api/climate/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-sensor-key': sensor.key,
        },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { alerts?: unknown[]; reading?: { temperature: string; humidity: string } };
      const alertCount = data.alerts?.length ?? 0;
      console.log(
        `[${new Date().toISOString()}] ${sensor.name} → ${body.temperature}°F / ${body.humidity}%` +
          (alertCount ? ` ⚠ ${alertCount} alert(s)` : '') +
          (res.ok ? '' : ` ERROR ${res.status}`)
      );
    } catch (err) {
      console.error(`Failed to post ${sensor.name}:`, err instanceof Error ? err.message : err);
    }
  }
}

console.log(`Climate simulator → ${API_URL} every ${INTERVAL_MS}ms (SIMULATE_ALERT=${FORCE_ALERT})`);
void tick();
setInterval(() => void tick(), INTERVAL_MS);
