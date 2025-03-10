import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ExecuteMetaDocument,
  ExecuteMetaModel,
} from '../schema/executeMeta.schema';
import { Model } from 'mongoose';

// TODO Redis 이용
@Injectable()
export class ExecuteMetaRepository {
  constructor(
    @InjectModel(ExecuteMetaModel.name)
    private readonly executeMetaModel: Model<ExecuteMetaDocument>,
  ) {}

  getModel() {
    return this.executeMetaModel;
  }

  async findAll() {
    return await this.executeMetaModel.find();
  }

  async findQuery(query: any) {
    const res = await this.executeMetaModel.find(query);
    return res.map((item) => item.toObject());
  }

  async updateOne(type: string, tweetId: string) {
    return await this.executeMetaModel.updateOne(
      { type: type },
      { lastTweetId: tweetId },
      { upsert: true },
    );
  }
}
