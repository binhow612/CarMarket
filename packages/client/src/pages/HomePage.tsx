import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  Car,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card, CardContent } from "../components/ui/Card";
import { EnhancedSelect } from "../components/ui/EnhancedSelect";
import { CarCard } from "../components/CarCard";
import { useAuthStore } from "../store/auth";
import type { ListingDetail, SearchFilters } from "../types";
import { ListingService } from "../services/listing.service";
import { useMetadata } from "../services/metadata.service";

export function HomePage() {
  const { user } = useAuthStore();
  const [listings, setListings] = useState<ListingDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sortBy, setSortBy] = useState<string>("newest");
  const { metadata } = useMetadata();

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "year-new", label: "Year: Newest First" },
    { value: "year-old", label: "Year: Oldest First" },
    { value: "mileage-low", label: "Mileage: Low to High" },
    { value: "mileage-high", label: "Mileage: High to Low" },
  ];

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const response = (await ListingService.getListings(
        pagination.page,
        pagination.limit
      )) as {
        listings: ListingDetail[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };
      setListings(response.listings || []);
      setPagination(
        response.pagination || {
          page: 1,
          limit: 12,
          total: 0,
          totalPages: 0,
        }
      );
    } catch (error) {
      console.error("Failed to fetch listings:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchListings();

    // Refresh favorite states when user comes back to the page
    const handleFocus = () => {
      // Force re-render of CarCard components to refresh favorite states
      setListings((prev) => [...prev]);
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchListings]);

  // Trigger search when pagination changes
  useEffect(() => {
    if (searchQuery.trim() || Object.keys(filters).length > 0) {
      handleSearch();
    }
  }, [pagination.page, pagination.limit]);

  const handleSearch = async () => {
    if (!searchQuery.trim() && Object.keys(filters).length === 0) {
      fetchListings();
      return;
    }

    try {
      setLoading(true);
      const searchFilters: SearchFilters = {
        ...filters,
        ...(searchQuery.trim() && {
          make: searchQuery,
          model: searchQuery,
        }),
        page: pagination.page,
        limit: pagination.limit,
      };

      const response = await ListingService.searchListings(searchFilters);
      setListings(response.listings || []);
      setPagination(
        response.pagination || {
          page: 1,
          limit: 12,
          total: 0,
          totalPages: 0,
        }
      );
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery("");
    setShowFilters(false);
    fetchListings();
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleLimitChange = (newLimit: number) => {
    setPagination((prev) => ({
      ...prev,
      limit: newLimit,
      page: 1, // Reset to first page when changing limit
    }));
  };

  const sortListings = (listingsToSort: ListingDetail[]) => {
    const sorted = [...listingsToSort];

    switch (sortBy) {
      case "newest":
        return sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "oldest":
        return sorted.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "price-low":
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case "price-high":
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case "year-new":
        return sorted.sort(
          (a, b) => (b.carDetail?.year || 0) - (a.carDetail?.year || 0)
        );
      case "year-old":
        return sorted.sort(
          (a, b) => (a.carDetail?.year || 0) - (b.carDetail?.year || 0)
        );
      case "mileage-low":
        return sorted.sort(
          (a, b) => (a.carDetail?.mileage || 0) - (b.carDetail?.mileage || 0)
        );
      case "mileage-high":
        return sorted.sort(
          (a, b) => (b.carDetail?.mileage || 0) - (a.carDetail?.mileage || 0)
        );
      default:
        return sorted;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Find Your Perfect Car
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Browse thousands of quality used cars from trusted sellers
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Search by make, model, or keyword..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 text-lg text-gray-900 bg-white"
                  />
                </div>
                <Button
                  size="lg"
                  className="h-12 px-8 bg-white text-blue-600 hover:bg-gray-100"
                  onClick={handleSearch}
                >
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cars */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Featured Cars</h2>
            <div className="flex space-x-2">
              {(Object.keys(filters).length > 0 || searchQuery) && (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
              <div className="relative">
                <EnhancedSelect
                  options={sortOptions}
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as string)}
                  placeholder="Sort by"
                  searchable={false}
                  multiple={false}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && metadata && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {/* Make & Model */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Make
                    </label>
                    <EnhancedSelect
                      options={[
                        { value: "", label: "Any Make" },
                        ...(metadata.makes?.map((make) => ({
                          value: make.name,
                          label: make.displayName,
                        })) || []),
                      ]}
                      value={filters.make || ""}
                      onValueChange={(value) =>
                        setFilters({
                          ...filters,
                          make: (value as string) || undefined,
                        })
                      }
                      placeholder="Any Make"
                      searchable={true}
                      multiple={false}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Model
                    </label>
                    <Input
                      type="text"
                      placeholder="Any Model"
                      value={filters.model || ""}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          model: e.target.value || undefined,
                        })
                      }
                    />
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price Range ($)
                    </label>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.priceMin || ""}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            priceMin: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.priceMax || ""}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            priceMax: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Year Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year Range
                    </label>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        placeholder="From"
                        value={filters.yearMin || ""}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            yearMin: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                      />
                      <Input
                        type="number"
                        placeholder="To"
                        value={filters.yearMax || ""}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            yearMax: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Mileage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Mileage (miles)
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g., 50000"
                      value={filters.mileageMax || ""}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          mileageMax: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                    />
                  </div>

                  {/* Fuel Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fuel Type
                    </label>
                    <EnhancedSelect
                      options={[
                        { value: "", label: "Any Fuel" },
                        ...(metadata.fuelTypes?.map((type) => ({
                          value: type.value,
                          label: type.displayValue,
                        })) || []),
                      ]}
                      value={filters.fuelType || ""}
                      onValueChange={(value) =>
                        setFilters({
                          ...filters,
                          fuelType: (value as string) || undefined,
                        })
                      }
                      placeholder="Any Fuel"
                      searchable={true}
                      multiple={false}
                    />
                  </div>

                  {/* Body Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Body Type
                    </label>
                    <EnhancedSelect
                      options={[
                        { value: "", label: "Any Body Type" },
                        ...(metadata.bodyTypes?.map((type) => ({
                          value: type.value,
                          label: type.displayValue,
                        })) || []),
                      ]}
                      value={filters.bodyType || ""}
                      onValueChange={(value) =>
                        setFilters({
                          ...filters,
                          bodyType: (value as string) || undefined,
                        })
                      }
                      placeholder="Any Body Type"
                      searchable={true}
                      multiple={false}
                    />
                  </div>

                  {/* Transmission */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transmission
                    </label>
                    <EnhancedSelect
                      options={[
                        { value: "", label: "Any Transmission" },
                        ...(metadata.transmissionTypes?.map((type) => ({
                          value: type.value,
                          label: type.displayValue,
                        })) || []),
                      ]}
                      value={filters.transmission || ""}
                      onValueChange={(value) =>
                        setFilters({
                          ...filters,
                          transmission: (value as string) || undefined,
                        })
                      }
                      placeholder="Any Transmission"
                      searchable={true}
                      multiple={false}
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <Input
                      type="text"
                      placeholder="City or State"
                      value={filters.location || ""}
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          location: e.target.value || undefined,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </div>
                  <Button
                    onClick={handleSearch}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Apply Filters ({Object.keys(filters).length} active)
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortListings(listings)
                .slice(0, 6)
                .map((listing) => (
                  <CarCard
                    key={`${listing.id}-${user?.id || "anonymous"}`}
                    listing={listing}
                  />
                ))}
            </div>
          )}

          {!loading && listings.length === 0 && (
            <div className="text-center py-12">
              <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No cars found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search criteria
              </p>
            </div>
          )}

          {/* Pagination */}
          {!loading && listings.length > 0 && (
            <div className="flex items-center justify-between mt-8">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Show</span>
                <select
                  value={pagination.limit}
                  onChange={(e) => handleLimitChange(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value={6}>6</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
                <span className="text-sm text-gray-700">per page</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} results
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                <div className="flex items-center space-x-1">
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={
                            pagination.page === pageNum ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    }
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose CarMarket?
            </h2>
            <p className="text-lg text-gray-600">
              Trusted by thousands of buyers and sellers nationwide
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                10,000+
              </div>
              <div className="text-lg text-gray-600">Cars Available</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                50,000+
              </div>
              <div className="text-lg text-gray-600">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">99%</div>
              <div className="text-lg text-gray-600">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
