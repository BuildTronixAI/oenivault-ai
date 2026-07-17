/** Purge climate readings older than RETENTION_DAYS (default 90). */
import dotenv from 'dotenv';
import { purgeOldReadings } from '../services/climateService';
import { pool } from '../database/pool';

dotenv.config();

async function main() {
  const days = Number(process.env.RETENTION_DAYS || 90);
  const result = await purgeOldReadings(days);
  console.log(`Purged ${result.deleted} readings older than ${days} days`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
