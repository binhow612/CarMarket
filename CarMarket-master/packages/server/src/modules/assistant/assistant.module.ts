import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { IntentClassificationService } from './services/intent-classification.service';
import { ResponseHandlerService } from './services/response-handler.service';
import { QueryExtractionService } from './services/query-extraction.service';
import { ListingQueryBuilderService } from './services/listing-query-builder.service';
import { UserContextService } from './services/user-context.service';
import { ListingDetail } from '../../entities/listing-detail.entity';
import { CarMetadata } from '../../entities/car-metadata.entity';
import { CarMake } from '../../entities/car-make.entity';
import { CarModel } from '../../entities/car-model.entity';
import { User } from '../../entities/user.entity';
import { Favorite } from '../../entities/favorite.entity';
import { ChatConversation } from '../../entities/chat-conversation.entity';
import { ChatMessage } from '../../entities/chat-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ListingDetail,
      CarMetadata,
      CarMake,
      CarModel,
      User,
      Favorite,
      ChatConversation,
      ChatMessage,
    ]),
  ],
  controllers: [AssistantController],
  providers: [
    AssistantService,
    IntentClassificationService,
    ResponseHandlerService,
    QueryExtractionService,
    ListingQueryBuilderService,
    UserContextService,
  ],
  exports: [AssistantService],
})
export class AssistantModule {}

