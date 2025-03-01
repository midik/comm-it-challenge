import { Injectable, Logger } from '@nestjs/common';
import {
  ApiLogFilterDto,
  DatabaseService,
  PaginatedResponse,
  RedisService,
} from '../../../../libs/common/src';

export interface TimeSeriesDataPoint {
  timestamp: number;
  value: number;
}

export interface TimeSeriesInfo {
  type: string;
  service: string;
  from: number;
  to: number;
  data: TimeSeriesDataPoint[];
}

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly redisService: RedisService,
  ) {}

  async getLogs(
    filter: ApiLogFilterDto,
    page = 0,
    limit = 10,
  ): Promise<PaginatedResponse<any>> {
    try {
      const collection = this.databaseService.getCollection('events');

      // Build MongoDB query from filter
      const query: Record<string, any> = {};

      if (filter.startDate) {
        query.timestamp = query.timestamp || {};
        query.timestamp.$gte = new Date(filter.startDate);
      }

      if (filter.endDate) {
        query.timestamp = query.timestamp || {};
        query.timestamp.$lte = new Date(filter.endDate);
      }

      if (filter.type) {
        query.type = filter.type;
      }

      if (filter.service) {
        query.service = filter.service;
      }

      // Execute query
      const [total, items] = await Promise.all([
        collection.countDocuments(query),
        collection
          .find(query)
          .sort({ timestamp: -1 })
          .skip(page * limit)
          .limit(limit)
          .toArray(),
      ]);

      return new PaginatedResponse(items, total, page, limit);
    } catch (error) {
      this.logger.error(`Failed to get logs: ${error.message}`);
      throw error;
    }
  }

  async getTimeSeriesData(filter: ApiLogFilterDto): Promise<TimeSeriesInfo[]> {
    try {
      const startTimestamp = filter.startDate
        ? new Date(filter.startDate).getTime()
        : Date.now() - 24 * 60 * 60 * 1000; // Default to last 24 hours

      const endTimestamp = filter.endDate
        ? new Date(filter.endDate).getTime()
        : Date.now();

      // Build filter expressions for TS.MRANGE
      const filterExpressions: string[] = [];

      if (filter.type) {
        filterExpressions.push(`type=${filter.type}`);
      } else {
        // If no type specified, include all event types
        filterExpressions.push('type=*');
      }

      if (filter.service) {
        filterExpressions.push(`service=${filter.service}`);
      }

      // Execute Redis TimeSeries query
      const result = await this.redisService.tsMRange(
        startTimestamp,
        endTimestamp,
        filterExpressions.length > 0 ? filterExpressions : ['*'],
        {
          // Aggregate by 1-minute buckets for better visualization
          aggregation: { type: 'avg', timeBucket: 60000 },
          withLabels: true,
        },
      );

      // Transform result to our format
      const timeSeriesData: TimeSeriesInfo[] = [];

      if (Array.isArray(result)) {
        for (const series of result) {
          // Check if series is an array and has the expected structure
          if (series && Array.isArray(series) && series.length >= 3) {
            const key = series[0] as string;
            // First convert to unknown to avoid type errors
            const labels = series[1] as unknown as Record<string, string>;
            const values = series[2] as unknown as [number, number][];

            timeSeriesData.push({
              type: labels.type || key.split(':')[1] || 'unknown',
              service: labels.service || 'unknown',
              from: startTimestamp,
              to: endTimestamp,
              data: values.map(([timestamp, value]) => ({
                timestamp,
                value,
              })),
            });
          }
        }
      }

      return timeSeriesData;
    } catch (error) {
      this.logger.error(`Failed to get time series data: ${error.message}`);
      throw error;
    }
  }

  async getEventTypeDistribution(
    filter: ApiLogFilterDto,
  ): Promise<Record<string, number>> {
    try {
      const collection = this.databaseService.getCollection('events');

      // Build MongoDB query from filter
      const matchStage: Record<string, any> = {};

      if (filter.startDate) {
        matchStage.timestamp = matchStage.timestamp || {};
        matchStage.timestamp.$gte = new Date(filter.startDate);
      }

      if (filter.endDate) {
        matchStage.timestamp = matchStage.timestamp || {};
        matchStage.timestamp.$lte = new Date(filter.endDate);
      }

      if (filter.service) {
        matchStage.service = filter.service;
      }

      // Execute aggregation query
      const result = await collection
        .aggregate([
          { $match: matchStage },
          { $group: { _id: '$type', count: { $sum: 1 } } },
        ])
        .toArray();

      // Transform to desired format
      const distribution: Record<string, number> = {};

      for (const item of result) {
        distribution[item._id] = item.count;
      }

      return distribution;
    } catch (error) {
      this.logger.error(
        `Failed to get event type distribution: ${error.message}`,
      );
      throw error;
    }
  }
}
