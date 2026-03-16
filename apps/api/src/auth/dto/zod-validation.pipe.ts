import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { z, ZodTypeAny } from 'zod';

@Injectable()
export class ZodValidationPipe<TSchema extends ZodTypeAny> implements PipeTransform {
  constructor(private readonly schema: TSchema) {}

  transform(value: unknown): z.infer<TSchema> {
    const parsed = this.schema.safeParse(value);

    if (!parsed.success) {
      throw new BadRequestException({
        message: '요청 형식이 올바르지 않습니다',
        errors: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    return parsed.data;
  }
}
