import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({ 
      url: process.env.REDIS_URI || 'redis://localhost:6379' 
    });

    this.client.on('error', (err) => console.error('Redis Client Error', err));
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
    
    return this.client.sendCommand(args);
  }

  async tsAdd(key: string, timestamp: number | '*', value: number) {
    return this.client.sendCommand([
      'TS.ADD', 
      key, 
      timestamp === '*' ? '*' : timestamp.toString(), 
      value.toString()
    ]);
  }

  async tsRange(key: string, fromTimestamp: number, toTimestamp: number, options: { count?: number, aggregation?: { type: string, timeBucket: number } } = {}) {
    const args = ['TS.RANGE', key, fromTimestamp.toString(), toTimestamp.toString()];
    
    if (options.count) {
      args.push('COUNT', options.count.toString());
    }
    
    if (options.aggregation) {
      args.push('AGGREGATION', options.aggregation.type, options.aggregation.timeBucket.toString());
    }
    
    return this.client.sendCommand(args);
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
    
    if (options.withLabels !== undefined) {
      args.push(options.withLabels ? 'WITHLABELS' : 'WITHLABELS');
    }
    
    args.push('FILTER');
    filter.forEach(f => args.push(f));
    
    return this.client.sendCommand(args);
  }
}