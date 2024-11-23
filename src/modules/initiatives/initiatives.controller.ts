import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InitiativesService } from './initiatives.service';
import { CreateInitiativeDto } from './dto/create-initiative.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('initiatives')
@Controller('initiatives')
@UseGuards(JwtAuthGuard)
export class InitiativesController {
  constructor(private readonly initiativesService: InitiativesService) {}

  @Post()
  @ApiOperation({ summary: 'Create new initiative' })
  @ApiResponse({ status: 201, description: 'Initiative created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @Request() req,
    @Body() createInitiativeDto: CreateInitiativeDto,
  ) {
    return await this.initiativesService.create(createInitiativeDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all initiatives' })
  async findAll(@Request() req) {
    return await this.initiativesService.findAll(req, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get initiative by id' })
  async findOne(@Request() req, @Param('id') id: string) {
    return await this.initiativesService.findOne(id, req.user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update initiative' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateData: Partial<CreateInitiativeDto>,
  ) {
    return await this.initiativesService.update(id, updateData, req.user);
  }

  @Put(':id/submit')
  @ApiOperation({ summary: 'Submit initiative for review' })
  async submit(@Request() req, @Param('id') id: string) {
    return await this.initiativesService.submit(id, req.user);
  }
}
