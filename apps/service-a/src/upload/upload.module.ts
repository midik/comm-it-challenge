import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { EventsModule } from '../events/events.module';
import { DatabaseModule } from '../../../../libs/common/src';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
          const timestamp = new Date().toISOString().replace(/:/g, '-');
          const filename = `${timestamp}-${file.originalname}`;
          cb(null, filename);
        },
      }),
    }),
    EventsModule,
    DatabaseModule,
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
