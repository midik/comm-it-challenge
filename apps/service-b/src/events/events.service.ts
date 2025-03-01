import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MqttService } from '../../../../libs/common/src';
import { DatabaseService } from '../../../../libs/common/src';
import { EventDto, EventType } from '../../../../libs/common/src';

@Injectable()
export class EventsService implements OnModuleInit {
  private readonly logger = new Logger(EventsService.name);
  private readonly EVENTS_COLLECTION = 'events';

  constructor(
    private readonly mqttService: MqttService,
    private readonly databaseService: DatabaseService,
  ) {}

  onModuleInit() {
    // Subscribe to all event types
    const topics = Object.values(EventType).map(
      (type) => `service-a/events/${type}`,
    );

    topics.forEach((topic) => {
      this.mqttService.subscribe(topic, (message: string) => {
        try {
          const event = JSON.parse(message) as EventDto;
          this.handleEvent(event).catch((error) => {
            this.logger.error(`Error handling event message: ${error.message}`);
          });
        } catch (error) {
          this.logger.error(`Error parsing event message: ${error.message}`);
        }
      });

      this.logger.log(`Subscribed to topic: ${topic}`);
    });

    // Subscribe to wildcard topic for any events
    this.mqttService.subscribe('service-a/events/#', (message: string) => {
      try {
        const event = JSON.parse(message) as EventDto;
        this.handleEvent(event);
      } catch (error) {
        this.logger.error(
          `Error processing wildcard event message: ${error.message}`,
        );
      }
    });

    this.logger.log('Event subscriptions initialized');
  }

  private async handleEvent(event: EventDto) {
    try {
      // Store the event in MongoDB
      const collection = this.databaseService.getCollection(
        this.EVENTS_COLLECTION,
      );
      await collection.insertOne({
        ...event,
        receivedAt: new Date(),
      });

      this.logger.log(`Event stored: ${event.type} (${event.id})`);
    } catch (error) {
      this.logger.error(`Failed to store event: ${error.message}`);
    }
  }

  async getEventById(id: string): Promise<EventDto | null> {
    try {
      const collection = this.databaseService.getCollection(
        this.EVENTS_COLLECTION,
      );
      const result = await collection.findOne({ id });

      if (!result) {
        return null;
      }

      // Convert MongoDB document to EventDto
      return {
        id: result.id,
        type: result.type,
        timestamp: result.timestamp,
        service: result.service,
        request: result.request,
        response: result.response,
        executionTime: result.executionTime,
        metadata: result.metadata,
      } as EventDto;
    } catch (error) {
      this.logger.error(`Failed to get event by ID: ${error.message}`);
      return null;
    }
  }
}
