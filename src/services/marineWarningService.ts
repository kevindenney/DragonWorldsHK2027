import { hkoAPI, HKOMarineWarning } from './hkoAPI';
import { LocationCoordinate } from '../stores/weatherStore';

// Marine warning severity levels
export type WarningSeverity = 'normal' | 'advisory' | 'watch' | 'warning' | 'severe';

// Marine warning types
export type WarningType = 'gale' | 'storm' | 'typhoon' | 'fog' | 'visibility' | 'ice' | 'sea-conditions';

export interface MarineWarning {
  id: string;
  type: WarningType;
  severity: WarningSeverity;
  title: string;
  description: string;
  affectedAreas: string[];
  coordinates?: LocationCoordinate[];
  windSpeed?: number;
  waveHeight?: number;
  visibility?: number;
  validFrom: string;
  validUntil: string;
  issuedAt: string;
  lastUpdated: string;
  isActive: boolean;
  source: 'HKO' | 'Local';
}

export interface WarningAlert {
  id: string;
  warning: MarineWarning;
  alertLevel: 'info' | 'low' | 'medium' | 'high' | 'critical';
  shouldNotify: boolean;
  acknowledgedAt?: string;
}

// Hong Kong Marine Warning Areas
const HK_MARINE_WARNING_AREAS = [
  { name: 'Victoria Harbour', coordinates: [{ latitude: 22.285, longitude: 114.175 }] },
  { name: 'Eastern Waters', coordinates: [{ latitude: 22.300, longitude: 114.320 }] },
  { name: 'Southern Waters', coordinates: [{ latitude: 22.200, longitude: 114.220 }] },
  { name: 'Western Waters', coordinates: [{ latitude: 22.250, longitude: 114.130 }] },
  { name: 'Northern Waters', coordinates: [{ latitude: 22.350, longitude: 114.200 }] },
  { name: 'Outer Waters', coordinates: [{ latitude: 22.100, longitude: 114.300 }] },
  { name: 'Pearl River Approaches', coordinates: [{ latitude: 22.200, longitude: 113.900 }] },
  { name: 'South China Sea (HK)', coordinates: [{ latitude: 21.800, longitude: 114.200 }] },
  { name: 'Tolo Harbour', coordinates: [{ latitude: 22.440, longitude: 114.225 }] },
  { name: 'Clearwater Bay', coordinates: [{ latitude: 22.275, longitude: 114.295 }] }
];

class MarineWarningService {
  private warnings: Map<string, MarineWarning> = new Map();
  private alerts: Map<string, WarningAlert> = new Map();
  private listeners: Array<(warnings: MarineWarning[]) => void> = [];
  private pollingEnabled: boolean = false;
  private pollingTimer: NodeJS.Timeout | null = null;
  private updateInterval: number = 30 * 1000; // 30 seconds for warning updates

  constructor() {
    this.startWarningPolling();
  }

  /**
   * Start real-time polling for marine warnings
   */
  private startWarningPolling(): void {
    if (this.pollingEnabled) return;

    this.pollingEnabled = true;

    // Initial fetch
    this.fetchMarineWarnings();

    // Set up polling timer
    this.pollingTimer = setInterval(() => {
      this.fetchMarineWarnings();
    }, this.updateInterval);
  }

