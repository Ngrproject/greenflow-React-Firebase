export interface SensorData {
  temperature: number;
  humidity: number;
  vpd: number;
  ph: number;
  ec: number;
  soilMoistureA: number;
  soilMoistureB: number;
  batteryVoltage: number;
  batteryPercentage: number;
  waterLevel: number;
  rssi: number;
  timestamp: number;
}

export interface ActuatorState {
  pump: boolean;
  fan: boolean;
  valve: boolean;
  uvLight: boolean;
  mode: 'auto' | 'manual' | 'schedule';
  lastCommand?: string;
  lastCommandTime?: number;
}

export interface DeviceStatus {
  online: boolean;
  lastSeen: number;
  uptime: number;
  firmwareVersion: string;
  freeHeap: number;
  rssi: number;
}

export interface LiveData {
  sensors: SensorData;
  actuators: ActuatorState;
  status: DeviceStatus;
}

export interface SensorReading {
  temperature: number;
  humidity: number;
  vpd: number;
  soilMoistureA: number;
  soilMoistureB: number;
  ph: number;
  ec: number;
  waterLevel: number;
  batteryVoltage: number;
  batteryPercent: number;
  rssi: number;
  uptime: number;
  timestamp: number;
}