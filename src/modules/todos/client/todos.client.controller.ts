import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
import { TodosService } from '../todos.service';
import { TodosStatsService } from '../todos-stats.service';
import {
  CreateTodoDto,
  UpdateTodoDto,
  UpdateTemplateDto,
  QueryTodoDto,
  QueryStatsDto,
  ResponseTodoDto,
  TodoListResponseDto,
  ToggleTodoResponseDto,
  ResponseTemplateDto,
  TemplateListResponseDto,
  MonthlyStatsResponseDto,
  WeeklyStatsResponseDto,
  OverviewStatsResponseDto,
  GrassStatsResponseDto,
} from './dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../../../common/types/auth.types';
import { ErrorResponseDto } from '../../../common/dto/error-response.dto';

@ApiTags('client - 투두')
@Controller('client/todos')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TodosClientController {
  constructor(
    private readonly todosService: TodosService,
    private readonly todosStatsService: TodosStatsService,
  ) {}

  // ============== 투두 CRUD ==============

  @Post()
  @ApiOperation({
    summary: '투두 생성',
    description: '일회성 투두 또는 반복 투두를 생성합니다. 반복 투두의 경우 템플릿이 생성되고 7일치 인스턴스가 미리 생성됩니다.',
  })
  @ApiResponse({ status: 201, description: '투두 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청', type: ErrorResponseDto })
  async createTodo(@Request() req: AuthenticatedRequest, @Body() createTodoDto: CreateTodoDto) {
    return this.todosService.createTodo(req.user.id, createTodoDto);
  }

  @Get()
  @ApiOperation({
    summary: '투두 목록 조회',
    description: '특정 날짜 또는 월별로 투두 목록을 조회합니다. date가 있으면 해당 날짜만, 없으면 year/month로 월별 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공', type: TodoListResponseDto })
  async getTodos(@Request() req: AuthenticatedRequest, @Query() queryDto: QueryTodoDto) {
    return this.todosService.getTodos(req.user.id, queryDto);
  }

  @Get('stats/daily')
  @ApiOperation({
    summary: '월별 일간 달성률 (캘린더용)',
    description: '특정 월의 일별 달성률을 조회합니다. 캘린더 뷰에서 달성률 표시용으로 사용합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공', type: MonthlyStatsResponseDto })
  async getDailyStats(@Request() req: AuthenticatedRequest, @Query() queryDto: QueryStatsDto) {
    return this.todosStatsService.getMonthlyStats(req.user.id, queryDto.year, queryDto.month);
  }

  @Get('stats/weekly')
  @ApiOperation({
    summary: '주간 통계',
    description: '이번 주의 달성률과 요일별 통계를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공', type: WeeklyStatsResponseDto })
  async getWeeklyStats(@Request() req: AuthenticatedRequest) {
    return this.todosStatsService.getWeeklyStats(req.user.id);
  }

  @Get('stats/overview')
  @ApiOperation({
    summary: '전체 통계 개요',
    description: '전체 투두 통계와 연속 달성일(streak) 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공', type: OverviewStatsResponseDto })
  async getOverviewStats(@Request() req: AuthenticatedRequest) {
    return this.todosStatsService.getOverviewStats(req.user.id);
  }

  @Get('stats/grass')
  @ApiOperation({
    summary: '잔디 통계 (깃허브 스타일)',
    description: '최근 6개월간 일별 투두 달성률을 잔디 레벨(0~4)로 반환합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공', type: GrassStatsResponseDto })
  async getGrassStats(@Request() req: AuthenticatedRequest) {
    return this.todosStatsService.getGrassStats(req.user.id);
  }

  @Get('templates')
  @ApiOperation({
    summary: '반복 템플릿 목록 조회',
    description: '사용자의 반복 투두 템플릿 목록을 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '조회 성공', type: TemplateListResponseDto })
  async getTemplates(@Request() req: AuthenticatedRequest) {
    return this.todosService.getTemplates(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '투두 상세 조회' })
  @ApiResponse({ status: 200, description: '조회 성공', type: ResponseTodoDto })
  @ApiResponse({ status: 404, description: '투두 없음', type: ErrorResponseDto })
  async getTodo(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.todosService.getTodoById(req.user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: '투두 수정' })
  @ApiResponse({ status: 200, description: '수정 성공', type: ResponseTodoDto })
  @ApiResponse({ status: 400, description: '잘못된 요청', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: '투두 없음', type: ErrorResponseDto })
  async updateTodo(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
  ) {
    const result = await this.todosService.updateTodo(req.user.id, id, updateTodoDto);

    // 완료 상태가 변경되면 streak 업데이트
    if (updateTodoDto.isCompleted !== undefined) {
      await this.todosStatsService.updateStreak(req.user.id);
    }

    return result;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '투두 삭제' })
  @ApiResponse({ status: 204, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '투두 없음', type: ErrorResponseDto })
  async deleteTodo(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.todosService.deleteTodo(req.user.id, id);
  }

  @Patch(':id/toggle')
  @ApiOperation({
    summary: '투두 완료 토글',
    description: '투두의 완료 상태를 토글합니다 (완료 ↔ 미완료)',
  })
  @ApiResponse({ status: 200, description: '토글 성공', type: ToggleTodoResponseDto })
  @ApiResponse({ status: 404, description: '투두 없음', type: ErrorResponseDto })
  async toggleTodo(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    const result = await this.todosService.toggleTodo(req.user.id, id);

    // streak 업데이트
    await this.todosStatsService.updateStreak(req.user.id);

    return result;
  }

  // ============== 템플릿 관리 ==============

  @Put('templates/:id')
  @ApiOperation({ summary: '반복 템플릿 수정' })
  @ApiResponse({ status: 200, description: '수정 성공', type: ResponseTemplateDto })
  @ApiResponse({ status: 400, description: '잘못된 요청', type: ErrorResponseDto })
  @ApiResponse({ status: 404, description: '템플릿 없음', type: ErrorResponseDto })
  async updateTemplate(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    return this.todosService.updateTemplate(req.user.id, id, updateTemplateDto);
  }

  @Delete('templates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: '반복 템플릿 삭제',
    description: '반복 템플릿을 삭제합니다. 미래의 인스턴스도 함께 삭제됩니다. 과거 인스턴스는 유지됩니다.',
  })
  @ApiResponse({ status: 204, description: '삭제 성공' })
  @ApiResponse({ status: 404, description: '템플릿 없음', type: ErrorResponseDto })
  async deleteTemplate(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
    await this.todosService.deleteTemplate(req.user.id, id);
  }
}
