import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { errorHandler } from './errorHandler';
import { weatherManager } from './weatherManager';
import { notificationService } from './notificationService';

export interface OfflineAction {
  id: string;
  type: 'weather_request' | 'schedule_update' | 'results_sync' | 'social_interaction' | 'analytics_event';
  timestamp: string;
  data: any;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'medium' | 'high';
  userId?: string;
}

export interface CachedData {
  key: string;
  data: any;
  timestamp: string;
  expiresAt: string;
  priority: 'critical' | 'important' | 'standard';
  size: number;
}

export interface OfflineStatus {
  isConnected: boolean;
  connectionType: string;
  isInternetReachable: boolean;
  syncQueueLength: number;
  lastSyncTime: string;
  cacheSize: number;
}

export interface SyncResult {
  success: boolean;
  processedActions: number;
  failedActions: number;
  errors: string[];
}

export class OfflineManager {
  private isOnline: boolean = true;
  private connectionType: string = 'unknown';
  private syncQueue: OfflineAction[] = [];
  private cache: Map<string, CachedData> = new Map();
  private syncInProgress: boolean = false;
  private readonly maxCacheSize = 10 * 1024 * 1024; // 10MB
  private readonly maxRetries = 3;
  private listeners: Array<(status: OfflineStatus) => void> = [];

  constructor() {
    this.initializeNetworkMonitoring();
    this.loadOfflineData();
  }

  async initialize(): Promise<void> {
    try {
      await this.loadOfflineData();
      await this.initializeNetworkMonitoring();
      await this.setupBackgroundSync();
    } catch (error) {
    }
  }

  private async initializeNetworkMonitoring(): Promise<void> {
    try {
      // Get initial network state
      const state = await NetInfo.fetch();
      this.updateNetworkStatus(state);

      // Subscribe to network state changes
      NetInfo.addEventListener(this.updateNetworkStatus.bind(this));
    } catch (error) {
    }
  }

  private updateNetworkStatus(state: NetInfoState): void {
    const wasOnline = this.isOnline;
    this.isOnline = state.isConnected === true && state.isInternetReachable === true;
    this.connectionType = state.type || 'unknown';


    // Notify listeners
    this.notifyStatusChange();

    // If we just came back online, sync queued actions
    if (!wasOnline && this.isOnline && this.syncQueue.length > 0) {
      this.processSyncQueue();
    }
  }

