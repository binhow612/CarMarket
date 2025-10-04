import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  FileText,
  Car,
  Camera,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { EnhancedSelect } from "../components/ui/EnhancedSelect";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { ListingService } from "../services/listing.service";
import { useMetadata } from "../services/metadata.service";
import type { ListingDetail } from "../types";

const editListingSchema = z.object({
  // Listing Information
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  price: z.number().min(1, "Price must be greater than 0"),
  priceType: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),

  // Car Details
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z
    .number()
    .min(1900, "Invalid year")
    .max(new Date().getFullYear() + 1, "Invalid year"),
  bodyType: z.string().min(1, "Body type is required"),
  fuelType: z.string().min(1, "Fuel type is required"),
  transmission: z.string().min(1, "Transmission is required"),
  engineSize: z.number().min(0.1, "Engine size must be greater than 0"),
  enginePower: z.number().min(1, "Engine power must be greater than 0"),
  mileage: z.number().min(0, "Mileage cannot be negative"),
  color: z.string().min(1, "Color is required"),
  numberOfDoors: z.number().min(2).max(6).optional(),
  numberOfSeats: z.number().min(2).max(9).optional(),
  condition: z.string().min(1, "Condition is required"),
  vin: z.string().optional(),
  registrationNumber: z.string().optional(),
  previousOwners: z.number().min(0).optional(),
  carDescription: z.string().optional(),
  features: z.array(z.string()).optional(),
});

type EditListingForm = z.infer<typeof editListingSchema>;

