import { ApiProperty } from '@nestjs/swagger';

export enum EventType {
  API_REQUEST = 'API_REQUEST',
  API_RESPONSE = 'API_RESPONSE',
  FILE_DOWNLOAD = 'FILE_DOWNLOAD',
  FILE_UPLOAD = 'FILE_UPLOAD',
  FILE_PARSE = 'FILE_PARSE',
  DB_SEARCH = 'DB_SEARCH',
}

export class EventDto {
  @ApiProperty({ description: 'Unique identifier for the event' })
  id: string;

  @ApiProperty({ 
    enum: EventType, 
    description: 'Type of event that occurred' 
  })
  type: EventType;

  @ApiProperty({ description: 'Timestamp when the event occurred' })
  timestamp: Date;

  @ApiProperty({ description: 'Service that generated the event' })
  service: string;

  @ApiProperty({ description: 'Request details if applicable' })
  request?: any;

  @ApiProperty({ description: 'Response details if applicable' })
  response?: any;

  @ApiProperty({ description: 'Execution time in milliseconds' })
  executionTime?: number;

  @ApiProperty({ description: 'Additional metadata about the event' })
  metadata?: Record<string, any>;
}