  // Critical data caching
  async cacheData(key: string, data: any, options: {
    priority?: 'critical' | 'important' | 'standard';
    expiresIn?: number; // minutes
  } = {}): Promise<void> {
    try {
      const priority = options.priority || 'standard';
      const expiresIn = options.expiresIn || 60; // 1 hour default
      
      const cachedData: CachedData = {
        key,
        data,
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + expiresIn * 60 * 1000).toISOString(),
        priority,
        size: JSON.stringify(data).length
      };

      this.cache.set(key, cachedData);
      await this.maintainCacheSize();
      await this.saveOfflineData();
    } catch (error) {
    }
  }

  async getCachedData(key: string): Promise<any | null> {
    try {
      const cached = this.cache.get(key);
      if (!cached) return null;

      // Check if expired
      if (new Date(cached.expiresAt) < new Date()) {
        this.cache.delete(key);
        return null;
      }

      return cached.data;
    } catch (error) {
      return null;
    }
  }

  // Offline notice reading and schedule access
  async getCriticalScheduleData(): Promise<any> {
    const cachedSchedule = await this.getCachedData('critical_schedule');
    if (cachedSchedule) return cachedSchedule;

    // Return minimal offline schedule data
    return {
      events: [],
      lastUpdated: new Date().toISOString(),
      isOfflineData: true,
      message: 'Limited schedule data available offline'
    };
  }

  async getCriticalWeatherData(): Promise<any> {
    const cachedWeather = await this.getCachedData('critical_weather');
    if (cachedWeather) return cachedWeather;

    // Return minimal offline weather data
    return {
      temperature: null,
      windSpeed: null,
      conditions: 'Weather data unavailable offline',
      timestamp: new Date().toISOString(),
      isOfflineData: true
    };
  }

  async getCriticalNotices(): Promise<any[]> {
    const cachedNotices = await this.getCachedData('critical_notices');
    if (cachedNotices) return cachedNotices;

    return [{
      id: 'offline_notice',
      title: 'Offline Mode',
      content: 'You are currently offline. Some features may be limited.',
      priority: 'high',
      timestamp: new Date().toISOString()
    }];
  }

  // Sync queue management
  async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    try {
      const queuedAction: OfflineAction = {
        ...action,
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        retryCount: 0,
        maxRetries: action.maxRetries || this.maxRetries,
      };

      this.syncQueue.push(queuedAction);
      await this.saveOfflineData();

      // If online, try to process immediately
      if (this.isOnline) {
        this.processSyncQueue();
      }
    } catch (error) {
    }
  }

  private async processSyncQueue(): Promise<SyncResult> {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return { success: true, processedActions: 0, failedActions: 0, errors: [] };
    }

    this.syncInProgress = true;
    const result: SyncResult = {
      success: true,
      processedActions: 0,
      failedActions: 0,
      errors: []
    };

    try {
      // Sort by priority and timestamp
      this.syncQueue.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });

      const actionsToProcess = [...this.syncQueue];
      this.syncQueue = [];

      for (const action of actionsToProcess) {
        try {
          await this.processAction(action);
          result.processedActions++;
        } catch (error) {
          result.failedActions++;
          result.errors.push(`${action.type}: ${(error as Error).message}`);
          
          // Retry logic
          if (action.retryCount < action.maxRetries) {
            action.retryCount++;
            this.syncQueue.push(action);
          } else {
          }
        }
      }

      await this.saveOfflineData();
      this.notifyStatusChange();

    } catch (error) {
      result.success = false;
    } finally {
      this.syncInProgress = false;
    }

    return result;
  }

  private async processAction(action: OfflineAction): Promise<void> {
    switch (action.type) {
      case 'weather_request':
        await this.processWeatherRequest(action.data);
        break;
      case 'schedule_update':
        await this.processScheduleUpdate(action.data);
        break;
      case 'results_sync':
        await this.processResultsSync(action.data);
        break;
      case 'social_interaction':
        await this.processSocialInteraction(action.data);
        break;
      case 'analytics_event':
        await this.processAnalyticsEvent(action.data);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async processWeatherRequest(data: any): Promise<void> {
    // Process queued weather request
    await weatherManager.updateWeatherData(data);
  }

  private async processScheduleUpdate(data: any): Promise<void> {
    // Process queued schedule update
  }

  private async processResultsSync(data: any): Promise<void> {
    // Process queued results sync
  }

  private async processSocialInteraction(data: any): Promise<void> {
    // Process queued social interaction
  }

  private async processAnalyticsEvent(data: any): Promise<void> {
    // Process queued analytics event
  }

  // Graceful degradation
  getOfflineFeatureStatus(): Record<string, boolean> {
    return {
      schedule: true, // Basic schedule always available
      weather: !!this.getCachedData('critical_weather'),
      results: !!this.getCachedData('results'),
      social: false, // Requires internet
      notifications: true, // Local notifications work offline
      maps: false, // Requires internet
      liveData: false // Requires internet
    };
  }

  getOfflineMessage(feature: string): string {
    const messages: Record<string, string> = {
      weather: 'Weather data limited offline. Last update from cache.',
      social: 'Social features require internet connection.',
      maps: 'Maps require internet connection.',
      liveData: 'Live data requires internet connection.',
      general: 'You are currently offline. Some features may be limited.'
    };
    
    return messages[feature] || messages.general;
  }

  // Background sync setup
  private async setupBackgroundSync(): Promise<void> {
    // Set up periodic sync attempts
    setInterval(async () => {
      if (this.isOnline && this.syncQueue.length > 0) {
        await this.processSyncQueue();
      }
    }, 30000); // Try sync every 30 seconds

    // Clean up expired cache entries
    setInterval(async () => {
      await this.cleanExpiredCache();
    }, 300000); // Clean cache every 5 minutes
  }

  private async cleanExpiredCache(): Promise<void> {
    try {
      const now = new Date();
      const expiredKeys: string[] = [];

      for (const [key, cached] of this.cache.entries()) {
        if (new Date(cached.expiresAt) < now) {
          expiredKeys.push(key);
        }
      }

      for (const key of expiredKeys) {
        this.cache.delete(key);
      }

      if (expiredKeys.length > 0) {
        await this.saveOfflineData();
      }
    } catch (error) {
    }
  }

  private async maintainCacheSize(): Promise<void> {
    const currentSize = this.getCurrentCacheSize();
    if (currentSize <= this.maxCacheSize) return;

    // Remove oldest non-critical items first
    const sortedEntries = Array.from(this.cache.entries())
      .sort((a, b) => {
        // Critical items last
        if (a[1].priority === 'critical' && b[1].priority !== 'critical') return 1;
        if (b[1].priority === 'critical' && a[1].priority !== 'critical') return -1;
        
        // Then by timestamp (oldest first)
        return new Date(a[1].timestamp).getTime() - new Date(b[1].timestamp).getTime();
      });

    let removedSize = 0;
    const targetReduction = currentSize - (this.maxCacheSize * 0.8); // Reduce to 80% of max

    for (const [key, cached] of sortedEntries) {
      if (removedSize >= targetReduction) break;
      if (cached.priority === 'critical') continue; // Don't remove critical data
      
      this.cache.delete(key);
      removedSize += cached.size;
    }

  }

  private getCurrentCacheSize(): number {
    return Array.from(this.cache.values()).reduce((total, cached) => total + cached.size, 0);
  }

  // Status and monitoring
  getStatus(): OfflineStatus {
    return {
      isConnected: this.isOnline,
      connectionType: this.connectionType,
      isInternetReachable: this.isOnline,
      syncQueueLength: this.syncQueue.length,
      lastSyncTime: new Date().toISOString(),
      cacheSize: this.getCurrentCacheSize()
    };
  }

  onStatusChange(callback: (status: OfflineStatus) => void): () => void {
    this.listeners.push(callback);
    callback(this.getStatus()); // Call immediately with current status
    
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyStatusChange(): void {
    const status = this.getStatus();
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
      }
    });
  }

  // Storage management
  private async loadOfflineData(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('offline_data');
      if (data) {
        const parsed = JSON.parse(data);
        
        if (parsed.syncQueue) {
          this.syncQueue = parsed.syncQueue;
        }
        
        if (parsed.cache) {
          this.cache = new Map(Object.entries(parsed.cache));
        }
      }
    } catch (error) {
    }
  }

  private async saveOfflineData(): Promise<void> {
    try {
      const data = {
        syncQueue: this.syncQueue,
        cache: Object.fromEntries(this.cache)
      };
      
      await AsyncStorage.setItem('offline_data', JSON.stringify(data));
    } catch (error) {
    }
  }

  // Utility methods
  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public utility methods
  async clearCache(): Promise<void> {
    this.cache.clear();
    await this.saveOfflineData();
  }

  async clearSyncQueue(): Promise<void> {
    this.syncQueue = [];
    await this.saveOfflineData();
  }

  async forceSyncNow(): Promise<SyncResult> {
    if (!this.isOnline) {
      return {
        success: false,
        processedActions: 0,
        failedActions: 0,
        errors: ['Device is offline']
      };
    }
    
    return await this.processSyncQueue();
  }

  getCacheStats(): {
    totalItems: number;
    totalSize: number;
    sizeByPriority: Record<string, number>;
    oldestItem: string;
  } {
    const items = Array.from(this.cache.values());
    const sizeByPriority = items.reduce((acc, item) => {
      acc[item.priority] = (acc[item.priority] || 0) + item.size;
      return acc;
    }, {} as Record<string, number>);

    const oldestItem = items
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0]?.timestamp || 'none';

    return {
      totalItems: items.length,
      totalSize: this.getCurrentCacheSize(),
      sizeByPriority,
      oldestItem
    };
  }

  // Critical data pre-caching
  async precacheCriticalData(): Promise<void> {
    try {
      // Pre-cache critical schedule data
      const scheduleData = await this.getCriticalScheduleData();
      await this.cacheData('critical_schedule', scheduleData, { priority: 'critical', expiresIn: 1440 }); // 24 hours

      // Pre-cache critical weather data
      const weatherData = await this.getCriticalWeatherData();
      await this.cacheData('critical_weather', weatherData, { priority: 'critical', expiresIn: 60 }); // 1 hour

      // Pre-cache critical notices
      const notices = await this.getCriticalNotices();
      await this.cacheData('critical_notices', notices, { priority: 'critical', expiresIn: 720 }); // 12 hours

    } catch (error) {
    }
  }
}

export const offlineManager = new OfflineManager();