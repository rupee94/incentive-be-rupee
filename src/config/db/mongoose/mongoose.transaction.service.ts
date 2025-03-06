import { Inject, Injectable } from '@nestjs/common';
import { ITransactionService } from '../common/transaction.interface.service';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class MongooseTransactionServiceImpl implements ITransactionService {
  constructor(
    @Inject(getConnectionToken())
    private readonly mongooseConnection: Connection,
  ) {}

  async execute(units: any[]): Promise<void> {
    const session = await this.mongooseConnection.startSession();
    session.startTransaction();

    try {
      for (const unit of units) {
        await (<Function>unit)(session);
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
