import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { MqttModule } from '../../../../libs/common/src/mqtt';
import { RedisModule } from '../../../../libs/common/src/redis';

@Module({
  imports: [MqttModule, RedisModule],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}