import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';

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
    return this.db;
  }

  getCollection(name: string) {
    return this.db.collection(name);
  }
}