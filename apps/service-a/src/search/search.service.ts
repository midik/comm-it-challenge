import { Injectable, Logger } from '@nestjs/common';
import {
  DatabaseService,
  EventType,
  PaginatedResponse,
} from '../../../../libs/common/src';
import { EventsService } from '../events/events.service';
import { Collection, Document, Filter, Sort } from 'mongodb';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly eventsService: EventsService,
  ) {}

  async search<T extends Document>(
    collection: string,
    query: Filter<Document>,
    options: {
      page?: number;
      limit?: number;
      sort?: Sort;
      projection?: Document;
    } = {},
  ): Promise<PaginatedResponse<T>> {
    const startTime = Date.now();

    try {
      const { page = 0, limit = 10, sort, projection } = options;

      const mongoCollection = this.databaseService.getCollection(collection);

      // Execute count and find in parallel for better performance
      const [total, items] = await Promise.all([
        this.getDocumentCount(mongoCollection, query),
        this.findDocuments<T>(mongoCollection, query, {
          page,
          limit,
          sort,
          projection,
        }),
      ]);

      const result = new PaginatedResponse<T>(items, total, page, limit);

      const elapsedTime = Date.now() - startTime;

      // Record search event
      await this.eventsService.recordEvent({
        type: EventType.DB_SEARCH,
        service: 'service-a',
        request: { collection, query, options },
        response: { total, page, limit },
        executionTime: elapsedTime,
        timestamp: new Date(),
      });

      return result;
    } catch (error) {
      this.logger.error(`Search error in ${collection}: ${error.message}`);

      // Record error event
      await this.eventsService.recordEvent({
        type: EventType.DB_SEARCH,
        service: 'service-a',
        request: { collection, query, options },
        response: { error: error.message },
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  private async getDocumentCount(
    collection: Collection,
    query: Filter<Document>,
  ): Promise<number> {
    return collection.countDocuments(query);
  }

  private async findDocuments<T>(
    collection: Collection,
    query: Filter<Document>,
    options: {
      page: number;
      limit: number;
      sort?: Sort;
      projection?: Document;
    },
  ): Promise<T[]> {
    const { page, limit, sort, projection } = options;

    return collection
      .find(query, { projection })
      .sort(sort || { _id: 1 })
      .skip(page * limit)
      .limit(limit)
      .toArray() as Promise<T[]>;
  }

  async getCollections(): Promise<string[]> {
    const db = this.databaseService.getDb();
    const collections = await db.listCollections().toArray();
    return collections.map((c) => c.name);
  }
}
