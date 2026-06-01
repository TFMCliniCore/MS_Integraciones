import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Catch(PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const { httpAdapter } = this.adapterHost;
    if (host.getType() !== 'http') return;

    const ctx = host.switchToHttp();
    const responseBody = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Unexpected Prisma error',
    };

    if (exception.code === 'P2002') {
      const target = Array.isArray(exception.meta?.target)
        ? (exception.meta.target as string[]).join(', ')
        : 'campo único';
      const conflict = new ConflictException(`Ya existe un registro con el valor de ${target}.`);
      httpAdapter.reply(ctx.getResponse(), conflict.getResponse(), conflict.getStatus());
      return;
    }

    if (exception.code === 'P2025') {
      const notFound = new NotFoundException('El registro solicitado no existe.');
      httpAdapter.reply(ctx.getResponse(), notFound.getResponse(), notFound.getStatus());
      return;
    }

    if (exception.code === 'P2003') {
      responseBody.statusCode = HttpStatus.BAD_REQUEST;
      responseBody.message = 'La operación viola una relación requerida entre entidades.';
      httpAdapter.reply(ctx.getResponse(), responseBody, responseBody.statusCode);
      return;
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, responseBody.statusCode);
  }
}
