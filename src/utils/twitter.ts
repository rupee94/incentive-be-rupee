import axios from 'axios';
import {
  X_AUTHORIZATION_BASIC,
  X_USER_ID,
  TWITTER_API_KEY,
} from '../config/environments';
import { Tweet, TweetsResponse } from '../modules/dto/twitter.dto';

export async function getTweetsByQuery(
  query: string,
  lastTweetId?: string,
  cursor?: string,
): Promise<TweetsResponse> {
  let allTweets: Tweet[] = [];
  let hasNextPage = true;
  let currentCursor = cursor;

  while (hasNextPage) {
    try {
      const response = await axios.get(
        `https://api.twitterapi.io/twitter/tweet/advanced_search`,
        {
          method: 'GET',
          headers: {
            accept: 'application/json',
            'X-API-Key': TWITTER_API_KEY,
          },
          params: {
            query,
            queryType: 'Top',
            cursor: currentCursor,
          },
        },
      );

      const data = response.data as TweetsResponse;

      const filteredTweets = lastTweetId
        ? data.tweets.filter((tweet) => Number(tweet.id) > Number(lastTweetId))
        : data.tweets;

      if (filteredTweets.length === 0) {
        break;
      }

      allTweets = allTweets.concat(filteredTweets);
      hasNextPage = data.has_next_page;
      currentCursor = data.next_cursor;

      console.log({
        allTweetsLength: allTweets.length,
        filteredTweetsLength: filteredTweets.length,
        hasNextPage: data.has_next_page,
        current_tweet_id: filteredTweets[0].createdAt,
        current_tweet_userName: filteredTweets[0].author.userName,
      });
    } catch (e) {
      console.log(e);
      console.log('getTweetsByQuery error');
      break;
    }
  }

  return { tweets: allTweets, has_next_page: false, next_cursor: null };
}

export async function postRetweet(tweetId: string, access_token: string) {
  try {
    const response = await axios.post(
      `https://api.x.com/2/users/${X_USER_ID}/retweets`,
      {
        tweet_id: tweetId,
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    console.log(response.data);
    return { status: 200, ...response.data };
  } catch (err) {
    console.error('postRetweet error', err.response.data);
    return err.response.data;
  }
}

export async function refreshToken(refresh_token: string) {
  try {
    const response = await axios.post(
      'https://api.x.com/2/oauth2/token',
      new URLSearchParams({
        refresh_token: refresh_token,
        grant_type: 'refresh_token',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${X_AUTHORIZATION_BASIC}`,
        },
      },
    );

    console.log(response.data);
    return response.data;
  } catch (err) {
    console.error('refreshToken error', err.response.data);
    throw err;
  }
}
