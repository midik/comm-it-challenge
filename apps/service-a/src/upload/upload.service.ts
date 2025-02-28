import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';
import { DatabaseService } from '../../../../libs/common/src/database';
import { EventsService } from '../events/events.service';
import { EventType } from '../../../../libs/common/src/dto/event.dto';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private readonly BATCH_SIZE = 1000; // Number of documents to insert in one batch

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly eventsService: EventsService,
  ) {}

  async parseAndInsertFile(filename: string, collection: string): Promise<{ count: number, elapsedTime: number }> {
    const startTime = Date.now();
    const filePath = path.join(this.uploadDir, filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    
    await this.eventsService.recordEvent({
      type: EventType.FILE_PARSE,
      service: 'service-a',
      request: { filename, collection },
      timestamp: new Date(),
    });
    
    let data: any[] = [];
    const extension = path.extname(filename).toLowerCase();
    
    if (extension === '.json') {
      data = await this.parseJsonFile(filePath);
    } else if (['.xlsx', '.xls'].includes(extension)) {
      data = await this.parseExcelFile(filePath);
    } else {
      throw new Error('Unsupported file format. Only JSON and Excel files are supported.');
    }
    
    const insertedCount = await this.insertDataToMongo(data, collection);
    const elapsedTime = Date.now() - startTime;
    
    await this.eventsService.recordEvent({
      type: EventType.FILE_UPLOAD,
      service: 'service-a',
      request: { filename, collection },
      response: { count: insertedCount },
      executionTime: elapsedTime,
      timestamp: new Date(),
    });
    
    return { count: insertedCount, elapsedTime };
  }

  private async parseJsonFile(filePath: string): Promise<any[]> {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(fileContent);
      
      // Handle different JSON structures
      if (Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object') {
        // Check if the JSON has a data property that is an array
        if (data.data && Array.isArray(data.data)) {
          return data.data;
        }
        
        // Check if the JSON has any property that is an array
        for (const key of Object.keys(data)) {
          if (Array.isArray(data[key])) {
            return data[key];
          }
        }
        
        // If no arrays found, return the object as a single item array
        return [data];
      }
      
      throw new Error('Invalid JSON structure');
    } catch (error) {
      this.logger.error(`Error parsing JSON file: ${error.message}`);
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
  }

  private async parseExcelFile(filePath: string): Promise<any[]> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      
      const worksheet = workbook.worksheets[0];
      const result: any[] = [];
      
      // Get header row
      const headers: string[] = [];
      worksheet.getRow(1).eachCell((cell, colNumber) => {
        headers[colNumber - 1] = cell.value as string;
      });
      
      // Process each row
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) { // Skip header row
          const rowData: Record<string, any> = {};
          
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            rowData[header] = cell.value;
          });
          
          result.push(rowData);
        }
      });
      
      return result;
    } catch (error) {
      this.logger.error(`Error parsing Excel file: ${error.message}`);
      throw new Error(`Failed to parse Excel: ${error.message}`);
    }
  }

  private async insertDataToMongo(data: any[], collectionName: string): Promise<number> {
    try {
      const collection = this.databaseService.getCollection(collectionName);
      
      // Create indexes for efficient searching
      await collection.createIndex({ _id: 1 });
      
      // Determine fields to index based on the first document
      if (data.length > 0) {
        const sampleDoc = data[0];
        for (const key of Object.keys(sampleDoc)) {
          // Index fields that are likely to be searched
          if (
            typeof sampleDoc[key] === 'string' || 
            typeof sampleDoc[key] === 'number' ||
            sampleDoc[key] instanceof Date
          ) {
            await collection.createIndex({ [key]: 1 });
          }
        }
      }
      
      // Insert data in batches
      let insertedCount = 0;
      for (let i = 0; i < data.length; i += this.BATCH_SIZE) {
        const batch = data.slice(i, i + this.BATCH_SIZE);
        const result = await collection.insertMany(batch, { ordered: false });
        insertedCount += result.insertedCount;
        
        this.logger.log(`Inserted batch ${i / this.BATCH_SIZE + 1}: ${result.insertedCount} documents`);
      }
      
      this.logger.log(`Total inserted: ${insertedCount} documents into ${collectionName}`);
      return insertedCount;
    } catch (error) {
      this.logger.error(`Error inserting data to MongoDB: ${error.message}`);
      throw new Error(`Failed to insert data: ${error.message}`);
    }
  }
}