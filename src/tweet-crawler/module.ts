import { Module } from '@nestjs/common';
import { TwitterController } from './controller/twitter.controller';
import { TwitterService } from './service/twitter.service';
import { TwitterRepository } from './repository/twitter.repository';
import { MongoModule } from '../config/db/mongoose/mongo.module';
import { MongooseModule } from '@nestjs/mongoose';
import { TwitterSchema, TwitterModel } from './schema/twitter.schema';
import { AuthModel, AuthSchema } from './schema/auth.schema';
import { AuthRepository } from './repository/auth.repository';
import { XController } from './controller/x.controller';
import { XService } from './service/x.service';

@Module({
  imports: [
    MongoModule,
    MongooseModule.forFeature([
      { name: TwitterModel.name, schema: TwitterSchema },
      { name: AuthModel.name, schema: AuthSchema },
    ]),
  ],
  controllers: [TwitterController, XController],
  providers: [TwitterService, TwitterRepository, AuthRepository, XService],
})
export class TweetCrawlerModule {}
