import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import type { SearchFilters } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query() filters: SearchFilters) {
    return this.searchService.search(filters);
  }
}
