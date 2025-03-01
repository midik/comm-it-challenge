import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MongoClient, Db, Collection } from 'mongodb';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private client: MongoClient;
  private db: Db;

  constructor() {
    this.client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  }

  async onModuleInit() {
    try {
      await this.client.connect();
      this.db = this.client.db(process.env.MONGODB_DB || 'microservices');
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Failed to connect to MongoDB', error);
      throw error;

      // // In development mode, don't throw an error
      // const isDebugMode = process.execArgv.some(arg =>
      //   arg.includes('--inspect') || arg.includes('ts-node')
      // );

      // if (!isDebugMode) {
      //   throw error;
      // } else {
      //   console.log('Running in debug/development mode, continuing without MongoDB');
      // }
    }
  }

  async onModuleDestroy() {
    try {
      await this.client.close();
      console.log('Disconnected from MongoDB');
    } catch (error) {
      console.error('Error while disconnecting from MongoDB', error);
    }
  }

  getDb(): Db {
    // if (!this.db) {
    //   console.warn('MongoDB is not connected. Using a mock DB in development mode.');
    //   return {
    //     collection: () => this.getMockCollection()
    //   } as any;
    // }
    return this.db;
  }

  getCollection(name: string) {
    // if (!this.db) {
    //   console.warn(`MongoDB is not connected. Using a mock collection for '${name}' in development mode.`);
    //   return this.getMockCollection();
    // }
    return this.db.collection(name);
  }

  private getMockCollection() {
    const mockCursor = {
      toArray: async () => [],
      sort: () => mockCursor,
      skip: () => mockCursor,
      limit: () => mockCursor
    };

    return {
      // Mock collection methods for development
      find: () => mockCursor,
      findOne: async () => null,
      insertOne: async () => ({ insertedId: 'mock-id' }),
      insertMany: async (docs) => ({ insertedCount: docs.length }),
      updateOne: async () => ({ modifiedCount: 1 }),
      deleteOne: async () => ({ deletedCount: 1 }),
      countDocuments: async () => 0,
      // Add aggregate method for pipelines
      aggregate: (pipeline) => {
        console.log('Mock aggregate pipeline:', JSON.stringify(pipeline));
        return { toArray: async () => [] };
      }
    };
  }
}
