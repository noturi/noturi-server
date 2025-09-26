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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CalendarMemosService } from '../calendar-memos.service';
import { 
  CreateCalendarMemoDto, 
  UpdateCalendarMemoDto, 
  QueryCalendarMemoDto, 
  ResponseCalendarMemoDto, 
  CalendarMemoMonthlyResponseDto 
} from './dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../../common/types/auth.types';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto';

@ApiTags('client - 캘린더 일정')
@Controller('client/calendar-memos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CalendarMemosClientController {
  constructor(private readonly calendarMemosService: CalendarMemosService) {}

  @Post()
  @ApiOperation({ summary: '캘린더 일정 생성' })
  @ApiResponse({ status: 201, description: '일정 생성 성공', type: ResponseCalendarMemoDto })
  @ApiResponse({ status: 400, description: '잘못된 요청', type: ErrorResponseDto })
  async createCalendarMemo(@Request() req: AuthenticatedRequest, @Body() createCalendarMemoDto: CreateCalendarMemoDto) {
    return this.calendarMemosService.createCalendarMemo(req.user.id, createCalendarMemoDto);
  }

  @Get()
  @ApiOperation({ 
    summary: '캘린더 일정 월별 조회', 
    description: '특정 년월의 캘린더 일정을 조회합니다. 캘린더 뷰에서 점 표시용으로 사용합니다.' 
  })
  @ApiResponse({ status: 200, description: '조회 성공', type: CalendarMemoMonthlyResponseDto })
  async getCalendarMemos(@Request() req: AuthenticatedRequest, @Query() queryDto: QueryCalendarMemoDto) {
    return this.calendarMemosService.getCalendarMemos(req.user.id, queryDto);
  }

  @Get('notifications/enabled')
  @ApiOperation({ summary: '알림 설정된 일정 조회 (로컬 알림 설정용)' })
  @ApiResponse({ status: 200, description: '조회 성공', type: [ResponseCalendarMemoDto] })
  async getNotificationEnabledCalendarMemos(@Request() req: AuthenticatedRequest) {
    return this.calendarMemosService.getNotificationEnabledCalendarMemos(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '캘린더 일정 상세 조회' })
  @ApiResponse({ status: 200, description: '조회 성공', type: ResponseCalendarMemoDto })
  @ApiResponse({ status: 404, description: '일정 없음', type: ErrorResponseDto })
  async getCalendarMemo(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.calendarMemosService.getCalendarMemoById(req.user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: '캘린더 일정 수정' })
  @ApiResponse({ status: 200, description: '수정 성공', type: ResponseCalendarMemoDto })
  @ApiResponse({ status: 400, description: '잘못된 요청', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: '일정 없음', type: ErrorResponseDto })
  async updateCalendarMemo(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateCalendarMemoDto: UpdateCalendarMemoDto,
  ) {
    return this.calendarMemosService.updateCalendarMemo(req.user.id, id, updateCalendarMemoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '캘린더 일정 삭제' })
  @ApiResponse({ status: 204, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '일정 없음', type: ErrorResponseDto })
  async deleteCalendarMemo(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.calendarMemosService.deleteCalendarMemo(req.user.id, id);
  }
}