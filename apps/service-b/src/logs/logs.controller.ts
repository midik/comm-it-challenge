import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LogsService, TimeSeriesInfo } from './logs.service';
import { ApiLogFilterDto } from '../../../../libs/common/src';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

class PaginationQuery {
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  page?: number = 0;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;
}

@ApiTags('Logs')
@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated logs with filtering options' })
  @ApiResponse({ status: 200, description: 'Returns paginated logs' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getLogs(
    @Query() filter: ApiLogFilterDto,
    @Query() pagination: PaginationQuery,
  ) {
    try {
      return await this.logsService.getLogs(
        filter,
        pagination.page,
        pagination.limit,
      );
    } catch (error: any) {
      throw new HttpException(
        `Failed to get logs: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('timeseries')
  @ApiOperation({ summary: 'Get time series data for visualization' })
  @ApiResponse({ status: 200, description: 'Returns time series data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getTimeSeriesData(
    @Query() filter: ApiLogFilterDto,
  ): Promise<TimeSeriesInfo[]> {
    try {
      return await this.logsService.getTimeSeriesData(filter);
    } catch (error) {
      throw new HttpException(
        `Failed to get time series data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('distribution')
  @ApiOperation({ summary: 'Get event type distribution for visualization' })
  @ApiResponse({ status: 200, description: 'Returns event type distribution' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getEventTypeDistribution(@Query() filter: ApiLogFilterDto) {
    try {
      return {
        distribution: await this.logsService.getEventTypeDistribution(filter),
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get event type distribution: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
