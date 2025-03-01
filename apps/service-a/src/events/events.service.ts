import { Injectable, Logger } from '@nestjs/common';
import { MqttService } from '../../../../libs/common/src';
import { RedisService } from '../../../../libs/common/src';
import { EventDto, EventType } from '../../../../libs/common/src';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private readonly topicPrefix = 'service-a/events';

  constructor(
    private readonly mqttService: MqttService,
    private readonly redisService: RedisService,
  ) {}

  async recordEvent(eventData: Partial<EventDto>): Promise<EventDto> {
    try {
      // Ensure event type is not undefined
      const type = eventData.type || EventType.API_REQUEST;

      const event: EventDto = {
        id: uuidv4(),
        timestamp: new Date(),
        service: 'service-a',
        type, // Ensure type is always defined
        ...eventData,
      };

      // Publish to MQTT for service-b to consume
      await this.mqttService.publish(`${this.topicPrefix}/${event.type}`, event);

      // Log to Redis TimeSeries
      await this.logToRedisTimeSeries(event);

      this.logger.log(`Event published: ${event.type} (${event.id})`);
      return event;
    } catch (error) {
      this.logger.error(`Failed to record event: ${error.message}`);
      throw error;
    }
  }

  private async logToRedisTimeSeries(event: EventDto): Promise<void> {
    const timestamp = Math.floor(event.timestamp.getTime());
    const key = `events:${event.type}:${event.service}`;

    try {
      // Create time series if it doesn't exist (with 7 days retention)
      try {
        await this.redisService.tsCreate(key, {
          retention: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
          labels: {
            type: event.type,
            service: event.service,
          },
        });
      } catch (error) {
        // Ignore error if time series already exists
      }

      // Add event execution time to time series
      await this.redisService.tsAdd(
        key,
        timestamp,
        event.executionTime || 0
      );

      // Store event details in Redis (for 7 days)
      await this.redisService.getClient().set(
        `event:${event.id}`,
        JSON.stringify(event),
        {
          EX: 7 * 24 * 60 * 60 // 7 days in seconds
        }
      );
    } catch (error) {
      this.logger.error(`Failed to log event to Redis: ${error.message}`);
    }
  }
}
