/** Wine vault climate thresholds (°F / %RH). Override via env. */

function num(env: string | undefined, fallback: number) {
  const n = Number(env);
  return Number.isFinite(n) ? n : fallback;
}

export const climateThresholds = {
  tempWarnMin: num(process.env.CLIMATE_TEMP_WARN_MIN, 52),
  tempWarnMax: num(process.env.CLIMATE_TEMP_WARN_MAX, 58),
  tempCritMin: num(process.env.CLIMATE_TEMP_CRIT_MIN, 48),
  tempCritMax: num(process.env.CLIMATE_TEMP_CRIT_MAX, 62),
  humidityWarnMin: num(process.env.CLIMATE_HUMIDITY_WARN_MIN, 55),
  humidityWarnMax: num(process.env.CLIMATE_HUMIDITY_WARN_MAX, 75),
  humidityCritMin: num(process.env.CLIMATE_HUMIDITY_CRIT_MIN, 45),
  humidityCritMax: num(process.env.CLIMATE_HUMIDITY_CRIT_MAX, 85),
};
