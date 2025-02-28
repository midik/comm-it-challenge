import { Module } from '@nestjs/common';
import { PublicApiController } from './public-api.controller';
import { PublicApiService } from './public-api.service';
import { HttpModule } from '@nestjs/axios';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    EventsModule,
  ],
  controllers: [PublicApiController],
  providers: [PublicApiService],
  exports: [PublicApiService],
})
export class PublicApiModule {}