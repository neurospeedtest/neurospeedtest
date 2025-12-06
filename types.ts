export enum TestStatus {
  IDLE = 'IDLE',
  PING = 'PING',
  DOWNLOAD = 'DOWNLOAD',
  UPLOAD = 'UPLOAD',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface SpeedTestResult {
  ping: number; // ms
  download: number; // Mbps
  upload: number; // Mbps
  timestamp: number;
}

export interface ChartDataPoint {
  time: number;
  speed: number;
}

export interface AnalysisResponse {
  summary: string;
  streaming: string;
  gaming: string;
  videoCalls: string;
}

export interface NetworkInfo {
  ip: string;
  isp: string;
  location: string;
  type: string;
}