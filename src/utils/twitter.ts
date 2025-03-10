import axios from 'axios';
import { TWITTER_API_KEY } from '../config/environments';
import { Tweet, TweetsResponse } from '../tweet-crawler/dto/twitter.dto';

export async function getTweetsByQuery(
  query: string,
  lastTweetId?: string,
): Promise<TweetsResponse> {
  let allTweets: Tweet[] = [];
  let hasNextPage = true;
  let currentCursor = null;

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
      console.log('getTweetsByQuery error', e);

      return {
        tweets: allTweets,
        has_next_page: false,
        next_cursor: null,
      };
    }
  }

  return { tweets: allTweets, has_next_page: false, next_cursor: null };
}
