import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { TwitterService } from '../service/twitter.service';

// Note: will be deprecated soon and be replaced to open-api controller.
@ApiTags('Tweet Crawler - 3rd Party')
@Controller(`v1/twitterapi`)
export class TwitterController {
  constructor(private readonly twitterService: TwitterService) {}

  @ApiOperation({ description: 'tweetIds를 통해 트윗의 정보를 조회합니다.' })
  @Get('/tweets')
  async getTweets(@Query('tweet_ids') tweet_ids: string[]) {
    return await this.twitterService.getTweets(tweet_ids);
  }

  @ApiOperation({ description: 'username을 통해 유저의 정보를 조회합니다.' })
  @Get('/user/info')
  async getUserInfo(@Query('userName') userName: string) {
    return await this.twitterService.getUserInfo(userName);
  }

  @ApiOperation({
    description:
      'username또는 userId를 이용해 유저의 last tweets를 조회합니다.',
  })
  @Get('/user/last_tweets')
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'userName', required: false })
  async getUserLastTweets(
    @Query('userId') userId?: string,
    @Query('userName') userName?: string,
  ) {
    if (!userId && !userName) {
      throw new Error('Either userId or userName must be provided');
    }
    return await this.twitterService.getUserLastTweets(userId, userName);
  }

  @ApiOperation({
    description: 'username을 통해 유저가 언급된 트윗을 조회합니다.',
  })
  @Get('/mention')
  async getTweetsByMention(@Query('userName') userName: string) {
    return await this.twitterService.getTweetsByMention(userName);
  }

  @ApiOperation({
    description: 'query를 통해 트윗을 조회합니다.',
  })
  @Get('/search')
  async getTweetsByQuery(@Query('query') query: string) {
    return await this.twitterService.getTweetsByQuery(query);
  }

  @ApiOperation({
    description: 'influencer의 트윗을 조회합니다.',
  })
  @Get('/influencer')
  async getTweetsByInfluencer() {
    return await this.twitterService.getTweetsByInfluencer();
  }

  @ApiOperation({
    description: 'query를 통해 트윗을 조회합니다.',
  })
  @Post('/cross_mention')
  async crawlTweetsByCrossMention() {
    return await this.twitterService.crawlTweetsByCrossMention();
  }

  @ApiOperation({
    description: 'influencer의 트윗을 조회합니다.',
  })
  @Post('/influencer')
  async crawlTweetsByInfluencer() {
    return await this.twitterService.crawlTweetsByInfluencer();
  }

  @ApiOperation({
    description: 'influencer 추천 텍스트 조회',
  })
  @Get('/influencer_recommend_test')
  async influencerRecommendTest() {
    return await this.twitterService.influencerRecommendTest();
  }

  @ApiOperation({
    description: 'mention 테스트',
  })
  @Get('/mention_test')
  async mentionTest() {
    return await this.twitterService.mentionTest();
  }
}
