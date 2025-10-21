import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import OpenAI from 'openai';
import { ListingDetail } from '../../../entities/listing-detail.entity';
import { CarMetadata } from '../../../entities/car-metadata.entity';
import { CarMake } from '../../../entities/car-make.entity';
import { CarModel } from '../../../entities/car-model.entity';
import {
  UserIntent,
  AssistantResponseDto,
  SuggestionChip,
  MessageAction,
} from '../dto/assistant-response.dto';
import { QueryExtractionService } from './query-extraction.service';
import { ListingQueryBuilderService } from './listing-query-builder.service';
import { UserContextService } from './user-context.service';
import { User } from '../../../entities/user.entity';

@Injectable()
export class ResponseHandlerService {
  private readonly logger = new Logger(ResponseHandlerService.name);
  private openai: OpenAI;

  constructor(
    @InjectRepository(ListingDetail)
    private readonly listingRepository: Repository<ListingDetail>,
    @InjectRepository(CarMetadata)
    private readonly metadataRepository: Repository<CarMetadata>,
    @InjectRepository(CarMake)
    private readonly makeRepository: Repository<CarMake>,
    @InjectRepository(CarModel)
    private readonly modelRepository: Repository<CarModel>,
    private readonly queryExtractionService: QueryExtractionService,
    private readonly listingQueryBuilderService: ListingQueryBuilderService,
    private readonly userContextService: UserContextService,
  ) {
    const apiKey = process.env.OPENAI_API_KEY;
    this.openai = new OpenAI({
      apiKey: apiKey || 'dummy-key',
    });
  }

  async handleIntent(
    intent: UserIntent,
    userQuery: string,
    extractedEntities: any,
    currentUser?: User,
  ): Promise<AssistantResponseDto> {
    switch (intent) {
      case UserIntent.CAR_SPECS:
        return this.handleCarSpecs(userQuery, extractedEntities);
      case UserIntent.CAR_LISTING:
        return this.handleCarListing(userQuery, extractedEntities);
      case UserIntent.FAQ:
        return this.handleFAQ(userQuery);
      case UserIntent.CAR_COMPARE:
        return this.handleCarCompare(userQuery, extractedEntities);
      case UserIntent.USER_INFO:
        return this.handleUserInfo(userQuery, currentUser);
      default:
        return this.handleFAQ(userQuery);
    }
  }

