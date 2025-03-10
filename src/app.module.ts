import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CommandModule } from 'nestjs-command';
import { TweetCrawlerModule } from './tweet-crawler/module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    CommandModule,
    TweetCrawlerModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
