import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { EventSubType } from '../dto';

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
    });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
      console.log('Connected to Redis');
    } catch (error) {
      console.error('Failed to connect to Redis', error);
      throw error;
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
    return this.client;
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

    return await this.client.sendCommand(args);
  }

  async tsAdd(key: string, timestamp: number | '*', value: number) {
    return await this.client.sendCommand([
      'TS.ADD',
      key,
      timestamp === '*' ? '*' : timestamp.toString(),
      value.toString()
    ]);
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

    args.push('WITHLABELS');

    args.push('FILTER');
    if (filter && filter.length > 0) {
      filter.forEach(f => args.push(f));
    } else {
      args.push(`subType=(${Object.values(EventSubType).join(',')})`);
    }

    return await this.client.sendCommand(args);
  }
}
