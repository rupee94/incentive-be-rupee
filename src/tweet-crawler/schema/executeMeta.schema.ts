import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { COLLECTION_EXECUTE_META } from '../../config/db/mongoose/collections';

// XXX: 추후 명세화 - ApiProperty
// XXX: indexing 필요

@Schema({
  collection: COLLECTION_EXECUTE_META,
  timestamps: true,
})
export class ExecuteMetaModel {
  @Prop({ type: String, required: true, unique: true })
  type: 'search' | 'retweet' | 'post';

  @Prop({ type: String, required: true })
  latestTweetId: string;
}

export type ExecuteMetaDocument = ExecuteMetaModel & Document;
const schema = SchemaFactory.createForClass(ExecuteMetaModel);

export const ExecuteMetaSchema = schema;
