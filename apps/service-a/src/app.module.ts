import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import {
  DatabaseModule,
  MqttModule,
  RedisModule,
} from '../../../libs/common/src';
import { PublicApiModule } from './public-api/public-api.module';
import { UploadModule } from './upload/upload.module';
import { SearchModule } from './search/search.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }) as any,
    DatabaseModule,
    RedisModule,
    MqttModule,
    PublicApiModule,
    UploadModule,
    SearchModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
