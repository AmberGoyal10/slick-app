import { Injectable } from '@nestjs/common';
import { Transaction } from './transaction.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as moment from 'moment';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
  ) {}

  cache = new Map();

  async getAverageTransactionAmount() {
    const fromCache = this.cache.get('avg');
    if (fromCache) return fromCache;

    const totalAmountSpent = await this.transactionModel.aggregate([
      { $match: {} },
      {
        $group: {
          _id: '',
          totalAmount: { $sum: '$amount' },
          countDocuments: { $sum: 1 },
        },
      },
    ]);

    const avg = (
      totalAmountSpent[0].totalAmount / totalAmountSpent[0].countDocuments
    ).toFixed(2);

    this.cache.set('avg', avg);

    return avg;
  }

  async getAllTransaction(date: string, limit = 10, skip = 0) {
    const startDate = new Date(date);
    const endDate = new Date(moment(date).add(1, 'd').toISOString());

    return await this.transactionModel.aggregate([
      {
        $match: {
          $and: [
            { timestamp: { $gte: startDate } },
            { timestamp: { $lte: endDate } },
          ],
        },
      },
      { $skip: skip },
      {
        $limit: limit,
      },
    ]);
  }

  async getTopNUserOfMonth(n: number, year: number, month = null) {
    if (year && month) {
      const time = `${year}-${month < 10 ? `0${month}` : month}`;

      const fromCache = this.cache.get(`topN-${time}`);
      if (fromCache) return fromCache;

      const startDate = moment(time, 'YYYY-MM').startOf('month').toISOString();

      const endDate = moment(time, 'YYYY-MM')
        .add(1, 'M')
        .startOf('month')
        .toISOString();

      const topNUsers = await this.transactionModel
        .aggregate([
          {
            $match: {
              $and: [
                { timestamp: { $gt: new Date(startDate) } },
                { timestamp: { $lt: new Date(endDate) } },
              ],
            },
          },
          {
            $group: {
              _id: '$userID',
              totalAmount: { $sum: '$amount' },
            },
          },
          { $sort: { totalAmount: -1 } },
          { $limit: n },
        ])
        .option({ allowDiskUse: true });

      const users = topNUsers.map((doc) => doc._id);

      this.cache.set(`topN-${time}`, users);

      return users;
    } else {
      const fromCache = this.cache.get(`topN-${year}`);
      if (fromCache) return fromCache;

      const startDate = moment(`${year}`, 'YYYY').startOf('year').toISOString();

      const endDate = moment(`${year}`, 'YYYY')
        .add(1, 'y')
        .startOf('year')
        .toISOString();

      const topNUsers = await this.transactionModel.aggregate([
        {
          $match: {
            $and: [
              { timestamp: { $gt: new Date(startDate) } },
              { timestamp: { $lt: new Date(endDate) } },
            ],
          },
        },
        {
          $project: {
            date: {
              $dateToString: {
                date: '$timestamp',
                format: '%Y-%m',
              },
            },
            userID: 1,
            amount: 1,
          },
        },
        {
          $group: {
            _id: {
              date: '$date',
              userID: '$userID',
            },
            totalAmount: { $sum: '$amount' },
          },
        },
        {
          $group: {
            _id: '$_id.date',
            users: { $push: { user: '$_id.userID', amount: '$totalAmount' } },
          },
        },
      ]);
    }
  }

  private async monthlyUserTransactions(yearMonth: string) {
    const startDate = moment(yearMonth, 'YYYY-MM')
      .startOf('month')
      .toISOString();

    const endDate = moment(yearMonth, 'YYYY-MM')
      .add(1, 'M')
      .startOf('month')
      .toISOString();

    return await this.transactionModel.aggregate([
      {
        $match: {
          $and: [
            { timestamp: { $gt: new Date(startDate) } },
            { timestamp: { $lt: new Date(endDate) } },
          ],
        },
      },
      {
        $group: { _id: '$userID', totalTransactions: { $sum: 1 } },
      },
    ]);
  }

  async getPotentialUsers() {
    const lastMonth = moment().subtract(1, 'M').format('YYYY-MM');
    const last2Month = moment().subtract(2, 'M').format('YYYY-MM');

    const [lastMonthStats, last2MonthStats] = await Promise.all([
      this.monthlyUserTransactions(lastMonth),
      this.monthlyUserTransactions(last2Month),
    ]);

    console.log({
      l1: lastMonthStats.length,
      l2: last2MonthStats.length,
    });

    // naive approach
    const ans = [];
    for (let i = 0; i < lastMonthStats.length; i++) {
      const user = lastMonthStats[i];

      const prevMonthStat = last2MonthStats.find(
        (stat) => stat._id === user._id,
      );

      if (
        prevMonthStat &&
        prevMonthStat.totalTransactions <= user.totalTransactions
      ) {
        ans.push(user._id);
      }
    }

    return ans;
  }
}
