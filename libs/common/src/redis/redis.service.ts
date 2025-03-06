import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URI || 'redis://localhost:6379'
    });

    // In debug mode, log only the first few errors to avoid flooding the console
    let errorCount = 0;
    this.client.on('error', (err) => {
      console.error('Redis Client Error', err);

      // const isDebugMode = process.execArgv.some(arg =>
      //   arg.includes('--inspect') || arg.includes('ts-node')
      // );
      //
      // if (!isDebugMode || errorCount < 3) {
      //   console.error('Redis Client Error', err);
      //   errorCount++;
      //
      //   if (isDebugMode && errorCount === 3) {
      //     console.log('Suppressing further Redis connection errors in development mode...');
      //   }
      // }
    });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
      console.log('Connected to Redis');
    } catch (error) {
      console.error('Failed to connect to Redis', error);
      throw error;

      // // In development mode, don't throw an error
      // const isDebugMode = process.execArgv.some(arg =>
      //   arg.includes('--inspect') || arg.includes('ts-node')
      // );
      //
      // if (!isDebugMode) {
      //   throw error;
      // } else {
      //   console.log('Running in debug/2development mode, continuing without Redis');
      // }
    }
  }

  async onModuleDestroy() {
    try {
      await this.client.disconnect();
      console.log('Disconnected from Redis');
    } catch (error) {
      console.error('Error while disconnecting from Redis', error);
    }
  }

  getClient(): RedisClientType {
    // if (!this.client.isOpen) {
    //   console.warn('Redis is not connected. Using mock client in development mode.');
    //   return this.getMockClient();
    // }
    return this.client;
  }

  // Creates a mock client for development
  private getMockClient() {
    return {
      isOpen: false,
      isReady: false,
      get: async () => null,
      set: async () => 'OK',
      del: async () => 0,
      exists: async () => 0,
      sendCommand: async () => [],
    } as any;
  }

  // Helper method for TimeSeries operations
  async tsCreate(key: string, options: { retention?: number, labels?: Record<string, string> } = {}) {
    const args = ['TS.CREATE', key];

    if (options.retention) {
      args.push('RETENTION', options.retention.toString());
    }

    if (options.labels && Object.keys(options.labels).length > 0) {
      args.push('LABELS');
      for (const [label, value] of Object.entries(options.labels)) {
        args.push(label, value);
      }
    }

    try {
      return await this.client.sendCommand(args);
    } catch (error) {
      if (!this.client.isOpen) {
        console.warn(`Mock tsCreate for ${key}`);
        return 'OK';
      }
      throw error;
    }
  }

  async tsAdd(key: string, timestamp: number | '*', value: number) {
    try {
      return await this.client.sendCommand([
        'TS.ADD',
        key,
        timestamp === '*' ? '*' : timestamp.toString(),
        value.toString()
      ]);
    } catch (error) {
      if (!this.client.isOpen) {
        console.warn(`Mock tsAdd for ${key}`);
        return timestamp === '*' ? Date.now() : timestamp;
      }
      throw error;
    }
  }

  async tsRange(key: string, fromTimestamp: number, toTimestamp: number, options: { count?: number, aggregation?: { type: string, timeBucket: number } } = {}) {
    const args = ['TS.RANGE', key, fromTimestamp.toString(), toTimestamp.toString()];

    if (options.count) {
      args.push('COUNT', options.count.toString());
    }

    if (options.aggregation) {
      args.push('AGGREGATION', options.aggregation.type, options.aggregation.timeBucket.toString());
    }

    try {
      return await this.client.sendCommand(args);
    } catch (error) {
      if (!this.client.isOpen) {
        console.warn(`Mock tsRange for ${key}`);
        return [];
      }
      throw error;
    }
  }

  async tsMRange(fromTimestamp: number, toTimestamp: number, filter: string[], options: {
    count?: number,
    aggregation?: { type: string, timeBucket: number },
    withLabels?: boolean
  } = {}) {
    const args = ['TS.MRANGE', fromTimestamp.toString(), toTimestamp.toString()];

    if (options.count) {
      args.push('COUNT', options.count.toString());
    }

    if (options.aggregation) {
      args.push('AGGREGATION', options.aggregation.type, options.aggregation.timeBucket.toString());
    }

    if (options.withLabels) {
      args.push('WITHLABELS');
    }

    args.push('FILTER');
    filter.forEach(f => args.push(f));

    try {
      return await this.client.sendCommand(args);
    } catch (error) {
      if (!this.client.isOpen) {
        console.warn(`Mock tsMRange for filters: ${filter.join(', ')}`);
        // Return a mock response formatted like a time series with labels
        return [];
      }
      throw error;
    }
  }
}
