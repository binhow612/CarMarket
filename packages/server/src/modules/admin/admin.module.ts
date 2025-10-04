import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../../entities/user.entity';
import { ListingDetail } from '../../entities/listing-detail.entity';
import { Transaction } from '../../entities/transaction.entity';
import { ListingPendingChanges } from '../../entities/listing-pending-changes.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ListingDetail,
      Transaction,
      ListingPendingChanges,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
