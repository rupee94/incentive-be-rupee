import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TwitterDocument, TwitterModel } from '../schema/twitter.schema';
import { Model } from 'mongoose';

// TODO Redis 이용
@Injectable()
export class TwitterRepository {
  constructor(
    @InjectModel(TwitterModel.name)
    private readonly twitterModel: Model<TwitterDocument>,
  ) {}

  getModel() {
    return this.twitterModel;
  }

  async findAll() {
    return await this.twitterModel.find();
  }

  async findOne(tweetId: number, options?: any) {
    return await this.twitterModel.findOne({ tweetId }, options);
  }

  async findLatest(type?: 'influencer' | 'mention', username?: string) {
    const query: any = { type };
    if (type === 'influencer' && username) {
      query.userName = username;
    }
    return await this.twitterModel.findOne(query).sort({ tweetId: -1 });
  }

  async findManyByType(type: 'influencer' | 'mention') {
    return await this.twitterModel.find({ type });
  }

  async findMany(tweetIds: number[]) {
    return await this.twitterModel.find({ tweetId: { $in: tweetIds } });
  }

  async findQuery(query: any) {
    const res = await this.twitterModel.find(query);
    return res.map((item) => item.toObject());
  }

  async insertMany(tweets: TwitterModel[]) {
    const bulkOps = tweets.map((tweet) => ({
      updateOne: {
        filter: { tweetId: tweet.tweetId },
        update: { $set: tweet },
        upsert: true,
      },
    }));

    return this.twitterModel
      .bulkWrite(bulkOps)
      .then((result) => console.log('Bulk update result:', result))
      .catch((error) => console.error('Bulk update error:', error));
  }

  async modifyTweetBulk(bulkOperations: any[]) {
    return this.twitterModel
      .bulkWrite(bulkOperations)
      .then((result) => console.log('Bulk update result:', result))
      .catch((error) => console.error('Bulk update error:', error));
  }
}
