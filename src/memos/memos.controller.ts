// src/memos/memos.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMemoDto, MemoDto, PaginatedMemosDto, QueryMemoDto, UpdateMemoDto } from './dto';
import { MemosService } from './memos.service';

@ApiTags('Memos')
@ApiBearerAuth()
@Controller('memos')
@UseGuards(JwtAuthGuard)
export class MemosController {
  constructor(private readonly memosService: MemosService) {}

  @Post()
  @ApiOperation({ summary: '새 메모 생성' })
  @ApiResponse({ status: 201, description: '메모 생성 성공', type: MemoDto })
  create(@Request() req, @Body() createMemoDto: CreateMemoDto) {
    const userId = req.user.id;
    return this.memosService.create(userId, createMemoDto);
  }

  @Get()
  @ApiOperation({ summary: '메모 목록 조회 (필터링, 페이징)' })
  @ApiResponse({ status: 200, description: '성공', type: PaginatedMemosDto })
  findAll(@Request() req, @Query() queryDto: QueryMemoDto) {
    const userId = req.user.id;
    return this.memosService.findAll(userId, queryDto);
  }

  @Get('stats/best')
  @ApiOperation({ summary: '베스트 메모 조회 (4.5점 이상)' })
  @ApiResponse({ status: 200, description: '성공', type: [MemoDto] })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '조회할 개수 (기본 10개)' })
  getBest(@Request() req, @Query('limit') limit?: number) {
    const userId = req.user.id;
    return this.memosService.getBestMemos(userId, limit);
  }

  @Get('stats/recent')
  @ApiOperation({ summary: '최근 메모 조회' })
  @ApiResponse({ status: 200, description: '성공', type: [MemoDto] })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '조회할 개수 (기본 10개)' })
  getRecent(@Request() req, @Query('limit') limit?: number) {
    const userId = req.user.id;
    return this.memosService.getRecentMemos(userId, limit);
  }

  @Get('stats/categories')
  @ApiOperation({ summary: '카테고리별 메모 통계' })
  @ApiResponse({ status: 200, description: '성공' })
  getCategoryStats(@Request() req) {
    const userId = req.user.id;
    return this.memosService.getStatsByCategory(userId);
  }

  @Get('stats/ratings')
  @ApiOperation({ summary: '별점별 메모 통계' })
  @ApiResponse({ status: 200, description: '성공' })
  getRatingStats(@Request() req) {
    const userId = req.user.id;
    return this.memosService.getStatsByRating(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 메모 조회' })
  @ApiResponse({ status: 200, description: '성공', type: MemoDto })
  @ApiResponse({ status: 404, description: '찾을 수 없음' })
  findOne(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    const userId = req.user.id;
    return this.memosService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '메모 수정' })
  @ApiResponse({ status: 200, description: '성공', type: MemoDto })
  update(@Request() req, @Param('id', ParseUUIDPipe) id: string, @Body() updateMemoDto: UpdateMemoDto) {
    const userId = req.user.id;
    return this.memosService.update(userId, id, updateMemoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '메모 삭제' })
  @ApiResponse({ status: 200, description: '성공', type: MemoDto })
  remove(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    const userId = req.user.id;
    return this.memosService.remove(userId, id);
  }
}
