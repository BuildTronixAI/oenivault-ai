export interface ClimateReading {
  id: string;
  sensor_id: string;
  temperature: string | null;
  humidity: string | null;
  timestamp: Date;
  alert_triggered: boolean;
}
