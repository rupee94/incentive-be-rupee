import { Injectable } from '@nestjs/common';
import { TwitterRepository } from '../repository/twitter.repository';
import {
  getTweetsByQuery,
  postRetweet,
  postTweet,
  refreshToken,
} from '../../utils/x';
import { AuthRepository } from '../repository/auth.repository';
import { AuthModel } from '../schema/auth.schema';
import { INFLUENCER_LIST } from 'src/config/constants';
import { TwitterModel } from '../schema/twitter.schema';
import {
  findRelatedMediumArticles,
  IntentDetectWithConfidence,
  RetweetText,
} from 'src/utils/openai';

@Injectable()
export class XService {
  constructor(
    private readonly twitterRepository: TwitterRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  // @Cron(CronExpression.EVERY_6_HOURS)
  async executeAutoMention() {
    const tweets = await this.twitterRepository.findQuery({
      type: 'mention',
      intent: { $in: ['positive', 'neutral', 'question'] },
      isExecuted: false,
    });
    const auth = (await this.authRepository.findAll())[0];
    let access_token = auth.access_token;
    const newToken = await this._checkTokenExpiredAndUpdate(auth);
    if (newToken) {
      access_token = newToken.access_token;
    }

    tweets.sort((a, b) => Number(a.tweetId) - Number(b.tweetId));
    let isRetweetPosible = true;
    let isPostPosible = true;
    const bulkOperations = [];
    for (const tweet of tweets) {
      let result;
      if (
        (tweet.intent === 'positive' || tweet.intent === 'neutral') &&
        isRetweetPosible
      ) {
        result = await postRetweet(tweet.tweetId, access_token);
      } else if (tweet.intent === 'question' && isPostPosible) {
        result = await postTweet(
          'If you have any questions, please ask through https://t.me/rupee94_bot.',
          tweet.tweetId,
          access_token,
        );
      }

      if (result && result.status === 200) {
        bulkOperations.push({
          updateOne: {
            filter: { tweetId: tweet.tweetId },
            update: { isExecuted: true },
          },
        });
      }

      if (result && result.status === 429) {
        if (
          (tweet.intent === 'positive' || tweet.intent === 'neutral') &&
          !isRetweetPosible
        ) {
          isRetweetPosible = false;
        } else if (tweet.intent === 'question' && !isPostPosible) {
          isPostPosible = false;
        }
      }
    }

    if (bulkOperations.length > 0) {
      await this.twitterRepository.modifyTweetBulk(bulkOperations);
    }

    return true;
  }

  async postTweet() {
    const auth = (await this.authRepository.findAll())[0];
    let access_token = auth.access_token;
    const newToken = await this._checkTokenExpiredAndUpdate(auth);
    if (newToken) {
      access_token = newToken.access_token;
    }
    const result = await postTweet('test', '1897460652802761169', access_token);
    return result;
  }

  async autoRetweet() {
    const tweets = await this.twitterRepository.findManyByType('mention');
    const auth = (await this.authRepository.findAll())[0];
    let access_token = auth.access_token;

    const newToken = await this._checkTokenExpiredAndUpdate(auth);
    if (newToken) {
      access_token = newToken.access_token;
    }

    for (const tweet of tweets) {
      const result = await postRetweet('1897460652802761169', access_token);
      return result;
    }
  }

  // @Cron(CronExpression.EVERY_6_HOURS)
  async crawlTweetsByCrossMention() {
    const auth = (await this.authRepository.findAll())[1];
    const latestTweet = await this.twitterRepository.findLatest('mention');

    let access_token = auth.access_token;
    const newToken = await this._checkTokenExpiredAndUpdate(auth);
    if (newToken) {
      access_token = newToken.access_token;
    }

    const data = await getTweetsByQuery(
      '@cross_protocol (lang:en OR lang:ko) -is:reply -is:retweet is:verified',
      access_token,
      latestTweet?.tweetId,
    );

    if (data.tweets.length === 0) {
      console.log('crawlTweetsByCrossMention이 종료되었습니다.');
      return;
    }
    const results: TwitterModel[] = [];
    for (const tweet of data.tweets) {
      const intent = await IntentDetectWithConfidence(tweet.text, [
        'positive',
        'negative',
        'question',
        'neutral',
      ]);

      // Determine the highest confidence intent
      const estimatedIntent = Object.keys(intent).reduce((a, b) =>
        intent[a] > intent[b] ? a : b,
      );

      results.push({
        tweetId: tweet.id,
        userName: tweet.author.userName,
        text: tweet.text,
        url: tweet.url,
        type: 'mention',
        tweetCreatedAt: new Date(tweet.createdAt),
        recommendedText: '',
        intent: estimatedIntent as
          | 'positive'
          | 'neutral'
          | 'question'
          | 'negative',
        isExecuted: false,
      });
    }

    await this.twitterRepository.insertMany(results);

    console.log('crawlTweetsByCrossMention이 종료되었습니다.');
    console.log('results length', results.length);

    return { tweets: results };
  }

  // @Cron(CronExpression.EVERY_6_HOURS)
  async crawlTweetsByInfluencer() {
    const influencerList = INFLUENCER_LIST;

    console.log('crawlTweetsByInfluencer이 실행중입니다.');

    const latestTweets = await Promise.all(
      influencerList.map((influencer) =>
        this.twitterRepository.findLatest('influencer', influencer),
      ),
    );

    const auth = (await this.authRepository.findAll())[1];
    let access_token = auth.access_token;
    const newToken = await this._checkTokenExpiredAndUpdate(auth);
    if (newToken) {
      access_token = newToken.access_token;
    }

    const promises = influencerList.map((influencer, index) => {
      const latestTweet = latestTweets[index];
      let query = `(from:${influencer}) -filter:replies (lang:en OR lang:ko)`;
      console.log('query', query);

      const since_id = latestTweet ? latestTweet.tweetId : undefined;
      return getTweetsByQuery(query, access_token, since_id);
    });

    const tweetResponses = await Promise.all(promises);
    const allTweets = tweetResponses.flatMap((response) => response.tweets);

    if (allTweets.length === 0) {
      console.log('getTweetsByInfluencer이 종료되었습니다.');
      return;
    }

    const results: TwitterModel[] = [];
    for (const tweet of allTweets) {
      const relatedArticle = await findRelatedMediumArticles(
        tweet.text,
        tweet.url,
      );

      if (relatedArticle) {
        console.log(tweet.text);
        const retweetText = await RetweetText(tweet.text);
        console.log('retweetText', retweetText);

        results.push({
          tweetId: tweet.id,
          userName: tweet.author.userName,
          text: tweet.text,
          url: tweet.url,
          type: 'influencer',
          tweetCreatedAt: new Date(tweet.createdAt),
          recommendedText: retweetText,
          intent: 'neutral',
          isExecuted: false,
        });
      }
    }

    await this.twitterRepository.insertMany(results);

    console.log('getTweetsByInfluencer이 종료되었습니다.');

    return { tweets: results };
  }

  // TODO: 테스트용으로만 사용 추후 삭제할 예정
  async refreshTokenTest() {
    const auth = (await this.authRepository.findAll())[1];
    let newToken = auth;
    try {
      newToken = await refreshToken(newToken.refresh_token);

      const maxRetries = 3;
      let attempt = 0;
      let success = false;

      while (attempt < maxRetries && !success) {
        try {
          await this.authRepository.updateOne(
            auth.access_token,
            newToken.access_token,
            newToken.refresh_token,
          );

          console.log('Token updated successfully');
          success = true;
        } catch (updateError) {
          attempt++;
          console.error(
            `Failed to update token in database, attempt ${attempt}`,
            updateError,
          );

          if (attempt < maxRetries) {
            console.log('Retrying update...');
          } else {
            console.error('Max retries reached. Update failed.');
          }
        }
      }
    } catch (err) {
      console.error('Failed to refresh token', err.response.data);
    }

    return newToken;
  }

  async _checkTokenExpiredAndUpdate(auth: AuthModel) {
    if (auth.updatedAt.getTime() + 1000 * 60 * 60 * 1.5 < Date.now()) {
      try {
        const newToken = await refreshToken(auth.refresh_token);

        const maxRetries = 3;
        let attempt = 0;
        let success = false;

        while (attempt < maxRetries && !success) {
          try {
            await this.authRepository.updateOne(
              auth.access_token,
              newToken.access_token,
              newToken.refresh_token,
            );

            console.log('Token updated successfully');
            success = true;
          } catch (updateError) {
            attempt++;
            console.error(
              `Failed to update token in database, attempt ${attempt}`,
              updateError,
            );

            if (attempt < maxRetries) {
              console.log('Retrying update...');
            } else {
              console.error('Max retries reached. Update failed.');
            }
          }
        }

        return newToken;
      } catch (err) {
        console.error('Failed to refresh token', err.response.data);
      }
    }

    return null;
  }
}
