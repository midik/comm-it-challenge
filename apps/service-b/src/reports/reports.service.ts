import { Injectable, Logger } from '@nestjs/common';
import { LogsService } from '../logs/logs.service';
import * as PDFDocument from 'pdfkit';
import { EventType } from '../../../../libs/common/src/dto/event.dto';
import { ApiLogFilterDto } from '../../../../libs/common/src/dto/api-log.dto';
import * as fs from 'fs';
import * as path from 'path';

// Conditionally import real or mock chart implementation
let ChartJSNodeCanvas;
try {
  // Try to import the real chart.js implementation
  ChartJSNodeCanvas = require('chartjs-node-canvas').ChartJSNodeCanvas;
} catch (error) {
  // Fall back to mock implementation in production
  console.log('Using mock chart implementation in production');
  const { MockChartJSNodeCanvas } = require('./mocks/mock-chart');
  ChartJSNodeCanvas = MockChartJSNodeCanvas;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly reportsDir = path.join(process.cwd(), 'reports');
  private readonly chartJSNodeCanvas = new ChartJSNodeCanvas({ 
    width: 800, 
    height: 400,
    backgroundColour: '#ffffff' 
  });

  constructor(private readonly logsService: LogsService) {
    // Ensure reports directory exists
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  async generatePDFReport(filter: ApiLogFilterDto): Promise<string> {
    try {
      const startTime = Date.now();
      
      // Generate a unique filename for the report
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const filename = `report_${timestamp}.pdf`;
      const filePath = path.join(this.reportsDir, filename);
      
      // Create a new PDF document
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      // Pipe the PDF to a file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      
      // Add report header
      doc.fontSize(24).text('Event Analytics Report', { align: 'center' });
      doc.moveDown();
      
      // Add filter information
      doc.fontSize(12).text('Filter criteria:', { underline: true });
      doc.fontSize(10);
      doc.text(`Start date: ${filter.startDate || 'Not specified'}`);
      doc.text(`End date: ${filter.endDate || 'Not specified'}`);
      doc.text(`Event type: ${filter.type || 'All types'}`);
      doc.text(`Service: ${filter.service || 'All services'}`);
      doc.moveDown(2);
      
      // Fetch data for charts
      const [timeSeriesData, distribution] = await Promise.all([
        this.logsService.getTimeSeriesData(filter),
        this.logsService.getEventTypeDistribution(filter),
      ]);
      
      // 1. Add event type distribution chart
      doc.fontSize(16).text('Event Type Distribution', { align: 'center' });
      doc.moveDown();
      
      const distributionChartBuffer = await this.generateDistributionChart(distribution);
      doc.image(distributionChartBuffer, {
        fit: [500, 300],
        align: 'center',
      });
      doc.moveDown(2);
      
      // 2. Add time series data chart for each type
      if (timeSeriesData.length > 0) {
        doc.addPage();
        doc.fontSize(16).text('Event Execution Times', { align: 'center' });
        doc.moveDown();
        
        for (const series of timeSeriesData) {
          const chartBuffer = await this.generateTimeSeriesChart(series);
          doc.image(chartBuffer, {
            fit: [500, 250],
            align: 'center',
          });
          doc.moveDown();
          doc.fontSize(10).text(`${series.type} - ${series.service}`, { align: 'center' });
          doc.moveDown(2);
          
          // Add a new page if we have more charts to add
          if (series !== timeSeriesData[timeSeriesData.length - 1]) {
            doc.addPage();
          }
        }
      }
      
      // 3. Add summary statistics
      doc.addPage();
      doc.fontSize(16).text('Summary Statistics', { align: 'center' });
      doc.moveDown();
      
      // Total events by type
      doc.fontSize(12).text('Total Events by Type:', { underline: true });
      doc.moveDown();
      
      const totalEvents = Object.entries(distribution).reduce((sum, [_, count]) => sum + count, 0);
      
      // Create a table for the distribution
      const distributionTable = Object.entries(distribution).map(([type, count]) => ({
        type,
        count,
        percentage: `${((count / totalEvents) * 100).toFixed(2)}%`,
      }));
      
      // Add the table
      const tableTop = doc.y;
      const tableLeft = 50;
      const colWidth = 150;
      const rowHeight = 30;
      
      // Table header
      doc.fontSize(10).text('Event Type', tableLeft, tableTop);
      doc.text('Count', tableLeft + colWidth, tableTop);
      doc.text('Percentage', tableLeft + colWidth * 2, tableTop);
      
      // Table rows
      let rowY = tableTop + rowHeight;
      distributionTable.forEach(row => {
        doc.text(row.type, tableLeft, rowY);
        doc.text(row.count.toString(), tableLeft + colWidth, rowY);
        doc.text(row.percentage, tableLeft + colWidth * 2, rowY);
        rowY += rowHeight;
      });
      
      // Add total row
      doc.text('Total', tableLeft, rowY);
      doc.text(totalEvents.toString(), tableLeft + colWidth, rowY);
      doc.text('100%', tableLeft + colWidth * 2, rowY);
      
      // Add footer with timestamps
      doc.fontSize(8);
      doc.text(
        `Report generated on ${new Date().toISOString()} in ${
          Date.now() - startTime
        }ms`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );
      
      // Finalize the PDF
      doc.end();
      
      // Wait for the stream to finish
      return new Promise((resolve, reject) => {
        stream.on('finish', () => {
          this.logger.log(`PDF report generated: ${filename}`);
          resolve(filename);
        });
        stream.on('error', reject);
      });
    } catch (error) {
      this.logger.error(`Failed to generate PDF report: ${error.message}`);
      throw error;
    }
  }

  getReportPath(filename: string): string {
    return path.join(this.reportsDir, filename);
  }

  private async generateDistributionChart(distribution: Record<string, number>): Promise<Buffer> {
    const labels = Object.keys(distribution);
    const data = Object.values(distribution);
    
    // Generate colors for each event type
    const colors = this.generateColors(labels.length);
    
    const configuration = {
      type: 'pie',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
          },
        ],
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: 'Event Distribution by Type',
            font: {
              size: 16,
            },
          },
          legend: {
            position: 'right',
          },
        },
      },
    };
    
    return this.chartJSNodeCanvas.renderToBuffer(configuration as any);
  }

  private async generateTimeSeriesChart(series: any): Promise<Buffer> {
    const labels = series.data.map(point => {
      const date = new Date(point.timestamp);
      return date.toLocaleString();
    });
    
    const data = series.data.map(point => point.value);
    
    const configuration = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: `${series.type} Execution Time (ms)`,
            data,
            borderColor: '#4bc0c0',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.4,
          },
        ],
      },
      options: {
        plugins: {
          title: {
            display: true,
            text: `Execution Time for ${series.type}`,
            font: {
              size: 16,
            },
          },
        },
        scales: {
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 45,
            },
          },
          y: {
            title: {
              display: true,
              text: 'Execution Time (ms)',
            },
            min: 0,
          },
        },
      },
    };
    
    return this.chartJSNodeCanvas.renderToBuffer(configuration as any);
  }

  private generateColors(count: number): string[] {
    const baseColors = [
      '#FF6384', // Red
      '#36A2EB', // Blue
      '#FFCE56', // Yellow
      '#4BC0C0', // Teal
      '#9966FF', // Purple
      '#FF9F40', // Orange
      '#8AC054', // Green
    ];
    
    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }
    
    // If we need more colors, generate them
    const colors = [...baseColors];
    
    while (colors.length < count) {
      const r = Math.floor(Math.random() * 255);
      const g = Math.floor(Math.random() * 255);
      const b = Math.floor(Math.random() * 255);
      colors.push(`rgb(${r}, ${g}, ${b})`);
    }
    
    return colors;
  }
}