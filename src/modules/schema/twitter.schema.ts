import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { COLLECTION_TWEET } from '../../config/db/mongoose/collections';

// XXX: 추후 명세화 - ApiProperty
// XXX: indexing 필요

@Schema({
  collection: COLLECTION_TWEET,
  timestamps: true,
})
export class TwitterModel {
  @Prop({ type: String, required: true, unique: true })
  tweetId: string;

  @Prop({ type: String, required: true })
  userName: string;

  @Prop({ type: String, required: true })
  text: string;

  @Prop({ type: String, required: true })
  url: string;

  @Prop({ type: Date, required: true })
  tweetCreatedAt: Date;

  @Prop({ type: String })
  recommendedText: string;

  @Prop({ type: String })
  type: 'influencer' | 'mention';
}

export type TwitterDocument = TwitterModel & Document;
const schema = SchemaFactory.createForClass(TwitterModel);

export const TwitterSchema = schema;
