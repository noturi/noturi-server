import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { NotificationsService } from '../notifications.service';
import { CreateAdminNotificationDto, UpdateAdminNotificationDto, AdminNotificationQueryDto } from './dto';

@Injectable()
export class AdminNotificationsService {
  private readonly logger = new Logger(AdminNotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * 어드민 알림 생성
   */
  async create(dto: CreateAdminNotificationDto, adminId: string) {
    // 즉시 발송 (scheduledAt이 없고 반복 아님) - DB 기록 없이 바로 발송
    if (!dto.scheduledAt && !dto.isRepeat) {
      const result = await this.sendImmediateNotification(dto);
      return {
        id: null,
        title: dto.title,
        body: dto.body,
        data: dto.data,
        targetUserIds: dto.targetUserIds,
        targetUserCount: dto.targetUserIds.length,
        sendResult: result,
      };
    }

    // 예약 또는 반복 알림 - DB에 저장
    const notification = await this.prisma.adminNotification.create({
      data: {
        title: dto.title,
        body: dto.body,
        data: dto.data,
        targetUserIds: dto.targetUserIds,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        scheduledTime: dto.scheduledTime,
        isRepeat: dto.isRepeat ?? false,
        repeatDays: dto.repeatDays ?? [],
        repeatEndAt: dto.repeatEndAt ? new Date(dto.repeatEndAt) : null,
        createdBy: adminId,
      },
    });

    return {
      ...notification,
      targetUserCount: dto.targetUserIds.length,
    };
  }

  /**
   * 즉시 발송 (DB 기록 없이)
   */
  private async sendImmediateNotification(dto: CreateAdminNotificationDto) {
    const { title, body, data, targetUserIds } = dto;

    let successCount = 0;
    let failCount = 0;

    for (const userId of targetUserIds) {
      try {
        const tickets = await this.notificationsService.sendPushToUser(
          userId,
          title,
          body,
          data,
        );

        successCount += tickets.filter((t) => t.status === 'ok').length;
        failCount += tickets.filter((t) => t.status === 'error').length;
      } catch (error) {
        failCount++;
        this.logger.error(`사용자 ${userId}에게 알림 발송 실패:`, error);
      }
    }

    this.logger.log(`즉시 알림 발송 완료: 성공 ${successCount}, 실패 ${failCount}`);

    return {
      success: failCount === 0,
      successCount,
      failCount,
      message:
        failCount === 0
          ? '알림이 성공적으로 발송되었습니다.'
          : `알림 발송 완료 (성공: ${successCount}, 실패: ${failCount})`,
    };
  }

  /**
   * 어드민 알림 목록 조회
   */
  async findAll(queryDto: AdminNotificationQueryDto) {
    const { isActive, isRepeat, page = 1, limit = 20 } = queryDto;

    const where: any = {
      ...(isActive !== undefined && { isActive }),
      ...(isRepeat !== undefined && { isRepeat }),
    };

    const [notifications, total] = await Promise.all([
      this.prisma.adminNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.adminNotification.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: notifications.map((n) => ({
        ...n,
        targetUserCount: n.targetUserIds.length,
      })),
      page,
      limit,
      total,
      totalPages,
    };
  }

  /**
   * 어드민 알림 상세 조회
   */
  async findOne(id: string) {
    const notification = await this.prisma.adminNotification.findUnique({
      where: { id },
      include: {
        logs: {
          orderBy: { sentAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!notification) {
      throw new NotFoundException('알림을 찾을 수 없습니다');
    }

    return {
      ...notification,
      targetUserCount: notification.targetUserIds.length,
    };
  }

  /**
   * 어드민 알림 수정
   */
  async update(id: string, dto: UpdateAdminNotificationDto) {
    const existing = await this.prisma.adminNotification.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('알림을 찾을 수 없습니다');
    }

    const updated = await this.prisma.adminNotification.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.body !== undefined && { body: dto.body }),
        ...(dto.data !== undefined && { data: dto.data }),
        ...(dto.targetUserIds !== undefined && { targetUserIds: dto.targetUserIds }),
        ...(dto.scheduledAt !== undefined && {
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        }),
        ...(dto.scheduledTime !== undefined && { scheduledTime: dto.scheduledTime }),
        ...(dto.isRepeat !== undefined && { isRepeat: dto.isRepeat }),
        ...(dto.repeatDays !== undefined && { repeatDays: dto.repeatDays }),
        ...(dto.repeatEndAt !== undefined && {
          repeatEndAt: dto.repeatEndAt ? new Date(dto.repeatEndAt) : null,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return {
      ...updated,
      targetUserCount: updated.targetUserIds.length,
    };
  }

  /**
   * 어드민 알림 삭제
   */
  async delete(id: string) {
    const existing = await this.prisma.adminNotification.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('알림을 찾을 수 없습니다');
    }

    await this.prisma.adminNotification.delete({ where: { id } });
  }

  /**
   * 알림 즉시 발송 (수동)
   */
  async sendNow(id: string) {
    const notification = await this.prisma.adminNotification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('알림을 찾을 수 없습니다');
    }

    return this.sendNotification(id);
  }

  /**
   * 알림 발송 로직
   */
  private async sendNotification(notificationId: string) {
    const notification = await this.prisma.adminNotification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('알림을 찾을 수 없습니다');
    }

    const { title, body, data, targetUserIds } = notification;

    let successCount = 0;
    let failCount = 0;
    const failedDetails: string[] = [];

    // 각 사용자에게 알림 발송
    for (const userId of targetUserIds) {
      try {
        const tickets = await this.notificationsService.sendPushToUser(
          userId,
          title,
          body,
          data as Record<string, any> | undefined,
        );

        const userSuccessCount = tickets.filter((t) => t.status === 'ok').length;
        const userFailCount = tickets.filter((t) => t.status === 'error').length;

        successCount += userSuccessCount;
        failCount += userFailCount;

        if (userFailCount > 0) {
          failedDetails.push(`userId: ${userId}, failed: ${userFailCount}`);
        }
      } catch (error) {
        failCount++;
        failedDetails.push(`userId: ${userId}, error: ${(error as Error).message}`);
        this.logger.error(`사용자 ${userId}에게 알림 발송 실패:`, error);
      }
    }

    // 발송 로그 기록
    await this.prisma.adminNotificationLog.create({
      data: {
        notificationId,
        successCount,
        failCount,
        details: failedDetails.length > 0 ? { failedDetails } : Prisma.JsonNull,
      },
    });

    // 마지막 발송 시간 업데이트
    await this.prisma.adminNotification.update({
      where: { id: notificationId },
      data: { lastSentAt: new Date() },
    });

    this.logger.log(`어드민 알림 발송 완료 [${notificationId}]: 성공 ${successCount}, 실패 ${failCount}`);

    return {
      success: failCount === 0,
      successCount,
      failCount,
      message:
        failCount === 0
          ? '알림이 성공적으로 발송되었습니다.'
          : `알림 발송 완료 (성공: ${successCount}, 실패: ${failCount})`,
    };
  }

  /**
   * 매 분마다 예약된 알림 체크 및 발송
   */
  @Cron(CronExpression.EVERY_MINUTE, { name: 'check-admin-notifications' })
  async checkAndSendScheduledNotifications() {
    const now = new Date();
    this.logger.debug(`어드민 알림 체크 시작: ${now.toISOString()}`);

    try {
      // 1. 일회성 예약 알림 처리
      await this.processOneTimeNotifications(now);

      // 2. 반복 알림 처리
      await this.processRepeatNotifications(now);
    } catch (error) {
      this.logger.error('어드민 알림 체크 중 오류 발생:', error);
    }
  }

  /**
   * 일회성 예약 알림 처리
   */
  private async processOneTimeNotifications(now: Date) {
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    const pendingNotifications = await this.prisma.adminNotification.findMany({
      where: {
        isActive: true,
        isRepeat: false,
        scheduledAt: {
          gte: oneMinuteAgo,
          lte: now,
        },
        lastSentAt: null, // 아직 발송되지 않은 것
      },
    });

    for (const notification of pendingNotifications) {
      this.logger.log(`일회성 예약 알림 발송: ${notification.id}`);
      await this.sendNotification(notification.id);

      // 일회성 알림은 발송 후 비활성화
      await this.prisma.adminNotification.update({
        where: { id: notification.id },
        data: { isActive: false },
      });
    }
  }

  /**
   * 반복 알림 처리
   */
  private async processRepeatNotifications(now: Date) {
    // 서버가 UTC로 동작하므로 한국 시간대(KST, UTC+9)로 변환
    const koreaTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const currentDay = koreaTime.getUTCDay(); // 0=일, 1=월, ..., 6=토
    const currentTime = `${String(koreaTime.getUTCHours()).padStart(2, '0')}:${String(koreaTime.getUTCMinutes()).padStart(2, '0')}`;

    this.logger.debug(
      `반복 알림 체크 - UTC: ${now.toISOString()}, 한국시간: ${koreaTime.toISOString()}, 요일: ${currentDay}, 시간: ${currentTime}`,
    );

    // 디버깅: 모든 활성 반복 알림 조회
    const allRepeatNotifications = await this.prisma.adminNotification.findMany({
      where: {
        isActive: true,
        isRepeat: true,
      },
    });

    this.logger.debug(
      `활성 반복 알림 목록: ${allRepeatNotifications.map((n) => `[id=${n.id}, scheduledTime=${n.scheduledTime}, repeatDays=${JSON.stringify(n.repeatDays)}]`).join(', ') || '없음'}`,
    );

    const repeatNotifications = await this.prisma.adminNotification.findMany({
      where: {
        isActive: true,
        isRepeat: true,
        repeatDays: { has: currentDay },
        scheduledTime: currentTime,
        OR: [{ repeatEndAt: null }, { repeatEndAt: { gte: now } }],
      },
    });

    this.logger.debug(`조건에 맞는 반복 알림 수: ${repeatNotifications.length}`);

    for (const notification of repeatNotifications) {
      // 오늘 이미 발송했는지 확인 (한국 시간 기준 자정)
      const todayStartKorea = new Date(koreaTime);
      todayStartKorea.setUTCHours(0, 0, 0, 0);
      // 한국 자정을 UTC로 변환 (한국 자정 = UTC 15:00 전날)
      const todayStartUTC = new Date(todayStartKorea.getTime() - 9 * 60 * 60 * 1000);

      const alreadySentToday = notification.lastSentAt && notification.lastSentAt >= todayStartUTC;

      if (!alreadySentToday) {
        this.logger.log(`반복 알림 발송: ${notification.id} (한국시간: ${currentTime})`);
        await this.sendNotification(notification.id);
      } else {
        this.logger.debug(`반복 알림 ${notification.id}은 오늘 이미 발송됨 (lastSentAt: ${notification.lastSentAt})`);
      }
    }

    // 종료일이 지난 반복 알림 비활성화
    await this.prisma.adminNotification.updateMany({
      where: {
        isActive: true,
        isRepeat: true,
        repeatEndAt: { lt: now },
      },
      data: { isActive: false },
    });
  }
}
