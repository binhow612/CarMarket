import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarMake } from '../../entities/car-make.entity';
import { CarModel } from '../../entities/car-model.entity';
import { CarMetadata, MetadataType } from '../../entities/car-metadata.entity';

@Injectable()
export class MetadataService {
  constructor(
    @InjectRepository(CarMake)
    private readonly carMakeRepository: Repository<CarMake>,
    @InjectRepository(CarModel)
    private readonly carModelRepository: Repository<CarModel>,
    @InjectRepository(CarMetadata)
    private readonly carMetadataRepository: Repository<CarMetadata>,
  ) {}

  async getAllMakes() {
    return this.carMakeRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async getModelsByMake(makeId: string) {
    const make = await this.carMakeRepository.findOne({
      where: { id: makeId, isActive: true },
    });

    if (!make) {
      throw new NotFoundException('Car make not found');
    }

    return this.carModelRepository.find({
      where: { makeId, isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async getMetadataByType(type: MetadataType) {
    return this.carMetadataRepository.find({
      where: { type, isActive: true },
      order: { sortOrder: 'ASC', value: 'ASC' },
    });
  }

  async getAllMetadata() {
    const [
      fuelTypes,
      transmissionTypes,
      bodyTypes,
      conditions,
      priceTypes,
      carFeatures,
      colors,
      makes,
    ] = await Promise.all([
      this.getMetadataByType(MetadataType.FUEL_TYPE),
      this.getMetadataByType(MetadataType.TRANSMISSION_TYPE),
      this.getMetadataByType(MetadataType.BODY_TYPE),
      this.getMetadataByType(MetadataType.CONDITION),
      this.getMetadataByType(MetadataType.PRICE_TYPE),
      this.getMetadataByType(MetadataType.CAR_FEATURE),
      this.getMetadataByType(MetadataType.COLOR),
      this.getAllMakes(),
    ]);

    return {
      fuelTypes,
      transmissionTypes,
      bodyTypes,
      conditions,
      priceTypes,
      carFeatures,
      colors,
      makes,
    };
  }

  async getCarMakesWithModels() {
    return this.carMakeRepository.find({
      where: { isActive: true },
      relations: ['models'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  // Admin methods for managing metadata
  async createMake(name: string, displayName?: string, logoUrl?: string) {
    const make = this.carMakeRepository.create({
      name: name.toLowerCase(),
      displayName: displayName || name,
      logoUrl,
    });
    return this.carMakeRepository.save(make);
  }

  async createModel(makeId: string, name: string, displayName?: string) {
    const make = await this.carMakeRepository.findOne({
      where: { id: makeId },
    });

    if (!make) {
      throw new NotFoundException('Car make not found');
    }

    const model = this.carModelRepository.create({
      name: name.toLowerCase(),
      displayName: displayName || name,
      makeId,
    });

    return this.carModelRepository.save(model);
  }

  async createMetadata(
    type: MetadataType,
    value: string,
    displayValue?: string,
    description?: string,
  ) {
    const metadata = this.carMetadataRepository.create({
      type,
      value: value.toLowerCase(),
      displayValue: displayValue || value,
      description,
    });

    return this.carMetadataRepository.save(metadata);
  }

  async seedInitialData() {
    // Check if data already exists
    const existingMakes = await this.carMakeRepository.count();
    if (existingMakes > 0) {
      return { message: 'Data already seeded' };
    }

    // Seed car makes
    const makes = [
      'Toyota',
      'Honda',
      'Ford',
      'Chevrolet',
      'BMW',
      'Mercedes-Benz',
      'Audi',
      'Volkswagen',
      'Nissan',
      'Hyundai',
      'Kia',
      'Mazda',
      'Subaru',
      'Lexus',
      'Infiniti',
      'Acura',
      'Cadillac',
      'Lincoln',
      'Jeep',
      'Ram',
      'GMC',
      'Buick',
      'Chrysler',
      'Dodge',
    ];

    for (const makeName of makes) {
      await this.createMake(makeName);
    }

    // Seed metadata
    const metadataSeeds = [
      // Fuel Types
      { type: MetadataType.FUEL_TYPE, value: 'petrol', displayValue: 'Petrol' },
      { type: MetadataType.FUEL_TYPE, value: 'diesel', displayValue: 'Diesel' },
      {
        type: MetadataType.FUEL_TYPE,
        value: 'electric',
        displayValue: 'Electric',
      },
      { type: MetadataType.FUEL_TYPE, value: 'hybrid', displayValue: 'Hybrid' },
      { type: MetadataType.FUEL_TYPE, value: 'lpg', displayValue: 'LPG' },
      { type: MetadataType.FUEL_TYPE, value: 'cng', displayValue: 'CNG' },

      // Transmission Types
      {
        type: MetadataType.TRANSMISSION_TYPE,
        value: 'manual',
        displayValue: 'Manual',
      },
      {
        type: MetadataType.TRANSMISSION_TYPE,
        value: 'automatic',
        displayValue: 'Automatic',
      },
      {
        type: MetadataType.TRANSMISSION_TYPE,
        value: 'cvt',
        displayValue: 'CVT',
      },
      {
        type: MetadataType.TRANSMISSION_TYPE,
        value: 'semi_automatic',
        displayValue: 'Semi-Automatic',
      },

      // Body Types
      { type: MetadataType.BODY_TYPE, value: 'sedan', displayValue: 'Sedan' },
      {
        type: MetadataType.BODY_TYPE,
        value: 'hatchback',
        displayValue: 'Hatchback',
      },
      { type: MetadataType.BODY_TYPE, value: 'suv', displayValue: 'SUV' },
      { type: MetadataType.BODY_TYPE, value: 'coupe', displayValue: 'Coupe' },
      {
        type: MetadataType.BODY_TYPE,
        value: 'convertible',
        displayValue: 'Convertible',
      },
      { type: MetadataType.BODY_TYPE, value: 'wagon', displayValue: 'Wagon' },
      {
        type: MetadataType.BODY_TYPE,
        value: 'pickup',
        displayValue: 'Pickup Truck',
      },
      { type: MetadataType.BODY_TYPE, value: 'van', displayValue: 'Van' },
      {
        type: MetadataType.BODY_TYPE,
        value: 'minivan',
        displayValue: 'Minivan',
      },

      // Conditions
      {
        type: MetadataType.CONDITION,
        value: 'excellent',
        displayValue: 'Excellent',
      },
      {
        type: MetadataType.CONDITION,
        value: 'very_good',
        displayValue: 'Very Good',
      },
      { type: MetadataType.CONDITION, value: 'good', displayValue: 'Good' },
      { type: MetadataType.CONDITION, value: 'fair', displayValue: 'Fair' },
      { type: MetadataType.CONDITION, value: 'poor', displayValue: 'Poor' },

      // Price Types
      {
        type: MetadataType.PRICE_TYPE,
        value: 'fixed',
        displayValue: 'Fixed Price',
      },
      {
        type: MetadataType.PRICE_TYPE,
        value: 'negotiable',
        displayValue: 'Negotiable',
      },
      {
        type: MetadataType.PRICE_TYPE,
        value: 'auction',
        displayValue: 'Auction',
      },

      // Car Features
      {
        type: MetadataType.CAR_FEATURE,
        value: 'air_conditioning',
        displayValue: 'Air Conditioning',
      },
      {
        type: MetadataType.CAR_FEATURE,
        value: 'power_steering',
        displayValue: 'Power Steering',
      },
      {
        type: MetadataType.CAR_FEATURE,
        value: 'power_windows',
        displayValue: 'Power Windows',
      },
      { type: MetadataType.CAR_FEATURE, value: 'abs', displayValue: 'ABS' },
      {
        type: MetadataType.CAR_FEATURE,
        value: 'airbags',
        displayValue: 'Airbags',
      },
      {
        type: MetadataType.CAR_FEATURE,
        value: 'alloy_wheels',
        displayValue: 'Alloy Wheels',
      },
      {
        type: MetadataType.CAR_FEATURE,
        value: 'central_locking',
        displayValue: 'Central Locking',
      },
      {
        type: MetadataType.CAR_FEATURE,
        value: 'fog_lights',
        displayValue: 'Fog Lights',
      },
      {
        type: MetadataType.CAR_FEATURE,
        value: 'gps_navigation',
        displayValue: 'GPS Navigation',
      },
      {
        type: MetadataType.CAR_FEATURE,
        value: 'leather_seats',
        displayValue: 'Leather Seats',
      },
      {
        type: MetadataType.CAR_FEATURE,
        value: 'sunroof',
        displayValue: 'Sunroof',
      },
      {
        type: MetadataType.CAR_FEATURE,
        value: 'bluetooth',
        displayValue: 'Bluetooth',
      },
      {
        type: MetadataType.CAR_FEATURE,
        value: 'usb_connectivity',
        displayValue: 'USB Connectivity',
      },
      {
        type: MetadataType.CAR_FEATURE,
        value: 'reverse_camera',
        displayValue: 'Reverse Camera',
      },
      {
        type: MetadataType.CAR_FEATURE,
        value: 'parking_sensors',
        displayValue: 'Parking Sensors',
      },
      {
        type: MetadataType.CAR_FEATURE,
        value: 'cruise_control',
        displayValue: 'Cruise Control',
      },
      {
        type: MetadataType.CAR_FEATURE,
        value: 'keyless_entry',
        displayValue: 'Keyless Entry',
      },
      {
        type: MetadataType.CAR_FEATURE,
        value: 'push_start',
        displayValue: 'Push Start',
      },
      {
        type: MetadataType.CAR_FEATURE,
        value: 'heated_seats',
        displayValue: 'Heated Seats',
      },

      // Colors
      { type: MetadataType.COLOR, value: 'white', displayValue: 'White' },
      { type: MetadataType.COLOR, value: 'black', displayValue: 'Black' },
      { type: MetadataType.COLOR, value: 'silver', displayValue: 'Silver' },
      { type: MetadataType.COLOR, value: 'gray', displayValue: 'Gray' },
      { type: MetadataType.COLOR, value: 'red', displayValue: 'Red' },
      { type: MetadataType.COLOR, value: 'blue', displayValue: 'Blue' },
      { type: MetadataType.COLOR, value: 'green', displayValue: 'Green' },
      { type: MetadataType.COLOR, value: 'yellow', displayValue: 'Yellow' },
      { type: MetadataType.COLOR, value: 'brown', displayValue: 'Brown' },
      { type: MetadataType.COLOR, value: 'gold', displayValue: 'Gold' },
    ];

    for (const item of metadataSeeds) {
      await this.createMetadata(item.type, item.value, item.displayValue);
    }

    return { message: 'Initial data seeded successfully' };
  }

  // Admin CRUD operations for makes
  async updateMake(
    id: string,
    data: {
      name?: string;
      displayName?: string;
      logoUrl?: string;
      isActive?: boolean;
    },
  ) {
    const make = await this.carMakeRepository.findOne({ where: { id } });
    if (!make) {
      throw new NotFoundException('Car make not found');
    }

    Object.assign(make, data);
    return this.carMakeRepository.save(make);
  }

  async deleteMake(id: string) {
    const make = await this.carMakeRepository.findOne({ where: { id } });
    if (!make) {
      throw new NotFoundException('Car make not found');
    }

    await this.carMakeRepository.remove(make);
    return { message: 'Car make deleted successfully' };
  }

  // Admin CRUD operations for models
  async updateModel(
    id: string,
    data: {
      name?: string;
      displayName?: string;
      isActive?: boolean;
    },
  ) {
    const model = await this.carModelRepository.findOne({ where: { id } });
    if (!model) {
      throw new NotFoundException('Car model not found');
    }

    Object.assign(model, data);
    return this.carModelRepository.save(model);
  }

  async deleteModel(id: string) {
    const model = await this.carModelRepository.findOne({ where: { id } });
    if (!model) {
      throw new NotFoundException('Car model not found');
    }

    await this.carModelRepository.remove(model);
    return { message: 'Car model deleted successfully' };
  }

  // Admin CRUD operations for metadata
  async updateMetadata(
    id: string,
    data: {
      value?: string;
      displayValue?: string;
      description?: string;
      isActive?: boolean;
    },
  ) {
    const metadata = await this.carMetadataRepository.findOne({
      where: { id },
    });
    if (!metadata) {
      throw new NotFoundException('Metadata not found');
    }

    Object.assign(metadata, data);
    return this.carMetadataRepository.save(metadata);
  }

  async deleteMetadata(id: string) {
    const metadata = await this.carMetadataRepository.findOne({
      where: { id },
    });
    if (!metadata) {
      throw new NotFoundException('Metadata not found');
    }

    await this.carMetadataRepository.remove(metadata);
    return { message: 'Metadata deleted successfully' };
  }

  async getAllMetadataForAdmin() {
    const [makes, models, metadata] = await Promise.all([
      this.carMakeRepository.find({ order: { sortOrder: 'ASC', name: 'ASC' } }),
      this.carModelRepository.find({
        relations: ['make'],
        order: { sortOrder: 'ASC', name: 'ASC' },
      }),
      this.carMetadataRepository.find({
        order: { type: 'ASC', sortOrder: 'ASC', value: 'ASC' },
      }),
    ]);

    return { makes, models, metadata };
  }
}