  private async handleCarSpecs(
    userQuery: string,
    extractedEntities: any,
  ): Promise<AssistantResponseDto> {
    try {
      // Get car details for context (from listings)
      const listings = await this.listingRepository.find({
        take: 100,
        relations: ['carDetail'],
      });

      // Build context from available car details
      const cars = listings
        .map((l) => l.carDetail)
        .filter((c) => !!c);

      const metadataContext = cars
        .map(
          (c) =>
            `${c.make} ${c.model} (${c.year}): ${c.bodyType}, ${c.fuelType}, ${c.transmission}`,
        )
        .join('\n');

      const systemPrompt = `You are a knowledgeable car expert assistant for a car marketplace.
The user is asking about car specifications or features.

Available car information in our database:
${metadataContext.substring(0, 2000)}

Provide detailed, accurate information about the car specifications requested.
If the specific car is not in our database, provide general knowledge about that car model.
Be conversational and helpful.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const message = completion.choices[0]?.message?.content || 
        "I'd be happy to help you with car specifications. Could you please specify which car model you're interested in?";

      const suggestions: SuggestionChip[] = [
        {
          id: '1',
          label: 'View available cars',
          query: 'What cars do you have available?',
          icon: '🚗',
        },
        {
          id: '2',
          label: 'Compare cars',
          query: 'Compare two cars',
          icon: '⚖️',
        },
      ];

      return {
        intent: UserIntent.CAR_SPECS,
        message,
        suggestions,
      };
    } catch (error) {
      this.logger.error('Error handling car specs:', error);
      return {
        intent: UserIntent.CAR_SPECS,
        message:
          "I'm having trouble fetching car specifications right now. Please try again or contact our support team.",
        suggestions: [],
      };
    }
  }

  private async handleCarListing(
    userQuery: string,
    extractedEntities: any,
  ): Promise<AssistantResponseDto> {
    try {
      this.logger.log(`Processing car_listing query: "${userQuery}"`);

      // Step 1: Extract structured query parameters using LLM
      const extractedParams =
        await this.queryExtractionService.extractQueryParameters(userQuery);

      this.logger.log(
        `Extraction confidence: ${extractedParams.confidence}, ` +
          `Keywords: ${extractedParams.extractedKeywords.join(', ')}`,
      );

      // Step 2: Build and execute database query
      const { listings, totalCount } =
        await this.listingQueryBuilderService.buildAndExecuteQuery(
          extractedParams,
        );

      // Step 3: Generate natural language response using LLM
      const message = await this.generateListingResponseMessage(
        userQuery,
        listings,
        totalCount,
        extractedParams,
      );

      // Step 4: Create action buttons for each listing
      const actions: MessageAction[] = listings.slice(0, 5).map((listing) => ({
        label: `View ${listing.carDetail.year} ${listing.carDetail.make} ${listing.carDetail.model}`,
        action: 'view_listing',
        data: { listingId: listing.id },
      }));

      // Step 5: Generate contextual suggestions based on results
      const suggestions = this.generateContextualSuggestions(
        listings,
        extractedParams,
        totalCount,
      );

      return {
        intent: UserIntent.CAR_LISTING,
        message,
        data: {
          listings: listings.slice(0, 5), // Send top 5 for display
          totalCount,
          appliedFilters: this.getAppliedFiltersDescription(extractedParams),
          queryStats: this.listingQueryBuilderService.getQueryStats(extractedParams),
        },
        suggestions,
        actions,
      };
    } catch (error) {
      this.logger.error('Error handling car listing:', error);
      return {
        intent: UserIntent.CAR_LISTING,
        message:
          "I'm having trouble accessing our inventory right now. Please try again or browse our listings page.",
        suggestions: [
          {
            id: '1',
            label: 'View all cars',
            query: 'Show me all available cars',
            icon: '🚗',
          },
        ],
      };
    }
  }

  /**
   * Generate natural language response message using LLM
   */
  private async generateListingResponseMessage(
    userQuery: string,
    listings: ListingDetail[],
    totalCount: number,
    extractedParams: any,
  ): Promise<string> {
    try {
      // Build listing summary for LLM context
      const listingSummary = listings.slice(0, 5).map((listing) => {
        const car = listing.carDetail;
        return {
          make: car.make,
          model: car.model,
          year: car.year,
          price: listing.price,
          mileage: car.mileage,
          bodyType: car.bodyType,
          fuelType: car.fuelType,
          transmission: car.transmission,
          condition: car.condition,
          location: listing.city || listing.location,
        };
      });

      const systemPrompt = `You are a helpful car marketplace assistant.
Generate a natural, conversational response about available car listings.

Guidelines:
1. Be enthusiastic and helpful
2. Highlight key details (price, year, mileage, features)
3. If multiple results, mention the total count
4. If no results, suggest alternatives politely
5. Keep response concise (3-5 sentences)
6. Use natural language, not bullet points
7. Mention if there are more results beyond what's shown`;

      const userPrompt = `User query: "${userQuery}"

Found ${totalCount} total listings. Here are the top ${listings.length}:

${JSON.stringify(listingSummary, null, 2)}

Applied filters: ${this.getAppliedFiltersDescription(extractedParams)}

Generate a friendly response summarizing these results.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      return (
        completion.choices[0]?.message?.content ||
        this.generateFallbackMessage(listings, totalCount)
      );
    } catch (error) {
      this.logger.error('Error generating LLM response:', error);
      return this.generateFallbackMessage(listings, totalCount);
    }
  }

  /**
   * Fallback message generation without LLM
   */
  private generateFallbackMessage(
    listings: ListingDetail[],
    totalCount: number,
  ): string {
    if (listings.length === 0) {
      return "I couldn't find any cars matching your criteria in our current inventory. Try adjusting your filters or browse all available vehicles.";
    }

    let message = `Great news! I found ${totalCount} car${totalCount > 1 ? 's' : ''} matching your criteria. `;

    if (listings.length > 0) {
      const firstCar = listings[0].carDetail;
      message += `The top result is a ${firstCar.year} ${firstCar.make} ${firstCar.model} for $${listings[0].price.toLocaleString()}. `;
    }

    if (totalCount > listings.length) {
      message += `I'm showing you the top ${listings.length} results. `;
    }

    message += 'Click on any car to see full details!';

    return message;
  }

