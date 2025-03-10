import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SearchService } from './search.service';
import { PaginationDto } from '../../../../libs/common/src';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @ApiOperation({ summary: 'Search documents in a collection' })
  @ApiQuery({
    name: 'collection',
    required: true,
    description: 'Collection name to search in',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        query: {
          type: 'object',
          description: 'MongoDB query object',
          example: { field: 'value' },
        },
        pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'number',
              description: 'Page number (0-indexed)',
              default: 0,
            },
            limit: {
              type: 'number',
              description: 'Items per page',
              default: 10,
            },
          },
        },
        sort: {
          type: 'object',
          description: 'MongoDB sort object',
          example: { field: 1 },
        },
        projection: {
          type: 'object',
          description: 'MongoDB projection object',
          example: { field: 1, _id: 0 },
        },
      },
      required: ['query'],
    },
  })
  @ApiResponse({ status: 200, description: 'Search results' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async search(
    @Query('collection') collection: string,
    @Body('query') query: Record<string, any> = {},
    @Body('pagination') pagination: PaginationDto = new PaginationDto(),
    @Body('sort') sort?: Record<string, number>,
    @Body('projection') projection?: Record<string, number>,
  ) {
    if (!collection) {
      throw new HttpException(
        'Collection name is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Convert sort to appropriate format if needed
      const formattedSort: [string, 'asc' | 'desc'][] | undefined = sort
        ? Object.entries(sort).map(([key, value]) => [
            key,
            value > 0 ? 'asc' : 'desc',
          ])
        : undefined;

      return await this.searchService.search(collection, query, {
        page: pagination.page,
        limit: pagination.limit,
        sort: formattedSort, // Type assertion to match service's expected type
        projection,
      });
    } catch (error) {
      throw new HttpException(
        `Search failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
