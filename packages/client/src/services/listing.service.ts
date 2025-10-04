import { apiClient } from "../lib/api";
import type { ListingDetail, SearchFilters, SearchResponse } from "../types";

export interface CreateListingPayload {
  title: string;
  description: string;
  price: number;
  priceType?: string;
  location: string;
  city?: string;
  state?: string;
  country?: string;
  carDetail: {
    make: string;
    model: string;
    year: number;
    bodyType: string;
    fuelType: string;
    transmission: string;
    engineSize: number;
    enginePower: number;
    mileage: number;
    color: string;
    numberOfDoors?: number;
    numberOfSeats?: number;
    condition: string;
    vin?: string;
    registrationNumber?: string;
    previousOwners?: number;
    description?: string;
    features?: string[];
  };
  images?: {
    filename: string;
    originalName: string;
    url: string;
    type?: string;
    alt?: string;
    fileSize?: number;
    mimeType?: string;
  }[];
}

export class ListingService {
  static async createListing(
    data: CreateListingPayload
  ): Promise<ListingDetail> {
    return apiClient.post<ListingDetail>("/listings", data);
  }

  static async getListings(page: number = 1, limit: number = 10) {
    return apiClient.get("/listings", { page, limit });
  }

  static async getListing(id: string): Promise<ListingDetail> {
    return apiClient.get<ListingDetail>(`/listings/${id}`);
  }

  static async updateListing(
    id: string,
    data: Partial<CreateListingPayload>
  ): Promise<ListingDetail> {
    return apiClient.patch<ListingDetail>(`/listings/${id}`, data);
  }

  static async deleteListing(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/listings/${id}`);
  }

  static async searchListings(filters: SearchFilters): Promise<SearchResponse> {
    return apiClient.get<SearchResponse>("/search", filters);
  }

  static async uploadCarImages(files: File[]): Promise<{
    images: Array<{
      filename: string;
      url: string;
      originalName: string;
      fileSize: number;
      mimeType: string;
    }>;
  }> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append(`images`, file);
    });

    return apiClient.post<{
      images: Array<{
        filename: string;
        url: string;
        originalName: string;
        fileSize: number;
        mimeType: string;
      }>;
    }>("/listings/upload-images", formData);
  }

  static async getUserListings(page: number = 1, limit: number = 10) {
    return apiClient.get("/users/listings", { page, limit });
  }

  static async updateListingStatus(listingId: string, status: string) {
    return apiClient.put(`/listings/${listingId}/status`, { status });
  }
}
