import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { MqttModule } from '../../../../libs/common/src/mqtt';
import { DatabaseModule } from '../../../../libs/common/src/database';

@Module({
  imports: [MqttModule, DatabaseModule],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}