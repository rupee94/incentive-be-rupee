export interface ProfileBio {
  description: string;
  entities: {
    description: {
      urls: UrlEntity[];
    };
    url: {
      urls: UrlEntity[];
    };
  };
}

export interface UrlEntity {
  display_url: string;
  expanded_url: string;
  indices: number[];
  url: string;
}

export interface Hashtag {
  indices: number[];
  text: string;
}

export interface UserMention {
  id_str: string;
  name: string;
  screen_name: string;
}

export interface TweetEntities {
  hashtags: Hashtag[];
  urls: UrlEntity[];
  user_mentions: UserMention[];
}

export interface TweetAuthor {
  type: 'user';
  userName: string;
  url: string;
  id: string;
  name: string;
  isBlueVerified: boolean;
  profilePicture: string;
  coverPicture: string;
  description: string;
  location: string;
  followers: number;
  following: number;
  canDm: boolean;
  createdAt: string;
  fastFollowersCount: number;
  favouritesCount: number;
  hasCustomTimelines: boolean;
  isTranslator: boolean;
  mediaCount: number;
  statusesCount: number;
  withheldInCountries: string[];
  affiliatesHighlightedLabel: Record<string, unknown>;
  possiblySensitive: boolean;
  pinnedTweetIds: string[];
  isAutomated: boolean;
  automatedBy: string;
  unavailable: boolean;
  message: string;
  unavailableReason: string;
  profile_bio: ProfileBio;
}

export interface Tweet {
  type: 'tweet';
  id: string;
  url: string;
  text: string;
  source: string;
  retweetCount: number;
  replyCount: number;
  likeCount: number;
  quoteCount: number;
  viewCount: number;
  createdAt: string;
  lang: string;
  bookmarkCount: number;
  isReply: boolean;
  inReplyToId: string;
  conversationId: string;
  inReplyToUserId: string;
  inReplyToUsername: string;
  author: TweetAuthor;
  entities: TweetEntities;
  quoted_tweet?: Tweet;
  retweeted_tweet?: Tweet;
}

export interface TweetsResponse {
  tweets: Tweet[];
  has_next_page: boolean;
  next_cursor: string;
}

export interface TweetResults {
  tweets: {
    tweetId: string;
    userName: string;
    text: string;
    url: string;
  }[];
  // Add other fields as necessary
}