  /**
   * Generate contextual suggestions based on search results
   */
  private generateContextualSuggestions(
    listings: ListingDetail[],
    extractedParams: any,
    totalCount: number,
  ): SuggestionChip[] {
    const suggestions: SuggestionChip[] = [];

    // If results found, suggest refinements
    if (listings.length > 0) {
      // Suggest price adjustments
      if (!extractedParams.priceMax) {
        suggestions.push({
          id: 'price-filter',
          label: 'Set budget',
          query: 'Show cars under $30,000',
          icon: '💰',
        });
      }

      // Suggest viewing specific body types if not filtered
      if (!extractedParams.bodyTypes || extractedParams.bodyTypes.length === 0) {
        const commonBodyType = this.getMostCommonBodyType(listings);
        if (commonBodyType) {
          suggestions.push({
            id: 'body-type',
            label: `More ${commonBodyType}s`,
            query: `Show me ${commonBodyType} only`,
            icon: '🚙',
          });
        }
      }

      // Suggest features if not specified
      if (!extractedParams.features || extractedParams.features.length === 0) {
        suggestions.push({
          id: 'features',
          label: 'With specific features',
          query: 'Show cars with GPS and sunroof',
          icon: '⚙️',
        });
      }
    } else {
      // No results - suggest broader searches
      suggestions.push({
        id: 'all-cars',
        label: 'View all cars',
        query: 'Show me all available cars',
        icon: '🚗',
      });

      suggestions.push({
        id: 'expand-budget',
        label: 'Expand budget',
        query: 'Show cars under $50,000',
        icon: '💰',
      });

      suggestions.push({
        id: 'different-type',
        label: 'Different type',
        query: 'Show me SUVs',
        icon: '🚙',
      });
    }

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  }

  /**
   * Get most common body type from listings
   */
  private getMostCommonBodyType(listings: ListingDetail[]): string | null {
    if (listings.length === 0) return null;

    const typeCounts: Record<string, number> = {};
    listings.forEach((listing) => {
      const type = listing.carDetail.bodyType;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const mostCommon = Object.entries(typeCounts).sort(
      ([, a], [, b]) => b - a,
    )[0];

    return mostCommon ? mostCommon[0] : null;
  }

  /**
   * Get human-readable description of applied filters
   */
  private getAppliedFiltersDescription(params: any): string {
    const filters: string[] = [];

    if (params.makes?.length) {
      filters.push(`Make: ${params.makes.join(', ')}`);
    }
    if (params.models?.length) {
      filters.push(`Model: ${params.models.join(', ')}`);
    }
    if (params.yearMin || params.yearMax) {
      filters.push(
        `Year: ${params.yearMin || 'any'}-${params.yearMax || 'any'}`,
      );
    }
    if (params.bodyTypes?.length) {
      filters.push(`Type: ${params.bodyTypes.join(', ')}`);
    }
    if (params.fuelTypes?.length) {
      filters.push(`Fuel: ${params.fuelTypes.join(', ')}`);
    }
    if (params.priceMin || params.priceMax) {
      filters.push(
        `Price: $${params.priceMin || 0}-$${params.priceMax || '∞'}`,
      );
    }
    if (params.mileageMax) {
      filters.push(`Max mileage: ${params.mileageMax.toLocaleString()} miles`);
    }

    return filters.length > 0 ? filters.join(', ') : 'No specific filters';
  }

  private async handleFAQ(userQuery: string): Promise<AssistantResponseDto> {
    try {
      const systemPrompt = `You are a helpful customer service assistant for a car marketplace.
Answer frequently asked questions about:
- Business operations and hours
- Buying process and financing options
- Vehicle inspection and test drives
- Return policies and warranties
- Shipping and delivery
- Payment methods
- Account management

Be professional, friendly, and concise. If you don't know something, offer to connect them with support.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery },
        ],
        temperature: 0.7,
        max_tokens: 400,
      });

      const message =
        completion.choices[0]?.message?.content ||
        "I'd be happy to help answer your questions about our car marketplace!";

      const suggestions: SuggestionChip[] = [
        {
          id: '1',
          label: 'Financing options',
          query: 'What financing options do you offer?',
          icon: '💳',
        },
        {
          id: '2',
          label: 'Test drive',
          query: 'How do I schedule a test drive?',
          icon: '🔑',
        },
        {
          id: '3',
          label: 'Return policy',
          query: "What's your return policy?",
          icon: '↩️',
        },
      ];

      return {
        intent: UserIntent.FAQ,
        message,
        suggestions,
      };
    } catch (error) {
      this.logger.error('Error handling FAQ:', error);
      return {
        intent: UserIntent.FAQ,
        message:
          "I'm here to help! Please ask your question and I'll do my best to assist you.",
        suggestions: [],
      };
    }
  }

  private async handleCarCompare(
    userQuery: string,
    extractedEntities: any,
  ): Promise<AssistantResponseDto> {
    try {
      const makes = extractedEntities.carMakes || [];
      const models = extractedEntities.carModels || [];

      // Try to find the cars in our database (from listings' car details)
      let comparisonData = '';

      if (makes.length >= 2 || models.length >= 2) {
        const listings = await this.listingRepository.find({
          take: 100,
          relations: ['carDetail'],
        });

        const carDetails = listings
          .map((l) => l.carDetail)
          .filter((c) => !!c);

        const relevantCars = carDetails.filter(
          (c) =>
            (c && makes.includes(c.make)) ||
            (c && models.includes(c.model)) ||
            makes.some((make) => c.make.toLowerCase().includes(make.toLowerCase())),
        );

        if (relevantCars.length > 0) {
          comparisonData = relevantCars
            .map(
              (c) =>
                `${c.make} ${c.model} (${c.year}): ${c.bodyType}, ${c.fuelType}, ${c.transmission}, ${c.numberOfSeats} seats`,
            )
            .join('\n');
        }
      }

      const systemPrompt = `You are a car comparison expert for a car marketplace.
The user wants to compare different cars.

${comparisonData ? `Available cars in our database:\n${comparisonData}\n` : ''}

Provide a detailed comparison covering:
- Performance and engine specs
- Fuel efficiency
- Features and technology
- Safety ratings
- Price range
- Reliability and maintenance
- Pros and cons of each

Be objective and help them make an informed decision.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery },
        ],
        temperature: 0.7,
        max_tokens: 700,
      });

