import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CommandModule } from 'nestjs-command';
import { IncentiveModule } from './modules/incentive.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    CommandModule,
    IncentiveModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
