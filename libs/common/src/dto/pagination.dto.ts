import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @ApiProperty({ 
    description: 'Page number (0-indexed)', 
    default: 0,
    minimum: 0 
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  page?: number = 0;

  @ApiProperty({ 
    description: 'Number of items per page', 
    default: 10,
    minimum: 1,
    maximum: 100 
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;
}

export class PaginatedResponse<T> {
  @ApiProperty({ description: 'Data items' })
  items: T[];

  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Current page (0-indexed)' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  pages: number;

  constructor(items: T[], total: number, page: number, limit: number) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.pages = Math.ceil(total / limit);
  }
}