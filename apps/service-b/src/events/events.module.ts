import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { MqttModule } from '../../../../libs/common/src';
import { DatabaseModule } from '../../../../libs/common/src';

@Module({
  imports: [MqttModule, DatabaseModule],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
