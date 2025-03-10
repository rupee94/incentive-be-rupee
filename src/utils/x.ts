import axios from 'axios';
import { X_AUTHORIZATION_BASIC, X_USER_ID } from '../config/environments';

export async function postTweet(
  text: string,
  quoteTweetId: string,
  access_token: string,
) {
  try {
    const response = await axios.post(
      `https://api.x.com/2/tweets`,
      {
        text: text,
        reply: {
          in_reply_to_tweet_id: quoteTweetId,
        },
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
    console.error('postTweet error', err.response.data);
    return err.response.data;
  }
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

export async function getTweetsByQuery(
  query: string,
  access_token: string,
  since_id?: string,
) {
  let allTweets = [];
  let hasNextPage = true;
  let currentCursor = '';

  while (hasNextPage) {
    try {
      const response = await axios.get(
        `https://api.x.com/2/tweets/search/recent`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
          params: {
            query: query,
            max_results: 10,
            ...(since_id && { since_id: since_id }),
            ...(currentCursor && { next_token: currentCursor }),
          },
        },
      );

      const result = response.data;
      const filteredTweets = since_id
        ? result.data.filter((tweet) => Number(tweet.id) > Number(since_id))
        : result.data;

      if (filteredTweets.length === 0) {
        break;
      }

      allTweets = allTweets.concat(filteredTweets);
      if (result.meta.next_cursor == null) {
        hasNextPage = false;
      } else {
        currentCursor = result.meta.next_token;
      }
    } catch (err) {
      console.error(
        'Error fetching tweets:',
        err.response ? err.response.data : err.message,
      );
      return {
        status: err.response.data.status,
        tweets: allTweets,
      };
    }
  }

  return { tweets: allTweets, status: 200 };
}
