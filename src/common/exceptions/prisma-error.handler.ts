import { BadRequestException, ConflictException, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { AppErrorCode } from '../errors/app-error-codes';

export class PrismaErrorHandler {
  static handle(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002': {
          throw new HttpException(
            {
              statusCode: HttpStatus.CONFLICT,
              code: AppErrorCode.DUPLICATE_RESOURCE,
              message: '이미 존재하는 데이터입니다',
            },
            HttpStatus.CONFLICT,
          );
        }
        case 'P2025':
          throw new HttpException(
            {
              statusCode: HttpStatus.NOT_FOUND,
              code: AppErrorCode.CATEGORY_NOT_FOUND,
              message: '데이터를 찾을 수 없습니다',
            },
            HttpStatus.NOT_FOUND,
          );
        case 'P2003':
          throw new HttpException(
            {
              statusCode: HttpStatus.BAD_REQUEST,
              code: AppErrorCode.FK_CONSTRAINT_VIOLATION,
              message: '참조 무결성 제약 조건 위반입니다',
            },
            HttpStatus.BAD_REQUEST,
          );
        case 'P2014':
          throw new HttpException(
            { statusCode: HttpStatus.BAD_REQUEST, code: AppErrorCode.INVALID_ID, message: '유효하지 않은 ID입니다' },
            HttpStatus.BAD_REQUEST,
          );
        default:
          throw new HttpException(
            {
              statusCode: HttpStatus.BAD_REQUEST,
              code: AppErrorCode.VALIDATION_ERROR,
              message: '데이터베이스 오류가 발생했습니다',
            },
            HttpStatus.BAD_REQUEST,
          );
      }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          code: AppErrorCode.VALIDATION_ERROR,
          message: '잘못된 데이터 형식입니다',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    throw error;
  }
}
