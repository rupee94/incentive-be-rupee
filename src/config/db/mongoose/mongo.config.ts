import { MongooseModuleOptions } from '@nestjs/mongoose';
import { ReadPreferenceMode } from 'mongodb';
import { DATABASE_PASS, DATABASE_URL, DATABASE_USER } from '../../environments';
import mongoose from 'mongoose';
import * as util from 'util';

// XXX: 아래는 dev mode에서 디버깅을 편리하게 하는 용도. 불필요하므로 비활성화.
// if (process.env.APP_ENV !== 'production') {
//   mongoose.set('debug', function (coll, method, query, doc) {
//     console.log(`[#### QUERY ####]\n Collection: ${coll} \n Method: ${method} \n Query: ${JSON.stringify(query)} \n`);
//   });
// }

/**
 * MongoDB URI
 */
const uri = `${DATABASE_URL}`;
/**
 * Mongoose 설정
 * 기본 설정 참고 : https://mongoosejs.com/docs/deprecations.html
 * ReadPreference 설정 : https://docs.mongodb.com/manual/core/read-preference-use-cases/
 */
export const options: MongooseModuleOptions = {
  authSource: 'admin',
  user: DATABASE_USER,
  pass: DATABASE_PASS,
  readPreference: ReadPreferenceMode.secondaryPreferred,
  // readConcern: { level: 'majority' },
};

export const mongooseConfig: { uri: string; options: MongooseModuleOptions } = {
  uri,
  options,
};
