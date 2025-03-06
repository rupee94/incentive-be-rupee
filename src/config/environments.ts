export const DATABASE_URL =
  process.env.DATABASE_URL === undefined
    ? 'localhost:27017'
    : process.env.DATABASE_URL;
export const DATABASE_USER =
  process.env.DATABASE_USER === undefined ? 'admin' : process.env.DATABASE_USER;
export const DATABASE_PASS =
  process.env.DATABASE_PASS === undefined
    ? 'admin0829'
    : process.env.DATABASE_PASS;

export const TWITTER_API_KEY = process.env.TWITTER_API_KEY || '';
export const X_USER_ID = process.env.X_USER_ID || '';
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
export const X_AUTHORIZATION_BASIC = process.env.X_AUTHORIZATION_BASIC || '';
