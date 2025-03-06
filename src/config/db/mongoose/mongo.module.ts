import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { mongooseConfig } from './mongo.config';

@Module({
  imports: [
    MongooseModule.forRoot(mongooseConfig.uri, {
      ...mongooseConfig.options,
      connectionFactory: connection => {
        return connection;
      },
      connectionErrorFactory: mongodb => {
        return mongodb;
      },
    }),
  ],
})
export class MongoModule {}
