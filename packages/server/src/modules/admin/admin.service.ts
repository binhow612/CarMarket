import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { User, UserRole } from '../../entities/user.entity';
import {
  ListingDetail,
  ListingStatus,
} from '../../entities/listing-detail.entity';
import { Transaction } from '../../entities/transaction.entity';
import { ListingPendingChanges } from '../../entities/listing-pending-changes.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ListingDetail)
    private readonly listingRepository: Repository<ListingDetail>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(ListingPendingChanges)
    private readonly pendingChangesRepository: Repository<ListingPendingChanges>,
  ) {}

  async getAllUsers(page: number = 1, limit: number = 10) {
    const [users, total] = await this.userRepository.findAndCount({
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'isActive',
        'isEmailVerified',
        'phoneNumber',
        'location',
        'bio',
        'dateOfBirth',
        'createdAt',
        'updatedAt',
      ],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPendingListings(page: number = 1, limit: number = 10) {
    const [listings, total] = await this.listingRepository.findAndCount({
      where: { status: ListingStatus.PENDING },
      relations: ['carDetail', 'carDetail.images', 'seller'],
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async approveListing(
    listingId: string,
    adminUserId: string,
  ): Promise<{ message: string }> {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Apply any pending changes first
    const pendingChanges = await this.pendingChangesRepository.find({
      where: { listingId, isApplied: false },
    });

    for (const change of pendingChanges) {
      // Apply the changes to the listing
      if (
        change.changes.listing &&
        Object.keys(change.changes.listing).length > 0
      ) {
        await this.listingRepository.update(listingId, change.changes.listing);
      }

      // Mark the pending change as applied
      await this.pendingChangesRepository.update(change.id, {
        isApplied: true,
        appliedAt: new Date(),
        appliedByUserId: adminUserId,
      });
    }

    // Update listing status to approved
    await this.listingRepository.update(listingId, {
      status: ListingStatus.APPROVED,
      approvedAt: new Date(),
    });

    return { message: 'Listing approved successfully' };
  }

  async rejectListing(
    listingId: string,
    reason?: string,
  ): Promise<{ message: string }> {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    await this.listingRepository.update(listingId, {
      status: ListingStatus.REJECTED,
      rejectedAt: new Date(),
      rejectionReason: reason,
    });

    return { message: 'Listing rejected successfully' };
  }

  async getListingWithPendingChanges(listingId: string) {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId },
      relations: ['carDetail', 'carDetail.images', 'seller'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Get only non-applied pending changes
    const pendingChanges = await this.pendingChangesRepository.find({
      where: { listingId, isApplied: false },
      relations: ['changedBy'],
      order: { createdAt: 'DESC' },
    });

    return {
      ...listing,
      pendingChanges,
    };
  }

  async getTransactions(page: number = 1, limit: number = 10) {
    const [transactions, total] = await this.transactionRepository.findAndCount(
      {
        relations: ['buyer', 'seller', 'listing'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      },
    );

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDashboardStats() {
    const totalUsers = await this.userRepository.count();
    const totalListings = await this.listingRepository.count();
    const pendingListings = await this.listingRepository.count({
      where: { status: ListingStatus.PENDING },
    });
    const totalTransactions = await this.transactionRepository.count();

    return {
      totalUsers,
      totalListings,
      pendingListings,
      totalTransactions,
    };
  }

  // Enhanced listing management
  async getAllListings(
    page: number = 1,
    limit: number = 10,
    status?: string,
    search?: string,
  ) {
    const queryBuilder = this.listingRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.seller', 'seller')
      .leftJoinAndSelect('listing.carDetail', 'carDetail')
      .leftJoinAndSelect('carDetail.images', 'images')
      .orderBy('listing.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('listing.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(listing.title ILIKE :search OR seller.firstName ILIKE :search OR seller.lastName ILIKE :search OR carDetail.make ILIKE :search OR carDetail.model ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [listings, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getListingById(id: string) {
    const listing = await this.listingRepository.findOne({
      where: { id },
      relations: ['seller', 'carDetail', 'carDetail.images', 'carImages'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return listing;
  }

  async updateListingStatus(id: string, status: string, reason?: string) {
    const listing = await this.listingRepository.findOne({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    listing.status = status as ListingStatus;
    if (reason) {
      listing.rejectionReason = reason;
    }

    return this.listingRepository.save(listing);
  }

  async deleteListing(id: string, reason?: string) {
    const listing = await this.listingRepository.findOne({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Soft delete by setting status to INACTIVE
    listing.status = ListingStatus.INACTIVE;
    if (reason) {
      listing.rejectionReason = reason;
    }

    return this.listingRepository.save(listing);
  }

  async toggleFeatured(id: string) {
    const listing = await this.listingRepository.findOne({
      where: { id },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    listing.isFeatured = !listing.isFeatured;
    return this.listingRepository.save(listing);
  }

  // Enhanced user management
  async getUserById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'isActive',
        'isEmailVerified',
        'phoneNumber',
        'location',
        'bio',
        'dateOfBirth',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUserStatus(id: string, isActive: boolean, reason?: string) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = isActive;
    return this.userRepository.save(user);
  }

  async updateUserRole(id: string, role: string) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = role as UserRole;
    return this.userRepository.save(user);
  }

  async getUserListings(userId: string, page: number = 1, limit: number = 10) {
    const [listings, total] = await this.listingRepository.findAndCount({
      where: { sellerId: userId },
      relations: ['carDetail', 'carDetail.images', 'seller'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Analytics and reports
  async getAnalyticsOverview() {
    const [
      totalUsers,
      totalListings,
      activeListings,
      pendingListings,
      totalTransactions,
    ] = await Promise.all([
      this.userRepository.count(),
      this.listingRepository.count(),
      this.listingRepository.count({
        where: { status: ListingStatus.APPROVED },
      }),
      this.listingRepository.count({
        where: { status: ListingStatus.PENDING },
      }),
      this.transactionRepository.count(),
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentUsers, recentListings] = await Promise.all([
      this.userRepository.count({
        where: {
          createdAt: MoreThanOrEqual(sevenDaysAgo),
        },
      }),
      this.listingRepository.count({
        where: {
          createdAt: MoreThanOrEqual(sevenDaysAgo),
        },
      }),
    ]);

    return {
      totalUsers,
      totalListings,
      activeListings,
      pendingListings,
      totalTransactions,
      recentUsers,
      recentListings,
    };
  }

  async getListingAnalytics(period: string = '30d') {
    // This would typically involve more complex date calculations
    // For now, returning basic stats
    const totalListings = await this.listingRepository.count();
    const activeListings = await this.listingRepository.count({
      where: { status: ListingStatus.APPROVED },
    });
    const pendingListings = await this.listingRepository.count({
      where: { status: ListingStatus.PENDING },
    });

    return {
      totalListings,
      activeListings,
      pendingListings,
      period,
    };
  }

  async getUserAnalytics(period: string = '30d') {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({
      where: { isActive: true },
    });

    return {
      totalUsers,
      activeUsers,
      period,
    };
  }
}
