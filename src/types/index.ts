export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'operator' | 'viewer';
  deviceIds: string[];
  createdAt: number;
  lastLoginAt: number;
}

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
  pumpState: boolean;
  fanState: boolean;
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

export interface SystemStatus {
  online: boolean;
  mode: 'auto' | 'manual' | 'schedule';
  rssi: number;
  uptime: number;
  freeHeap: number;
  firmwareVersion: string;
  lastSync: number;
}

export interface DeviceConfig {
  deviceId: string;
  name: string;
  location: string;
  ownerId: string;
  hstStartDate: number;
  currentPhase: string;
  phases: HSTPhase[];
  schedules: Schedule[];
  setpoints: Setpoints;
  pumpCalibration: PumpCalibration;
  wifiConfig: WifiConfig;
}

export interface HSTPhase {
  name: string;
  startDay: number;
  endDay: number;
  irrigationMl: number;
  intervalHours: number;
  ecTarget: number;
  phTarget: number;
}

export interface Schedule {
  id: string;
  name: string;
  time: string;
  enabled: boolean;
  volumeMl: number;
}

export interface Setpoints {
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
  vpdMin: number;
  vpdMax: number;
  phMin: number;
  phMax: number;
  ecMin: number;
  ecMax: number;
  soilMoistureMin: number;
  soilMoistureMax: number;
  batteryCritical: number;
}

export interface PumpCalibration {
  mlPerSecond: number;
  lastCalibrated: number;
}

export interface WifiConfig {
  ssid: string;
  password: string;
}

export interface Alert {
  id: string;
  deviceId: string;
  type: 'critical' | 'warning' | 'info';
  category: 'battery' | 'temperature' | 'humidity' | 'vpd' | 'ph' | 'ec' | 'soil_moisture' | 'water_level' | 'connectivity' | 'system';
  title: string;
  message: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  createdAt: number;
  resolvedAt?: number;
}

export interface LiveData {
  sensors: SensorData;
  actuators: ActuatorState;
  status: SystemStatus;
}