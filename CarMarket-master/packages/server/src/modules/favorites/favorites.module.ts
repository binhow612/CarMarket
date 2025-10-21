import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { Favorite } from '../../entities/favorite.entity';
import { ListingDetail } from '../../entities/listing-detail.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Favorite, ListingDetail])],
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}
