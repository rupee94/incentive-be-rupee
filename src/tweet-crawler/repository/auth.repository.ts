import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuthDocument, AuthModel } from '../schema/auth.schema';
import { Model } from 'mongoose';

// TODO Redis 이용
@Injectable()
export class AuthRepository {
  constructor(
    @InjectModel(AuthModel.name)
    private readonly authModel: Model<AuthDocument>,
  ) {}

  getModel() {
    return this.authModel;
  }

  async findAll() {
    return await this.authModel.find();
  }

  async updateOne(
    old_access_token: string,
    new_access_token: string,
    new_refresh_token: string,
  ) {
    return await this.authModel.updateOne(
      { access_token: old_access_token },
      { access_token: new_access_token, refresh_token: new_refresh_token },
      { upsert: true },
    );
  }
}
