export interface SystemPerformance {
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  uptimeSeconds: number;
  loadAverage?: [number, number, number];
}

// Lightweight, cross-platform system performance helper used by monitoring dashboards.
export const systemPerformanceService = {
  async getMetrics(): Promise<SystemPerformance> {
    // Provide conservative, deterministic values so callers can rely on typing during builds/tests.
    // Implementations can be enhanced to use OS-specific telemetry or APM integrations.
    return {
      cpuUsagePercent: 0,
      memoryUsagePercent: 0,
      uptimeSeconds: 0,
      loadAverage: [0, 0, 0]
    };
  }
};

export default systemPerformanceService;
