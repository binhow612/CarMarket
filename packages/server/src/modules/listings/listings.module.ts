import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { ListingDetail } from '../../entities/listing-detail.entity';
import { CarDetail } from '../../entities/car-detail.entity';
import { CarImage } from '../../entities/car-image.entity';
import { User } from '../../entities/user.entity';
import { ListingPendingChanges } from '../../entities/listing-pending-changes.entity';
import { Transaction } from '../../entities/transaction.entity';
//import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ListingDetail,
      CarDetail,
      CarImage,
      User,
      ListingPendingChanges,
      Transaction,
    ]),
    //LogsModule,
  ],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
