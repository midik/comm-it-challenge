import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as fs from 'fs';
import * as path from 'path';
import { EventsService } from '../events/events.service';
import { EventType } from '../../../../libs/common/src';

@Injectable()
export class PublicApiService {
  private readonly logger = new Logger(PublicApiService.name);
  private readonly dataDir = path.join(process.cwd(), 'data');

  constructor(
    private readonly httpService: HttpService,
    private readonly eventsService: EventsService,
  ) {
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  async fetchDataFromPublicApi(apiUrl: string, params: Record<string, string> = {}): Promise<string> {
    const startTime = Date.now();

    try {
      this.logger.log(`Fetching data from: ${apiUrl}`);

      // Record the API request event
      await this.eventsService.recordEvent({
        type: EventType.API_REQUEST,
        service: 'service-a',
        request: { url: apiUrl, params },
        timestamp: new Date(),
      });

      // Make the API request
      const response = await firstValueFrom(
        this.httpService.get(apiUrl, { params }) as any
      );

      // Generate a unique filename
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const filename = `data_${timestamp}.json`;
      const filePath = path.join(this.dataDir, filename);

      // Ensure we have a response with data
      const responseData = response && typeof response === 'object' ? (response as any).data || {} : {};
      
      // Write the data to a file
      fs.writeFileSync(filePath, JSON.stringify(responseData));

      const executionTime = Date.now() - startTime;

      // Record the API response event
      await this.eventsService.recordEvent({
        type: EventType.API_RESPONSE,
        service: 'service-a',
        request: { url: apiUrl, params },
        response: { 
          status: response && typeof response === 'object' ? (response as any).status : 'unknown',
          filename 
        },
        executionTime,
        timestamp: new Date(),
      });

      this.logger.log(`Data saved to: ${filename}`);
      return filename;
    } catch (error) {
      this.logger.error(`Error fetching data: ${error.message}`);

      // Record the error event
      await this.eventsService.recordEvent({
        type: EventType.API_RESPONSE,
        service: 'service-a',
        request: { url: apiUrl, params },
        response: { error: error.message },
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  getFilePath(filename: string): string {
    return path.join(this.dataDir, filename);
  }
}
