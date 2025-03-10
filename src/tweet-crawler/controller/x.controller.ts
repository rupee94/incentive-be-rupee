import { Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { XService } from '../service/x.service';

// Note: will be deprecated soon and be replaced to open-api controller.
@ApiTags('Tweet Crawler - X')
@Controller(`v1/x`)
export class XController {
  constructor(private readonly xService: XService) {}

  @ApiOperation({
    description: 'execute tweet crawler',
  })
  @Post('/execute_auto_mention')
  async executeAutoMention() {
    return await this.xService.executeAutoMention();
  }

  @ApiOperation({
    description: 'get tweets by query',
  })
  @Post('/crawl_tweets_by_mention')
  async crawlTweetsByCrossMention() {
    return await this.xService.crawlTweetsByCrossMention();
  }

  @ApiOperation({
    description: 'get tweets by influencer',
  })
  @Post('/crawl_tweets_by_influencer')
  async crawlTweetsByInfluencer() {
    return await this.xService.crawlTweetsByInfluencer();
  }

  @ApiOperation({
    description: 'auto retweet',
  })
  @Post('/auto_retweet')
  async autoRetweet() {
    return await this.xService.autoRetweet();
  }

  @ApiOperation({
    description: 'post tweet',
  })
  @Post('/post_tweet')
  async postTweet() {
    return await this.xService.postTweet();
  }

  // TODO: 테스트용으로만 사용 추후 삭제할 예정
  @ApiOperation({
    description: 'refresh token',
  })
  @Post('/refresh_token')
  async refreshToken() {
    return await this.xService.refreshTokenTest();
  }
}
