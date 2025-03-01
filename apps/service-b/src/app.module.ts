import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../../libs/common/src';
import { RedisModule } from '../../../libs/common/src';
import { MqttModule } from '../../../libs/common/src';
import { EventsModule } from './events/events.module';
import { LogsModule } from './logs/logs.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }) as any,
    DatabaseModule,
    RedisModule,
    MqttModule,
    EventsModule,
    LogsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
