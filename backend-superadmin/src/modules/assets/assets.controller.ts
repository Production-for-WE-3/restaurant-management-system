import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { User } from '../users/entities/user.entity';
import { CreateAssetsDto } from './dto/create-assets.dto';
import { AssetsService } from './assets.service';

@ApiTags('assets')
@ApiBearerAuth()
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @RequirePermissions('dashboard.view')
  @ApiOperation({ summary: 'Lists organization assets' })
  findAll(@CurrentUser() _user: User) {
    return this.assetsService.findAll();
  }

  @Post()
  @RequirePermissions('dashboard.view')
  @ApiOperation({ summary: 'Adds multiple organization assets' })
  create(@Body() dto: CreateAssetsDto, @CurrentUser() _user: User) {
    return this.assetsService.createMany(dto);
  }
}