      const message =
        completion.choices[0]?.message?.content ||
        "I'd be happy to help you compare cars! Please specify which two cars you'd like to compare.";

      const suggestions: SuggestionChip[] = [
        {
          id: '1',
          label: 'View available',
          query: 'Show me these cars in stock',
          icon: '🚗',
        },
        {
          id: '2',
          label: 'More specs',
          query: 'Tell me more about specifications',
          icon: '📊',
        },
      ];

      return {
        intent: UserIntent.CAR_COMPARE,
        message,
        suggestions,
      };
    } catch (error) {
      this.logger.error('Error handling car compare:', error);
      return {
        intent: UserIntent.CAR_COMPARE,
        message:
          "I can help you compare cars! Please specify which two vehicles you'd like to compare.",
        suggestions: [],
      };
    }
  }

  private async handleUserInfo(
    userQuery: string,
    currentUser?: User,
  ): Promise<AssistantResponseDto> {
    try {
      if (!currentUser) {
        return {
          intent: UserIntent.USER_INFO,
          message:
            "I'd be happy to help with your account information, but it seems you're not logged in. Please log in to view your profile, listings, and favorites.",
          suggestions: [
            {
              id: '1',
              label: 'Log in',
              query: 'How do I log in?',
              icon: '🔑',
            },
          ],
        };
      }

      this.logger.log(
        `Processing user_info query for user: ${currentUser.id}`,
      );

      // Fetch comprehensive user context
      const userContext = await this.userContextService.getUserContext(
        currentUser.id,
      );

      // Format context for LLM
      const contextString =
        this.userContextService.formatContextForPrompt(userContext);

      const systemPrompt = `You are a helpful personal assistant for a car marketplace user.
The user is asking about their own account, activity, or personal information.

Here is the current user's information:

${contextString}

Provide a friendly, personalized response based on this information.
Guidelines:
1. Be conversational and use their name when appropriate
2. Provide specific numbers and details from their account
3. Highlight interesting insights (e.g., most expensive favorite, recent activity)
4. If they ask about specific items, provide relevant details
5. Suggest helpful actions they might want to take
6. Keep the response natural and engaging (3-5 sentences)
7. Always be positive and encouraging`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery },
        ],
        temperature: 0.7,
        max_tokens: 400,
      });

      const message =
        completion.choices[0]?.message?.content ||
        this.generateFallbackUserInfoMessage(userContext);

      // Generate actions based on user's data
      const actions: MessageAction[] = [];

      if (userContext.listings.active > 0) {
        actions.push({
          label: 'View My Listings',
          action: 'view_my_listings',
          data: {},
        });
      }

      if (userContext.favorites.count > 0) {
        actions.push({
          label: 'View My Favorites',
          action: 'view_favorites',
          data: {},
        });
      }

      if (userContext.conversations.total > 0) {
        actions.push({
          label: 'View Messages',
          action: 'view_conversations',
          data: { unreadCount: userContext.conversations.unreadCount },
        });
      }

      // Generate contextual suggestions
      const suggestions = this.generateUserInfoSuggestions(userContext);

      return {
        intent: UserIntent.USER_INFO,
        message,
        data: {
          userContext,
        },
        suggestions,
        actions: actions.slice(0, 3), // Limit to 3 actions
      };
    } catch (error) {
      this.logger.error('Error handling user info:', error);
      return {
        intent: UserIntent.USER_INFO,
        message:
          "I'm having trouble accessing your account information right now. Please try again or visit your profile page.",
        suggestions: [
          {
            id: '1',
            label: 'View Profile',
            query: 'Take me to my profile',
            icon: '👤',
          },
        ],
      };
    }
  }

  /**
   * Generate fallback message for user info without LLM
   */
  private generateFallbackUserInfoMessage(userContext: any): string {
    const lines: string[] = [];

    lines.push(
      `Hi ${userContext.profile.fullName}! Here's a summary of your account:`,
    );

    if (userContext.listings.active > 0) {
      lines.push(
        `\n🚗 You have ${userContext.listings.active} active listing${userContext.listings.active > 1 ? 's' : ''}.`,
      );
    }

    if (userContext.favorites.count > 0) {
      lines.push(
        `❤️ You've saved ${userContext.favorites.count} favorite car${userContext.favorites.count > 1 ? 's' : ''}.`,
      );
    }

    if (userContext.conversations.total > 0) {
      lines.push(
        `💬 You have ${userContext.conversations.total} conversation${userContext.conversations.total > 1 ? 's' : ''}${userContext.conversations.unreadCount > 0 ? ` with ${userContext.conversations.unreadCount} unread message${userContext.conversations.unreadCount > 1 ? 's' : ''}` : ''}.`,
      );
    }

    if (
      userContext.listings.active === 0 &&
      userContext.favorites.count === 0 &&
      userContext.conversations.total === 0
    ) {
      lines.push(
        "\n🎉 You're all set up! Start by browsing cars or listing your own vehicle for sale.",
      );
    }

    return lines.join(' ');
  }

  /**
   * Generate contextual suggestions for user info queries
   */
  private generateUserInfoSuggestions(userContext: any): SuggestionChip[] {
    const suggestions: SuggestionChip[] = [];

    if (userContext.listings.active === 0) {
      suggestions.push({
        id: 'sell-car',
        label: 'List a car',
        query: 'How do I sell my car?',
        icon: '📝',
      });
    } else {
      suggestions.push({
        id: 'my-listings',
        label: 'My listings',
        query: 'Show me my listings',
        icon: '📋',
      });
    }

    if (userContext.favorites.count > 0) {
      suggestions.push({
        id: 'my-favorites',
        label: 'My favorites',
        query: 'What are my favorite cars?',
        icon: '❤️',
      });
    } else {
      suggestions.push({
        id: 'browse-cars',
        label: 'Browse cars',
        query: 'Show me available cars',
        icon: '🚗',
      });
    }

    if (userContext.conversations.unreadCount > 0) {
      suggestions.push({
        id: 'unread-messages',
        label: `${userContext.conversations.unreadCount} unread`,
        query: 'Show my unread messages',
        icon: '💬',
      });
    }

    suggestions.push({
      id: 'profile',
      label: 'My profile',
      query: 'What is my profile information?',
      icon: '👤',
    });

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  }
}

