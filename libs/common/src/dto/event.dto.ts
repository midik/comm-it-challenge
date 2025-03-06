import { ApiProperty } from '@nestjs/swagger';

export enum EventType {
  FETCH_DATA = 'FETCH_DATA',
  FILE_DOWNLOAD = 'FILE_DOWNLOAD',
  FILE_UPLOAD = 'FILE_UPLOAD',
  DB_SEARCH = 'DB_SEARCH',
}

export enum EventSubType {
  REQUEST = 'REQUEST',
  RESPONSE = 'RESPONSE',
  ERROR = 'ERROR',
}

export class EventDto {
  @ApiProperty({ description: 'Unique identifier for the event' })
  id: string;

  @ApiProperty({
    enum: EventType,
    description: 'Type of event that occurred'
  })
  type: EventType;

  @ApiProperty({
    enum: EventSubType,
    description: 'Subtype of event'
  })
  subType: EventSubType;

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
