import { Controller, Get, Query } from '@nestjs/common';
import { TransactionService } from './transaction.service';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get('/avg-trans-amt')
  async getAverageTransactionAmount() {
    return await this.transactionService.getAverageTransactionAmount();
  }

  @Get('/all-trans')
  async getAllTransaction(
    @Query('date') date: string,
    @Query('limit') limit: number,
    @Query('skip') skip: number,
  ) {
    return await this.transactionService.getAllTransaction(
      date,
      +limit || 10,
      +skip || 0,
    );
  }

  @Get('/top-users')
  async getTopNUserOfMonth(
    @Query('year') year: number,
    @Query('month') month: number,
    @Query('n') n: number,
  ) {
    return await this.transactionService.getTopNUserOfMonth(+n, +year, +month);
  }

  @Get('/potential-users')
  async getPotentialUsers() {
    return await this.transactionService.getPotentialUsers();
  }
}
