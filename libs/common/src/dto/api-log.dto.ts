import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { EventSubType, EventType } from './event.dto';

export class ApiLogFilterDto {
  @ApiProperty({
    description: 'Start date to filter logs',
    required: false
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'End date to filter logs',
    required: false
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    enum: EventType,
    description: 'Type of event to filter',
    required: false
  })
  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @ApiProperty({
    enum: EventSubType,
    description: 'SubType of event to filter',
    required: false
  })
  @IsOptional()
  @IsEnum(EventSubType)
  subType?: EventSubType;

  @ApiProperty({
    description: 'Service that generated the event',
    required: false
  })
  @IsOptional()
  @IsString()
  service?: string;
}