export function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [currentImages, setCurrentImages] = useState<any[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedMakeId, setSelectedMakeId] = useState<string>("");
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [formValues, setFormValues] = useState({
    priceType: "",
    bodyType: "",
    fuelType: "",
    transmission: "",
    color: "",
    condition: "",
  });
  const { metadata, loading: metadataLoading } = useMetadata();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditListingForm>({
    resolver: zodResolver(editListingSchema),
    defaultValues: {
      numberOfDoors: 4,
      numberOfSeats: 5,
      priceType: "negotiable",
      country: "USA",
    },
  });

  useEffect(() => {
    if (id) {
      fetchListing(id);
    }
  }, [id]);

  // Load models when make is selected
  useEffect(() => {
    const loadModels = async () => {
      if (selectedMakeId && metadata?.makes) {
        const selectedMake = metadata.makes.find(
          (make) => make.id === selectedMakeId
        );
        if (selectedMake) {
          setValue("make", selectedMake.name);

          try {
            // Fetch models for the selected make
            const response = await fetch(
              `http://localhost:3000/api/metadata/makes/${selectedMakeId}/models`
            );
            const models = await response.json();
            setAvailableModels(models);
          } catch (error) {
            console.error("Failed to fetch models:", error);
            setAvailableModels([]);
          }
        }
      } else {
        setAvailableModels([]);
      }
    };

    loadModels();
  }, [selectedMakeId, metadata, setValue]);

  // Handle form value changes
  const handleFormValueChange = (field: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    setValue(field as any, value);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (uploadedImages.length + files.length > 10) {
      toast.error(
        "📸 You can upload maximum 10 images per listing. Please remove some images first."
      );
      return;
    }

    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(
          `Image "${file.name}" is too large. Please choose an image smaller than 5MB.`
        );
        return false;
      }
      if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
        toast.error(
          `"${file.name}" is not a supported image format. Please use JPEG, PNG, or GIF.`
        );
        return false;
      }
      return true;
    });

    setUploadedImages((prev) => [...prev, ...validFiles]);
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteCurrentImage = (index: number) => {
    setCurrentImages((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleFeature = (feature: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  const fetchListing = async (listingId: string) => {
    try {
      setLoading(true);
      const response = await ListingService.getListing(listingId);
      setListing(response);

      // Populate form
      setValue("title", response.title);
      setValue("description", response.description);
      setValue("price", response.price);
      setValue("priceType", response.priceType || "negotiable");
      setValue("location", response.location);
      setValue("city", response.city || "");
      setValue("state", response.state || "");
      setValue("country", response.country || "USA");
      setValue("make", response.carDetail.make);
      setValue("model", response.carDetail.model);
      setValue("year", response.carDetail.year);
      setValue("bodyType", response.carDetail.bodyType);
      setValue("fuelType", response.carDetail.fuelType);
      setValue("transmission", response.carDetail.transmission);
      setValue("engineSize", response.carDetail.engineSize);
      setValue("enginePower", response.carDetail.enginePower);
      setValue("mileage", response.carDetail.mileage);
      setValue("color", response.carDetail.color);
      setValue("numberOfDoors", response.carDetail.numberOfDoors || 4);
      setValue("numberOfSeats", response.carDetail.numberOfSeats || 5);
      setValue("condition", response.carDetail.condition);
      setValue("vin", response.carDetail.vin || "");
      setValue(
        "registrationNumber",
        response.carDetail.registrationNumber || ""
      );
      setValue("previousOwners", response.carDetail.previousOwners || 0);
      setValue("carDescription", response.carDetail.description || "");
      setValue("features", response.carDetail.features || []);

      // Set features state
      setSelectedFeatures(response.carDetail.features || []);

      // Set current images for display
      if (response.carDetail.images && response.carDetail.images.length > 0) {
        setCurrentImages(response.carDetail.images);
      }
    } catch (error) {
      toast.error("Failed to load listing details");
      navigate("/profile");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: EditListingForm) => {
    if (!listing || !id) return;

    try {
      setIsUploading(true);

      // Upload new images if any
      let imageUrls: Array<{
        filename: string;
        url: string;
        originalName: string;
        fileSize: number;
        mimeType: string;
      }> = [];
      if (uploadedImages.length > 0) {
        const uploadResponse =
          await ListingService.uploadCarImages(uploadedImages);
        imageUrls = uploadResponse.images;
      }

      const updateData = {
        title: data.title,
        description: data.description,
        price: data.price,
        priceType: data.priceType,
        location: data.location,
        city: data.city,
        state: data.state,
        country: data.country,
        carDetail: {
          make: data.make,
          model: data.model,
          year: data.year,
          bodyType: data.bodyType,
          fuelType: data.fuelType,
          transmission: data.transmission,
          engineSize: data.engineSize,
          enginePower: data.enginePower,
          mileage: data.mileage,
          color: data.color,
          numberOfDoors: data.numberOfDoors || 4,
          numberOfSeats: data.numberOfSeats || 5,
          condition: data.condition,
          vin: data.vin,
          registrationNumber: data.registrationNumber,
          previousOwners: data.previousOwners,
          description: data.carDescription,
          features: selectedFeatures,
        },
        // Include new images if uploaded
        ...(imageUrls.length > 0 && {
          images: imageUrls.map((img, index) => ({
            filename: img.filename,
            originalName: img.originalName,
            url: img.url,
            type: index === 0 ? "exterior" : "other",
            alt: `${data.make} ${data.model} image ${index + 1}`,
            fileSize: img.fileSize,
            mimeType: img.mimeType,
          })),
        }),
      };

      await ListingService.updateListing(id, updateData);
      toast.success(
        "✅ Your listing has been updated successfully! It will be reviewed again by our team."
      );
      navigate("/my-listings");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "We couldn't update your listing. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading || metadataLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="space-y-6">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Listing not found
          </h1>
          <Button onClick={() => navigate("/my-listings")}>
            Back to My Listings
          </Button>
        </div>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Failed to load form data
          </h1>
          <p className="text-gray-600 mb-4">
            Unable to load the required form options. Please try again.
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => navigate("/my-listings")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Listings
        </Button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Listing</h1>
        <p className="text-gray-600">
          Update your listing details. Changes will require admin re-approval.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Listing Title
              </label>
              <Input
                id="title"
                {...register("title")}
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                {...register("description")}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Price ($)
                </label>
                <Input
                  id="price"
                  type="number"
                  {...register("price", { valueAsNumber: true })}
                  className={errors.price ? "border-red-500" : ""}
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.price.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="priceType"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Price Type
                </label>
                <EnhancedSelect
                  options={
                    metadata?.priceTypes?.map((type) => ({
                      value: type.value,
                      label: type.displayValue,
                    })) || [
                      { value: "negotiable", label: "Negotiable" },
                      { value: "fixed", label: "Fixed Price" },
                    ]
                  }
                  value={formValues.priceType}
                  onValueChange={(value) =>
                    handleFormValueChange("priceType", value as string)
                  }
                  placeholder="Select price type"
                  searchable={true}
                  multiple={false}
                  error={!!errors.priceType}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Location
                </label>
                <Input
                  id="location"
                  {...register("location")}
                  className={errors.location ? "border-red-500" : ""}
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.location.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  City
                </label>
                <Input
                  id="city"
                  {...register("city")}
                  className={errors.city ? "border-red-500" : ""}
                />
              </div>

              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  State
                </label>
                <Input
                  id="state"
                  {...register("state")}
                  className={errors.state ? "border-red-500" : ""}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Car Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Car className="w-5 h-5 mr-2" />
              Car Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label
                  htmlFor="make"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Make
                </label>
                <EnhancedSelect
                  options={
                    metadata?.makes?.map((make) => ({
                      value: make.id,
                      label: make.displayName,
                    })) || []
                  }
                  value={selectedMakeId}
                  onValueChange={(value) => {
                    setSelectedMakeId(value as string);
                  }}
                  placeholder="Select a make"
                  searchable={true}
                  multiple={false}
                  error={!!errors.make}
                />
                {errors.make && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.make.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="model"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Model
                </label>
                <EnhancedSelect
                  options={availableModels.map((model) => ({
                    value: model.id,
                    label: model.displayName,
                  }))}
                  onValueChange={(value) => {
                    const selectedModel = availableModels.find(
                      (model) => model.id === value
                    );
                    if (selectedModel) {
                      setValue("model", selectedModel.name);
                      // Auto-set body type if available
                      if (selectedModel.defaultBodyStyle) {
                        setValue("bodyType", selectedModel.defaultBodyStyle);
                      }
                    }
                  }}
                  placeholder="Select a model"
                  searchable={true}
                  multiple={false}
                  error={!!errors.model}
                />
                {errors.model && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.model.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="year"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Year
                </label>
                <Input
                  id="year"
                  type="number"
                  {...register("year", { valueAsNumber: true })}
                  className={errors.year ? "border-red-500" : ""}
                />
                {errors.year && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.year.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label
                  htmlFor="bodyType"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Body Type
                </label>
                <EnhancedSelect
                  options={
                    metadata?.bodyTypes?.map((type) => ({
                      value: type.value,
                      label: type.displayValue,
                    })) || []
                  }
                  value={formValues.bodyType}
                  onValueChange={(value) =>
                    handleFormValueChange("bodyType", value as string)
                  }
                  placeholder="Select body type"
                  searchable={true}
                  multiple={false}
                  error={!!errors.bodyType}
                />
                {errors.bodyType && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.bodyType.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="fuelType"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Fuel Type
                </label>
                <select
                  id="fuelType"
                  {...register("fuelType")}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.fuelType ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select fuel type</option>
                  {(metadata?.fuelTypes || []).map((fuelType) => (
                    <option key={fuelType.id} value={fuelType.value}>
                      {fuelType.displayValue}
                    </option>
                  ))}
                </select>
                {errors.fuelType && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.fuelType.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="transmission"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Transmission
                </label>
                <select
                  id="transmission"
                  {...register("transmission")}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.transmission ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select transmission</option>
                  {(metadata?.transmissionTypes || []).map((transmission) => (
                    <option key={transmission.id} value={transmission.value}>
                      {transmission.displayValue}
                    </option>
                  ))}
                </select>
                {errors.transmission && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.transmission.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label
                  htmlFor="engineSize"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Engine Size (L)
                </label>
                <Input
                  id="engineSize"
                  type="number"
                  step="0.1"
                  {...register("engineSize", { valueAsNumber: true })}
                  className={errors.engineSize ? "border-red-500" : ""}
                />
                {errors.engineSize && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.engineSize.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="enginePower"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Engine Power (HP)
                </label>
                <Input
                  id="enginePower"
                  type="number"
                  {...register("enginePower", { valueAsNumber: true })}
                  className={errors.enginePower ? "border-red-500" : ""}
                />
                {errors.enginePower && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.enginePower.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="mileage"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Mileage (miles)
                </label>
                <Input
                  id="mileage"
                  type="number"
                  {...register("mileage", { valueAsNumber: true })}
                  className={errors.mileage ? "border-red-500" : ""}
                />
                {errors.mileage && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.mileage.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label
                  htmlFor="color"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Color
                </label>
                <select
                  id="color"
                  {...register("color")}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.color ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select color</option>
                  {(metadata?.colors || []).map((color) => (
                    <option key={color.id} value={color.value}>
                      {color.displayValue}
                    </option>
                  ))}
                </select>
                {errors.color && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.color.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="numberOfDoors"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Number of Doors
                </label>
                <select
                  id="numberOfDoors"
                  {...register("numberOfDoors", { valueAsNumber: true })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.numberOfDoors ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value={2}>2 Doors</option>
                  <option value={3}>3 Doors</option>
                  <option value={4}>4 Doors</option>
                  <option value={5}>5 Doors</option>
                  <option value={6}>6 Doors</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="numberOfSeats"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Number of Seats
                </label>
                <select
                  id="numberOfSeats"
                  {...register("numberOfSeats", { valueAsNumber: true })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.numberOfSeats ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value={2}>2 Seats</option>
                  <option value={4}>4 Seats</option>
                  <option value={5}>5 Seats</option>
                  <option value={6}>6 Seats</option>
                  <option value={7}>7 Seats</option>
                  <option value={8}>8 Seats</option>
                  <option value={9}>9 Seats</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="condition"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Condition
              </label>
              <select
                id="condition"
                {...register("condition")}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.condition ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select condition</option>
                {(metadata?.conditions || []).map((condition) => (
                  <option key={condition.id} value={condition.value}>
                    {condition.displayValue}
                  </option>
                ))}
              </select>
              {errors.condition && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.condition.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Additional Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="vin"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  VIN (Optional)
                </label>
                <Input
                  id="vin"
                  {...register("vin")}
                  placeholder="Vehicle Identification Number"
                />
              </div>

              <div>
                <label
                  htmlFor="registrationNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Registration Number (Optional)
                </label>
                <Input
                  id="registrationNumber"
                  {...register("registrationNumber")}
                  placeholder="License plate number"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="previousOwners"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Previous Owners
              </label>
              <Input
                id="previousOwners"
                type="number"
                min="0"
                {...register("previousOwners", { valueAsNumber: true })}
                placeholder="Number of previous owners"
              />
            </div>

            <div>
              <label
                htmlFor="carDescription"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Car Description (Optional)
              </label>
              <textarea
                id="carDescription"
                {...register("carDescription")}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional details about the car..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Car Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Car className="w-5 h-5 mr-2" />
              Car Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(metadata?.carFeatures || []).map((feature) => (
                <label
                  key={feature.id}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(feature.value)}
                    onChange={() => toggleFeature(feature.value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {feature.displayValue}
                  </span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Image Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Camera className="w-5 h-5 mr-2" />
              Car Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Current Images */}
              {currentImages.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Images
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {currentImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={`http://localhost:3000${image.url}`}
                          alt={`Current image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            console.error("Failed to load image:", image.url);
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          Current
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteCurrentImage(index)}
                          className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="images"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Upload New Images (Optional)
                </label>
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="images"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 5MB each (max 10 images)
                      </p>
                    </div>
                    <input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {uploadedImages.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/my-listings")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {isSubmitting || isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {isUploading ? "Uploading..." : "Updating..."}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Update Listing
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
