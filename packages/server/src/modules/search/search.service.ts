import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  ListingDetail,
  ListingStatus,
} from '../../entities/listing-detail.entity';
import { CarDetail } from '../../entities/car-detail.entity';

export interface SearchFilters {
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  location?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(ListingDetail)
    private readonly listingRepository: Repository<ListingDetail>,
  ) {}

  async search(filters: SearchFilters) {
    const {
      make,
      model,
      yearMin,
      yearMax,
      priceMin,
      priceMax,
      mileageMax,
      fuelType,
      transmission,
      bodyType,
      location,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    const queryBuilder: SelectQueryBuilder<ListingDetail> =
      this.listingRepository
        .createQueryBuilder('listing')
        .leftJoinAndSelect('listing.carDetail', 'carDetail')
        .leftJoinAndSelect('carDetail.images', 'images')
        .leftJoinAndSelect('listing.seller', 'seller')
        .where('listing.status = :status', { status: ListingStatus.APPROVED })
        .andWhere('listing.isActive = :isActive', { isActive: true });

    // Apply filters
    if (make) {
      queryBuilder.andWhere('LOWER(carDetail.make) LIKE LOWER(:make)', {
        make: `%${make}%`,
      });
    }

    if (model) {
      queryBuilder.andWhere('LOWER(carDetail.model) LIKE LOWER(:model)', {
        model: `%${model}%`,
      });
    }

    if (yearMin) {
      queryBuilder.andWhere('carDetail.year >= :yearMin', { yearMin });
    }

    if (yearMax) {
      queryBuilder.andWhere('carDetail.year <= :yearMax', { yearMax });
    }

    if (priceMin) {
      queryBuilder.andWhere('listing.price >= :priceMin', { priceMin });
    }

    if (priceMax) {
      queryBuilder.andWhere('listing.price <= :priceMax', { priceMax });
    }

    if (mileageMax) {
      queryBuilder.andWhere('carDetail.mileage <= :mileageMax', { mileageMax });
    }

    if (fuelType) {
      queryBuilder.andWhere('carDetail.fuelType = :fuelType', { fuelType });
    }

    if (transmission) {
      queryBuilder.andWhere('carDetail.transmission = :transmission', {
        transmission,
      });
    }

    if (bodyType) {
      queryBuilder.andWhere('carDetail.bodyType = :bodyType', { bodyType });
    }

    if (location) {
      queryBuilder.andWhere('LOWER(listing.location) LIKE LOWER(:location)', {
        location: `%${location}%`,
      });
    }

    // Apply sorting
    const validSortFields = [
      'createdAt',
      'price',
      'mileage',
      'year',
      'viewCount',
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    if (sortField === 'mileage' || sortField === 'year') {
      queryBuilder.orderBy(`carDetail.${sortField}`, sortOrder);
    } else {
      queryBuilder.orderBy(`listing.${sortField}`, sortOrder);
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [listings, total] = await queryBuilder.getManyAndCount();

    return {
      listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: filters,
    };
  }
}
