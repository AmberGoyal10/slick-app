import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Date, HydratedDocument } from 'mongoose';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema()
export class Transaction {
  @Prop({ type: mongoose.Schema.Types.Number, required: true })
  transactionID: number;

  @Prop({ type: mongoose.Schema.Types.Number, required: true })
  amount: number;

  @Prop({ type: mongoose.Schema.Types.String, required: true })
  userID: string;

  @Prop({ type: mongoose.Schema.Types.Date, required: true })
  timestamp: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

TransactionSchema.index(
  {
    transactionID: 1,
  },
  { unique: true },
);

TransactionSchema.index({ userID: 1, timestamp: 1 });

TransactionSchema.index({ amount: 1 });
