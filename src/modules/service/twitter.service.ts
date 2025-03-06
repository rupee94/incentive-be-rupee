import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { INFLUENCER_LIST } from '../../config/constants';
import { TWITTER_API_KEY } from '../../config/environments';
import { TweetResults, TweetsResponse } from '../dto/twitter.dto';
import { TwitterRepository } from '../repository/twitter.repository';
import { TwitterModel } from '../schema/twitter.schema';
import {
  getTweetsByQuery,
  postRetweet,
  refreshToken,
} from '../../utils/twitter';
import {
  findRelatedMediumArticles,
  IntentDetect,
  IntentDetectWithConfidence,
  RetweetText,
  Tone1Fitting,
  Tone2Fitting,
} from '../../utils/openai';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';
import csvParser from 'csv-parser';
import { AuthRepository } from '../repository/auth.repository';
@Injectable()
export class TwitterService {
  constructor(
    private readonly twitterRepository: TwitterRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  async getTweets(tweet_ids: string[]) {
    try {
      const response = await axios.get(
        `https://api.twitterapi.io/twitter/tweets`,
        {
          method: 'GET',
          headers: {
            accept: 'application/json',
            'X-API-Key': TWITTER_API_KEY,
          },
          params: {
            tweet_ids,
          },
        },
      );

      return response.data as TweetsResponse;
    } catch {
      console.log('getTweets error');
      return { tweets: [] }; // Return an empty TweetsResponse
    }
  }

  async getUserInfo(userName: string) {
    try {
      const response = await axios.get(
        `https://api.twitterapi.io/twitter/user/info`,
        {
          method: 'GET',
          headers: {
            accept: 'application/json',
            'X-API-Key': TWITTER_API_KEY,
          },
          params: {
            userName,
          },
        },
      );

      return response.data;
    } catch {
      console.log('getUserInfo error');
      return {};
    }
  }

  async getUserLastTweets(userId?: string, userName?: string) {
    try {
      const response = await axios.get(
        `https://api.twitterapi.io/twitter/user/last_tweets`,
        {
          method: 'GET',
          headers: {
            accept: 'application/json',
            'X-API-Key': TWITTER_API_KEY,
          },
          params: {
            userId,
            userName,
          },
        },
      );

      return response.data;
    } catch {
      console.log('getUserLastTweets error');
      return {};
    }
  }

  async getTweetsByMention(userName: string, cursor?: string) {
    const sinceTime = Math.floor(
      new Date().getTime() / 1000 - 60 * 60 * 24 * 30,
    );
    const untilTime = Math.floor(new Date().getTime() / 1000);

    try {
      const response = await axios.get(
        `https://api.twitterapi.io/twitter/user/mentions`,
        {
          method: 'GET',
          headers: {
            accept: 'application/json',
            'X-API-Key': TWITTER_API_KEY,
          },
          params: {
            userName,
            sinceTime,
            untilTime,
            cursor,
          },
        },
      );

      return response.data;
    } catch {
      console.log('getTweetsByMention error');
      return {};
    }
  }

  async getTweetsByQuery(query: string): Promise<TweetsResponse> {
    return await getTweetsByQuery(query, 'mention');
  }

  // @Cron(CronExpression.EVERY_6_HOURS)
  async crawlTweetsByCrossMention(): Promise<TweetResults> {
    const latestTweet = await this.twitterRepository.findLatest('mention');
    let query = `($CROSS OR (@cross_protocol) OR (#xCROSS)) -filter:replies (lang:en OR lang:ko)`;
    let since_id;
    if (latestTweet) {
      since_id = latestTweet.tweetId;
      query += ` since_id:${since_id}`;
    }

    console.log('getTweetsByCrossMention이 실행중입니다.');

    console.log('query', query);
    const data = await getTweetsByQuery(query);

    if (data.tweets.length === 0) {
      console.log('getTweetsByCrossMention이 종료되었습니다.');
      return;
    }

    // TODO intent에 따른 work flow 구현

    const results: TwitterModel[] = data.tweets.map((tweet) => {
      return {
        tweetId: tweet.id,
        userName: tweet.author.userName,
        text: tweet.text,
        url: tweet.url,
        type: 'mention',
        tweetCreatedAt: new Date(tweet.createdAt),
        recommendedText: '',
      };
    });

    await this.twitterRepository.insertMany(results);

    console.log('getTweetsByCrossMention이 종료되었습니다.');
    console.log('results length', results.length);

    return { tweets: results };
  }

  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async crawlTweetsByInfluencer() {
    const influencerList = INFLUENCER_LIST;

    console.log('getTweetsByInfluencer이 실행중입니다.');

    const latestTweets = await Promise.all(
      influencerList.map((influencer) =>
        this.twitterRepository.findLatest('influencer', influencer),
      ),
    );

    const promises = influencerList.map((influencer, index) => {
      const latestTweet = latestTweets[index];
      let query = `(from:${influencer}) -filter:replies (lang:en OR lang:ko)`;
      console.log('query', query);

      let since_id;
      if (latestTweet) {
        since_id = latestTweet.tweetId;
        query += ` since_id:${since_id}`;
      } else {
        const currentDate = new Date().toISOString().split('T')[0];
        query += ` since:2025-02-01`;
      }
      return getTweetsByQuery(query, latestTweet?.tweetId);
    });

    const tweetResponses = await Promise.all(promises);
    const allTweets = tweetResponses.flatMap((response) => response.tweets);

    if (allTweets.length === 0) {
      console.log('getTweetsByInfluencer이 종료되었습니다.');
      return;
    }

    const results: TwitterModel[] = allTweets.map((tweet) => {
      return {
        tweetId: tweet.id,
        userName: tweet.author.userName,
        text: tweet.text,
        url: tweet.url,
        type: 'influencer',
        tweetCreatedAt: new Date(tweet.createdAt),
        recommendedText: '',
      };
    });

    await this.twitterRepository.insertMany(results);

    console.log('getTweetsByInfluencer이 종료되었습니다.');

    return { tweets: results };
  }

  async autoRetweet() {
    const tweets = await this.twitterRepository.findManyByType('mention');
    const auth = (await this.authRepository.findAll())[0];
    let access_token = auth.access_token;
    let refresh_token = auth.refresh_token;

    for (const tweet of tweets) {
      const result = await postRetweet(
        '1894469438982033558',
        auth.access_token,
      );

      if (result.status === 401) {
        const newToken = await refreshToken(refresh_token);
        await this.authRepository.updateOne(
          auth.access_token,
          newToken.access_token,
          newToken.refresh_token,
        );

        access_token = newToken.access_token;
        refresh_token = newToken.refresh_token;
      } else if (result.status === 429) {
        console.log('429 error');
      }

      return result;
    }
  }

  // TODO: 테스트용으로만 사용 추후 삭제할 예정
  async refreshToken() {
    const auth = (await this.authRepository.findAll())[0];
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

  async getTweetsByInfluencer() {
    const tweets = await this.twitterRepository.findQuery({
      type: 'influencer',
      recommendedText: { $exists: true, $ne: '' },
    });

    const result = [];
    for (const tweet of tweets) {
      result.push({
        tweetId: tweet.tweetId,
        recommendedText: tweet.recommendedText,
        text: tweet.text,
        url: tweet.url,
        tweetCreatedAt: tweet.tweetCreatedAt,
        userName: tweet.userName,
      });
    }
    return result;
  }

  async test() {
    const tweets = await this.twitterRepository.findQuery({
      type: 'influencer',
      tweetCreatedAt: {
        $gte: new Date('2025-03-05'),
      },
    });

    const bulkOperations = [];

    for (const tweet of tweets) {
      const relatedArticle = await findRelatedMediumArticles(
        tweet.text,
        tweet.url,
      );

      if (relatedArticle) {
        console.log(tweet.text);
        const retweetText = await RetweetText(tweet.text);
        console.log('retweetText', retweetText);
        const tone1 = await Tone1Fitting(retweetText);
        const tone2 = await Tone2Fitting(retweetText);
        console.log('tone1', tone1);
        console.log('tone2', tone2);

        // Prepare bulk operation for each tweet
        bulkOperations.push({
          updateOne: {
            filter: { tweetId: tweet.tweetId },
            update: { recommendedText: retweetText }, // or any other text you want to set
          },
        });
      }
    }

    if (bulkOperations.length > 0) {
      await this.twitterRepository.modifyTweetBulk(bulkOperations);
    }

    console.log('test이 종료되었습니다.');
  }

  async test2() {
    // Read data from estimated_intent.csv
    const tweetTexts: { Tweet_Text: string; Human_Intent: string }[] = [];
    fs.createReadStream('./estimated_intent.csv')
      .pipe(csvParser())
      .on('data', (row) => {
        tweetTexts.push({
          Tweet_Text: row.Tweet_Text,
          Human_Intent: row.Human_Intent,
        });
      })
      .on('end', () => {
        console.log('CSV file successfully processed');
      });

    const latestTweet = await this.twitterRepository.findLatest('mention');
    const auth = (await this.authRepository.findAll())[0];
    // let query = `("$MET" OR "metya.com" OR (@metyacom) OR ("#Metya")) -filter:replies -from:metyacom (lang:en OR lang:ko) since:2025-02-01`;
    // let since_id;
    // if (latestTweet) {
    //   since_id = latestTweet.tweetId;
    //   query += ` since_id:${since_id}`;
    // }

    console.log('getTweetsByCrossMention이 실행중입니다.');

    // console.log('query', query);
    // const data = await getTweetsByQuery(query);

    // if (data.tweets.length === 0) {
    //   console.log('getTweetsByCrossMention이 종료되었습니다.');
    //   return;
    // }

    const csvWriter = createObjectCsvWriter({
      path: './estimated_intent_confidence.csv',
      header: [
        { id: 'Tweet_Text', title: 'Tweet_Text' },
        { id: 'Estimated_Positive', title: 'Estimated_Positive' },
        { id: 'Estimated_Negative', title: 'Estimated_Negative' },
        { id: 'Estimated_Neutral', title: 'Estimated_Neutral' },
        { id: 'Estimated_Question', title: 'Estimated_Question' },
        { id: 'Estimated_Intent', title: 'Estimated_Intent' },
        { id: 'Human_Intent', title: 'Human_Intent' },
      ],
    });
    const estimatedIntents = [];

    // Use tweetTexts array as needed
    console.log('Tweet_Texts from CSV:', tweetTexts.length);

    for (const tweet of tweetTexts) {
      const intent = await IntentDetectWithConfidence(tweet.Tweet_Text, [
        'positive',
        'negative',
        'question',
        'neutral',
      ]);

      // Determine the highest confidence intent
      const estimatedIntent = Object.keys(intent).reduce((a, b) =>
        intent[a] > intent[b] ? a : b,
      );

      if (estimatedIntent == 'positive' || estimatedIntent == 'neutral') {
        await postRetweet(latestTweet.tweetId, auth.access_token);
        break;
      } else if (estimatedIntent == 'question') {
      }

      estimatedIntents.push({
        Tweet_Text: tweet.Tweet_Text,
        Estimated_Positive: intent.positive,
        Estimated_Negative: intent.negative,
        Estimated_Neutral: intent.neutral,
        Estimated_Question: intent.question,
        Estimated_Intent: estimatedIntent,
        Human_Intent: tweet.Human_Intent,
      });
    }

    csvWriter.writeRecords(estimatedIntents);

    console.log('getTweetsByCrossMention이 종료되었습니다.');
  }
}
