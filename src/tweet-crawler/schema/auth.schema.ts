import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { COLLECTION_AUTH } from '../../config/db/mongoose/collections';

// XXX: 추후 명세화 - ApiProperty
// XXX: indexing 필요

@Schema({
  collection: COLLECTION_AUTH,
  timestamps: true,
})
export class AuthModel {
  @Prop({ type: String, required: true, unique: true })
  access_token: string;

  @Prop({ type: String, required: true })
  refresh_token: string;

  @Prop({ type: Date, required: true })
  updatedAt: Date;
}

export type AuthDocument = AuthModel & Document;
const schema = SchemaFactory.createForClass(AuthModel);

export const AuthSchema = schema;
