import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { PublicApiService } from './public-api.service';

@ApiTags('Public API')
@Controller('public-api')
export class PublicApiController {
  constructor(private readonly publicApiService: PublicApiService) {}

  @Get('fetch')
  @ApiOperation({ summary: 'Fetch data from external API' })
  @ApiQuery({
    name: 'url',
    required: true,
    description: 'URL of the external API',
  })
  @ApiQuery({
    name: 'params',
    required: false,
    description: 'Query parameters in JSON format',
  })
  @ApiResponse({ status: 200, description: 'Data fetched successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async fetchData(
    @Query('url') url: string,
    @Query('params') paramsString?: string,
  ) {
    if (!url) {
      throw new HttpException('URL is required', HttpStatus.BAD_REQUEST);
    }

    let params = {};
    if (paramsString) {
      try {
        params = JSON.parse(paramsString);
      } catch (error) {
        throw new HttpException('Invalid params JSON', HttpStatus.BAD_REQUEST);
      }
    }

    try {
      const filename = await this.publicApiService.fetchDataFromPublicApi(
        url,
        params,
      );
      return { filename, message: 'Data fetched successfully' };
    } catch (error) {
      throw new HttpException(
        `Failed to fetch data: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('download')
  @ApiOperation({ summary: 'Download previously fetched data file' })
  @ApiQuery({
    name: 'filename',
    required: true,
    description: 'Name of the file to download',
  })
  @ApiResponse({ status: 200, description: 'File download' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async downloadFile(
    @Query('filename') filename: string,
    @Res() res: Response,
  ) {
    if (!filename) {
      throw new HttpException('Filename is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const { exists, filePath } = await this.publicApiService.downloadFile(filename);
      
      if (!exists) {
        throw new HttpException('File not found', HttpStatus.NOT_FOUND);
      }

      return res.download(filePath);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to download file: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
