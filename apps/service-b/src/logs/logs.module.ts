import { Module } from '@nestjs/common';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { DatabaseModule, RedisModule } from '../../../../libs/common/src';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [DatabaseModule, RedisModule, EventsModule],
  controllers: [LogsController],
  providers: [LogsService],
  exports: [LogsService],
})
export class LogsModule {}
