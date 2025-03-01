import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { DatabaseModule } from '../../../../libs/common/src';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [DatabaseModule, EventsModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
