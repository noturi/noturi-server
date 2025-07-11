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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMemoDto } from './dto/create-memo.dto';
import { QueryMemoDto } from './dto/query-memo.dto';
import { UpdateMemoDto } from './dto/update-memo.dto';
import { MemosService } from './memos.service';

@Controller('memos')
@UseGuards(JwtAuthGuard)
export class MemosController {
  constructor(private readonly memosService: MemosService) {}

  // 메모 생성
  @Post()
  create(@Request() req, @Body() createMemoDto: CreateMemoDto) {
    const userId = req.user.id;
    return this.memosService.create(userId, createMemoDto);
  }

  // 메모 목록 조회 (필터링 + 페이징)
  @Get()
  findAll(@Request() req, @Query() queryDto: QueryMemoDto) {
    const userId = req.user.id;
    return this.memosService.findAll(userId, queryDto);
  }

  // 특정 메모 조회
  @Get(':id')
  findOne(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    const userId = req.user.id;
    return this.memosService.findOne(userId, id);
  }

  // 메모 수정
  @Patch(':id')
  update(@Request() req, @Param('id', ParseUUIDPipe) id: string, @Body() updateMemoDto: UpdateMemoDto) {
    const userId = req.user.id;
    return this.memosService.update(userId, id, updateMemoDto);
  }

  // 메모 삭제
  @Delete(':id')
  remove(@Request() req, @Param('id', ParseUUIDPipe) id: string) {
    const userId = req.user.id;
    return this.memosService.remove(userId, id);
  }

  // 베스트 메모들 (4.5점 이상)
  @Get('stats/best')
  getBest(@Request() req, @Query('limit') limit?: number) {
    const userId = req.user.id;
    return this.memosService.getBestMemos(userId, limit);
  }

  // 최근 메모들
  @Get('stats/recent')
  getRecent(@Request() req, @Query('limit') limit?: number) {
    const userId = req.user.id;
    return this.memosService.getRecentMemos(userId, limit);
  }

  // 카테고리별 통계
  @Get('stats/categories')
  getCategoryStats(@Request() req) {
    const userId = req.user.id;
    return this.memosService.getStatsByCategory(userId);
  }

  // 별점별 통계
  @Get('stats/ratings')
  getRatingStats(@Request() req) {
    const userId = req.user.id;
    return this.memosService.getStatsByRating(userId);
  }
}
