import { Controller, Post, UploadedFile, UseInterceptors, Body, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { Express } from 'express';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @ApiOperation({ summary: 'Upload a file and parse it into MongoDB' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'JSON or Excel file to upload and parse',
        },
        collection: {
          type: 'string',
          description: 'MongoDB collection name to store the data',
        },
      },
      required: ['file', 'collection'],
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded and processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or invalid file' })
  @ApiResponse({ status: 500, description: 'Internal server error during processing' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('collection') collection: string,
  ) {
    if (!file) {
      throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
    }

    if (!collection) {
      throw new HttpException('Collection name is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const result = await this.uploadService.parseAndInsertFile(file.filename, collection);
      
      return {
        message: 'File processed successfully',
        filename: file.filename,
        originalName: file.originalname,
        collection,
        documentsInserted: result.count,
        processingTimeMs: result.elapsedTime,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to process file: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}