  /**
   * Stop warning polling
   */
  private stopWarningPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    this.pollingEnabled = false;
  }

  /**
   * Fetch marine warnings from HKO and local analysis
   */
  private async fetchMarineWarnings(): Promise<void> {
    try {

      // Get HKO marine warnings
      const hkoWarnings = await hkoAPI.getWeatherWarnings();

      // Get current marine forecasts for local warning analysis
      const marineForecasts = await hkoAPI.getMarineForecastAreas();

      // Process HKO warnings
      hkoWarnings.forEach((warning) => {
        const marineWarning = this.convertHKOWarningToMarineWarning(warning as HKOMarineWarning);
        this.warnings.set(marineWarning.id, marineWarning);

        // Check if this warning should trigger an alert
        this.checkForAlert(marineWarning);
      });

      // Analyze current conditions for potential warnings
      marineForecasts.forEach((forecast) => {
        const localWarnings = this.analyzeLocalConditions(forecast as any);
        localWarnings.forEach(warning => {
          this.warnings.set(warning.id, warning);
          this.checkForAlert(warning);
        });
      });

      // Clean up expired warnings
      this.cleanupExpiredWarnings();

      // Notify listeners
      this.notifyListeners();

    } catch (error) {
    }
  }

  /**
   * Convert HKO warning to our marine warning format
   */
  private convertHKOWarningToMarineWarning(hkoWarning: HKOMarineWarning): MarineWarning {
    return {
      id: `hko-${hkoWarning.id}`,
      type: this.mapHKOWarningType(hkoWarning.type),
      severity: this.mapHKOSeverity(hkoWarning.severity),
      title: hkoWarning.title,
      description: hkoWarning.description,
      affectedAreas: hkoWarning.affectedAreas,
      coordinates: this.getCoordinatesForAreas(hkoWarning.affectedAreas),
      windSpeed: hkoWarning.maxWindSpeed,
      waveHeight: hkoWarning.maxWaveHeight,
      visibility: hkoWarning.minVisibility,
      validFrom: hkoWarning.validFrom ?? new Date().toISOString(),
      validUntil: hkoWarning.validUntil ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      issuedAt: hkoWarning.issuedAt ?? new Date().toISOString(),
      lastUpdated: hkoWarning.lastUpdated ?? new Date().toISOString(),
      isActive: hkoWarning.isActive ?? true,
      source: 'HKO'
    };
  }

  /**
   * Analyze local conditions for potential warnings
   */
  private analyzeLocalConditions(forecast: any): MarineWarning[] {
    const warnings: MarineWarning[] = [];
    const now = new Date();

    // Check for gale-force winds (≥34 knots)
    if (forecast.windSpeed >= 34) {
      const galeWarning: MarineWarning = {
        id: `local-gale-${forecast.areaId}-${now.getTime()}`,
        type: 'gale',
        severity: forecast.windSpeed >= 48 ? 'warning' : 'watch',
        title: `Gale Warning - ${forecast.areaName}`,
        description: `Gale-force winds of ${forecast.windSpeed} knots detected in ${forecast.areaName}. Mariners should exercise extreme caution.`,
        affectedAreas: [forecast.areaName],
        coordinates: [forecast.centerCoordinate],
        windSpeed: forecast.windSpeed,
        waveHeight: forecast.waveHeight,
        validFrom: now.toISOString(),
        validUntil: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours
        issuedAt: now.toISOString(),
        lastUpdated: now.toISOString(),
        isActive: true,
        source: 'Local'
      };
      warnings.push(galeWarning);
    }

    // Check for storm conditions (≥48 knots)
    if (forecast.windSpeed >= 48) {
      const stormWarning: MarineWarning = {
        id: `local-storm-${forecast.areaId}-${now.getTime()}`,
        type: 'storm',
        severity: 'warning',
        title: `Storm Warning - ${forecast.areaName}`,
        description: `Storm-force winds of ${forecast.windSpeed} knots in ${forecast.areaName}. All marine activities should be suspended.`,
        affectedAreas: [forecast.areaName],
        coordinates: [forecast.centerCoordinate],
        windSpeed: forecast.windSpeed,
        waveHeight: forecast.waveHeight,
        validFrom: now.toISOString(),
        validUntil: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours
        issuedAt: now.toISOString(),
        lastUpdated: now.toISOString(),
        isActive: true,
        source: 'Local'
      };
      warnings.push(stormWarning);
    }

    // Check for dangerous sea conditions (high waves)
    if ((forecast.waveHeight || 0) >= 3.0) {
      const seaWarning: MarineWarning = {
        id: `local-sea-${forecast.areaId}-${now.getTime()}`,
        type: 'sea-conditions',
        severity: (forecast.waveHeight || 0) >= 5.0 ? 'warning' : 'advisory',
        title: `Dangerous Sea Conditions - ${forecast.areaName}`,
        description: `High waves of ${forecast.waveHeight}m in ${forecast.areaName}. Small craft should remain in harbor.`,
        affectedAreas: [forecast.areaName],
        coordinates: [forecast.centerCoordinate],
        windSpeed: forecast.windSpeed,
        waveHeight: forecast.waveHeight,
        validFrom: now.toISOString(),
        validUntil: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
        issuedAt: now.toISOString(),
        lastUpdated: now.toISOString(),
        isActive: true,
        source: 'Local'
      };
      warnings.push(seaWarning);
    }

    return warnings;
  }

  /**
   * Map HKO warning types to our warning types
   */
  private mapHKOWarningType(hkoType: string): WarningType {
    switch (hkoType.toLowerCase()) {
      case 'gale': return 'gale';
      case 'storm': return 'storm';
      case 'typhoon': return 'typhoon';
      case 'fog': return 'fog';
      case 'visibility': return 'visibility';
      case 'sea': return 'sea-conditions';
      default: return 'gale';
    }
  }

  /**
   * Map HKO severity to our severity levels
   */
  private mapHKOSeverity(hkoSeverity: string): WarningSeverity {
    switch (hkoSeverity.toLowerCase()) {
      case 'severe': return 'severe';
      case 'warning': return 'warning';
      case 'watch': return 'watch';
      case 'advisory': return 'advisory';
      default: return 'normal';
    }
  }

  /**
   * Get coordinates for affected areas
   */
  private getCoordinatesForAreas(areaNames: string[]): LocationCoordinate[] {
    const coordinates: LocationCoordinate[] = [];

    areaNames.forEach(areaName => {
      const area = HK_MARINE_WARNING_AREAS.find(area =>
        area.name.toLowerCase().includes(areaName.toLowerCase()) ||
        areaName.toLowerCase().includes(area.name.toLowerCase())
      );
      if (area) {
        coordinates.push(...area.coordinates);
      }
    });

    return coordinates;
  }

  /**
   * Check if warning should trigger an alert
   */
  private checkForAlert(warning: MarineWarning): void {
    if (!warning.isActive) return;

    const alertLevel = this.getAlertLevel(warning);
    const shouldNotify = alertLevel !== 'info';

    const alert: WarningAlert = {
      id: `alert-${warning.id}`,
      warning,
      alertLevel,
      shouldNotify,
    };

    this.alerts.set(alert.id, alert);

    if (shouldNotify) {
    }
  }

  /**
   * Determine alert level based on warning severity and conditions
   */
  private getAlertLevel(warning: MarineWarning): WarningAlert['alertLevel'] {
    switch (warning.severity) {
      case 'severe':
        return 'critical';
      case 'warning':
        return (warning.windSpeed || 0) >= 48 ? 'high' : 'medium';
      case 'watch':
        return 'medium';
      case 'advisory':
        return 'low';
      default:
        return 'info';
    }
  }

  /**
   * Clean up expired warnings
   */
  private cleanupExpiredWarnings(): void {
    const now = new Date();
    const expiredWarnings: string[] = [];

    this.warnings.forEach((warning, id) => {
      const validUntil = new Date(warning.validUntil);
      if (now > validUntil) {
        expiredWarnings.push(id);
      }
    });

    expiredWarnings.forEach(id => {
      this.warnings.delete(id);
      this.alerts.delete(`alert-${id}`);
    });

    if (expiredWarnings.length > 0) {
    }
  }

  /**
   * Add warning listener
   */
  addWarningListener(callback: (warnings: MarineWarning[]) => void): () => void {
    this.listeners.push(callback);

    // Immediately notify with current warnings
    callback(Array.from(this.warnings.values()));

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of warning updates
   */
  private notifyListeners(): void {
    const warningsList = Array.from(this.warnings.values());
    this.listeners.forEach(callback => {
      try {
        callback(warningsList);
      } catch (error) {
      }
    });
  }

  /**
   * Get all active warnings
   */
  getActiveWarnings(): MarineWarning[] {
    return Array.from(this.warnings.values()).filter(warning => warning.isActive);
  }

  /**
   * Get warnings for specific area
   */
  getWarningsForArea(areaName: string): MarineWarning[] {
    return this.getActiveWarnings().filter(warning =>
      warning.affectedAreas.some(area =>
        area.toLowerCase().includes(areaName.toLowerCase()) ||
        areaName.toLowerCase().includes(area.toLowerCase())
      )
    );
  }

  /**
   * Get warnings by severity
   */
  getWarningsBySeverity(severity: WarningSeverity): MarineWarning[] {
    return this.getActiveWarnings().filter(warning => warning.severity === severity);
  }

  /**
   * Get highest severity level of active warnings
   */
  getHighestSeverityLevel(): WarningSeverity {
    const warnings = this.getActiveWarnings();
    if (warnings.length === 0) return 'normal';

    const severityOrder: WarningSeverity[] = ['severe', 'warning', 'watch', 'advisory', 'normal'];

    for (const severity of severityOrder) {
      if (warnings.some(warning => warning.severity === severity)) {
        return severity;
      }
    }

    return 'normal';
  }

  /**
   * Get all alerts requiring notification
   */
  getPendingAlerts(): WarningAlert[] {
    return Array.from(this.alerts.values()).filter(alert =>
      alert.shouldNotify && !alert.acknowledgedAt
    );
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.acknowledgedAt = new Date().toISOString();
    }
  }

  /**
   * Force refresh warnings
   */
  async refreshWarnings(): Promise<MarineWarning[]> {
    await this.fetchMarineWarnings();
    return this.getActiveWarnings();
  }

  /**
   * Get polling status
   */
  getPollingStatus(): { enabled: boolean; interval: number } {
    return {
      enabled: this.pollingEnabled,
      interval: this.updateInterval
    };
  }

  /**
   * Clean up service
   */
  cleanup(): void {
    this.stopWarningPolling();
    this.warnings.clear();
    this.alerts.clear();
    this.listeners.length = 0;
  }
}

// Export singleton instance
export const marineWarningService = new MarineWarningService();
export default marineWarningService;