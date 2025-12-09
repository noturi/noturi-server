import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationTime } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

interface ExpoPushMessage {
  to: string;
  sound?: 'default' | null;
  title: string;
  body: string;
  data?: Record<string, any>;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 매 분마다 알림을 체크하고 발송
   */
  @Cron(CronExpression.EVERY_MINUTE, { name: 'check-notifications' })
  async checkAndSendNotifications() {
    const now = new Date();
    this.logger.debug(`알림 체크 시작: ${now.toISOString()}`);

    try {
      // 알림이 필요한 캘린더 메모 조회
      const pendingMemos = await this.prisma.calendarMemo.findMany({
        where: {
          hasNotification: true,
          notificationSent: false,
          startDate: { gte: now }, // 아직 시작하지 않은 일정만
        },
        include: {
          user: {
            include: {
              devices: {
                where: { isActive: true },
              },
            },
          },
        },
      });

      this.logger.debug(`대기 중인 알림 ${pendingMemos.length}개 발견`);

      for (const memo of pendingMemos) {
        // notifyBefore가 null이면 AT_START_TIME으로 처리
        const notifyBefore = memo.notifyBefore ?? 'AT_START_TIME';
        const notifyTime = this.calculateNotifyTime(memo.startDate, notifyBefore as any, memo.isAllDay as boolean);

        this.logger.debug(
          `[${memo.id}] 일정: "${memo.title}" | ` +
            `시작: ${memo.startDate.toISOString()} | ` +
            `notifyBefore: ${notifyBefore} | ` +
            `알림시간: ${notifyTime.toISOString()} | ` +
            `현재: ${now.toISOString()} | ` +
            `발송여부: ${notifyTime <= now}`,
        );

        // 알림 시간이 현재 시간 이전이거나 같으면 알림 발송
        if (notifyTime <= now) {
          await this.sendNotificationForMemo(memo);
        }
      }
    } catch (error) {
      this.logger.error('알림 체크 중 오류 발생:', error);
    }
  }

  /**
   * 특정 캘린더 메모에 대한 알림 발송
   */
  private async sendNotificationForMemo(memo: any) {
    const { user, title } = memo;

    if (!user.devices || user.devices.length === 0) {
      this.logger.warn(`사용자 ${user.id}에게 등록된 디바이스가 없습니다.`);
      return;
    }

    // const formattedTime = this.formatDateTime(startDate);
    const messages: ExpoPushMessage[] = user.devices.map((device: any) => ({
      to: device.expoPushToken,
      sound: 'default' as const,
      title: '일정 알림',
      body: title,
      data: { calendarMemoId: memo.id },
    }));

    try {
      await this.sendExpoPushNotifications(messages);

      // 알림 발송 완료 표시
      await this.prisma.calendarMemo.update({
        where: { id: memo.id },
        data: { notificationSent: true },
      });

      this.logger.log(`알림 발송 완료: ${memo.id} -> ${user.devices.length}개 디바이스`);
    } catch (error) {
      this.logger.error(`알림 발송 실패: ${memo.id}`, error);
    }
  }

  /**
   * Expo Push API로 알림 전송
   */
  async sendExpoPushNotifications(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
    if (messages.length === 0) return [];

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(`Expo Push API 오류: ${JSON.stringify(result)}`);
    }

    return result.data as ExpoPushTicket[];
  }

  /**
   * 단일 푸시 알림 전송 (즉시 발송용)
   */
  async sendPushNotification(
    expoPushToken: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<ExpoPushTicket> {
    const messages: ExpoPushMessage[] = [
      {
        to: expoPushToken,
        sound: 'default',
        title,
        body,
        data,
      },
    ];

    const tickets = await this.sendExpoPushNotifications(messages);
    return tickets[0];
  }

  /**
   * 사용자의 모든 디바이스에 알림 전송
   */
  async sendPushToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<ExpoPushTicket[]> {
    const devices = await this.prisma.userDevice.findMany({
      where: { userId, isActive: true },
    });

    if (devices.length === 0) {
      this.logger.warn(`사용자 ${userId}에게 등록된 활성 디바이스가 없습니다.`);
      return [];
    }

    const messages: ExpoPushMessage[] = devices.map((device) => ({
      to: device.expoPushToken,
      sound: 'default' as const,
      title,
      body,
      data,
    }));

    return this.sendExpoPushNotifications(messages);
  }

  /**
   * 알림 시간 계산
   * @param startDate 일정 시작 시간
   * @param notifyBefore 알림 시점
   * @param isAllDay 하루종일 여부 (true면 오전 9시 기준으로 알림)
   */
  calculateNotifyTime(startDate: Date, notifyBefore: NotificationTime, isAllDay: boolean = false): Date {
    const notifyTime = new Date(startDate);

    // 하루종일 일정인 경우: 오전 9시 기준으로 알림
    if (isAllDay) {
      // 먼저 오전 9시로 시간 설정
      notifyTime.setHours(9, 0, 0, 0);

      switch (notifyBefore) {
        case 'ONE_DAY_BEFORE':
          notifyTime.setDate(notifyTime.getDate() - 1);
          break;
        case 'TWO_DAYS_BEFORE':
          notifyTime.setDate(notifyTime.getDate() - 2);
          break;
        case 'THREE_DAYS_BEFORE':
          notifyTime.setDate(notifyTime.getDate() - 3);
          break;
        case 'ONE_WEEK_BEFORE':
          notifyTime.setDate(notifyTime.getDate() - 7);
          break;
        // 그 외 옵션(분/시간 단위)은 당일 오전 9시로 처리
        default:
          break;
      }

      return notifyTime;
    }

    // 일반 일정: 기존 로직
    switch (notifyBefore) {
      case 'AT_START_TIME':
        // 시작 시간 그대로 (0분 전)
        break;
      case 'FIVE_MINUTES_BEFORE':
        notifyTime.setMinutes(notifyTime.getMinutes() - 5);
        break;
      case 'TEN_MINUTES_BEFORE':
        notifyTime.setMinutes(notifyTime.getMinutes() - 10);
        break;
      case 'FIFTEEN_MINUTES_BEFORE':
        notifyTime.setMinutes(notifyTime.getMinutes() - 15);
        break;
      case 'THIRTY_MINUTES_BEFORE':
        notifyTime.setMinutes(notifyTime.getMinutes() - 30);
        break;
      case 'ONE_HOUR_BEFORE':
        notifyTime.setHours(notifyTime.getHours() - 1);
        break;
      case 'TWO_HOURS_BEFORE':
        notifyTime.setHours(notifyTime.getHours() - 2);
        break;
      case 'THREE_HOURS_BEFORE':
        notifyTime.setHours(notifyTime.getHours() - 3);
        break;
      case 'ONE_DAY_BEFORE':
        notifyTime.setDate(notifyTime.getDate() - 1);
        break;
      case 'TWO_DAYS_BEFORE':
        notifyTime.setDate(notifyTime.getDate() - 2);
        break;
      case 'THREE_DAYS_BEFORE':
        notifyTime.setDate(notifyTime.getDate() - 3);
        break;
      case 'ONE_WEEK_BEFORE':
        notifyTime.setDate(notifyTime.getDate() - 7);
        break;
    }

    return notifyTime;
  }

  /**
   * 날짜/시간 포맷팅
   */
  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}
