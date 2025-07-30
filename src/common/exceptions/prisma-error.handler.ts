import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export class PrismaErrorHandler {
  static handle(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          throw new ConflictException('이미 존재하는 데이터입니다');
        case 'P2025':
          throw new NotFoundException('데이터를 찾을 수 없습니다');
        case 'P2003':
          throw new BadRequestException('참조 무결성 제약 조건 위반입니다');
        case 'P2014':
          throw new BadRequestException('유효하지 않은 ID입니다');
        default:
          throw new BadRequestException('데이터베이스 오류가 발생했습니다');
      }
    }
    
    if (error instanceof Prisma.PrismaClientValidationError) {
      throw new BadRequestException('잘못된 데이터 형식입니다');
    }

    throw error;
  }
}