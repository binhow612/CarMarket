import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AssistantService } from './assistant.service';
import { AssistantQueryDto } from './dto/assistant-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';

@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Get('welcome')
  getWelcomeMessage() {
    return this.assistantService.getWelcomeMessage();
  }

  @Post('query')
  @UseGuards(JwtAuthGuard)
  processQuery(
    @Body() queryDto: AssistantQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.assistantService.processQuery(queryDto, user);
  }
}

