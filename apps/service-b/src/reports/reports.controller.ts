import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ApiLogFilterDto } from '../../../../libs/common/src';
import { Response } from 'express';
import * as fs from 'fs';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('generate')
  @ApiOperation({ summary: 'Generate a PDF report with charts and analysis' })
  @ApiResponse({
    status: 200,
    description: 'Returns information about the generated report',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async generateReport(@Query() filter: ApiLogFilterDto) {
    try {
      const filename = await this.reportsService.generatePDFReport(filter);

      return {
        message: 'Report generated successfully',
        filename,
        downloadUrl: `/reports/download?filename=${filename}`,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to generate report: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('download')
  @ApiOperation({ summary: 'Download a previously generated PDF report' })
  @ApiResponse({ status: 200, description: 'Returns the PDF file' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async downloadReport(
    @Query('filename') filename: string,
    @Res() res: Response,
  ) {
    if (!filename) {
      throw new HttpException('Filename is required', HttpStatus.BAD_REQUEST);
    }

    const filePath = this.reportsService.getReportPath(filename);

    if (!fs.existsSync(filePath)) {
      throw new HttpException('Report not found', HttpStatus.NOT_FOUND);
    }

    return res.download(filePath);
  }
}
