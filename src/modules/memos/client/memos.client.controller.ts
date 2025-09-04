import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MemosService } from '../memos.service';
import { CreateMemoDto, UpdateMemoDto, QueryMemoDto, ResponseMemoDto, MemoListResponseDto } from './dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../../common/types/auth.types';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto';

@ApiTags('client - 메모')
@Controller('client/memos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MemosClientController {
  constructor(private readonly memosService: MemosService) {}

  @Post()
  @ApiOperation({ summary: '메모 생성' })
  @ApiResponse({ status: 201, description: '메모 생성 성공', type: ResponseMemoDto })
  @ApiResponse({ status: 400, description: '잘못된 요청', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: '카테고리 없음', type: ErrorResponseDto })
  async createMemo(@Request() req: AuthenticatedRequest, @Body() createMemoDto: CreateMemoDto) {
    return this.memosService.createMemo(req.user.id, createMemoDto);
  }

  @Get()
  @ApiOperation({ summary: '메모 목록 조회' })
  @ApiResponse({ status: 200, description: '조회 성공', type: MemoListResponseDto })
  async getMemos(@Request() req: AuthenticatedRequest, @Query() queryDto: QueryMemoDto) {
    return this.memosService.getMemos(req.user.id, queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: '메모 상세 조회' })
  @ApiResponse({ status: 200, description: '조회 성공', type: ResponseMemoDto })
  @ApiResponse({ status: 404, description: '메모 없음', type: ErrorResponseDto })
  async getMemo(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.memosService.getMemoById(req.user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: '메모 수정' })
  @ApiResponse({ status: 200, description: '수정 성공', type: ResponseMemoDto })
  @ApiResponse({ status: 400, description: '잘못된 요청', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: '메모 또는 카테고리 없음', type: ErrorResponseDto })
  async updateMemo(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateMemoDto: UpdateMemoDto,
  ) {
    return this.memosService.updateMemo(req.user.id, id, updateMemoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '메모 삭제' })
  @ApiResponse({ status: 204, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '메모 없음', type: ErrorResponseDto })
  async deleteMemo(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.memosService.deleteMemo(req.user.id, id);
  }
}
