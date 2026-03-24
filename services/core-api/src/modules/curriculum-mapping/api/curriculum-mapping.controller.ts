import { Body, Controller, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../common/http/zod-validation.pipe.js';
import { CURR_SERVICE } from '../curriculum-mapping.module.js';

const createProgramSchema = z.object({
  id: z.string().optional(),
  institutionId: z.string().min(1),
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  status: z.string().optional(),
});

@Controller('curriculum-mapping')
export class CurriculumMappingController {
  constructor(@Inject(CURR_SERVICE) private readonly service) {}

  @Post('programs')
  @HttpCode(HttpStatus.CREATED)
  async createProgram(@Body(new ZodValidationPipe(createProgramSchema)) body) {
    return { data: await this.service.createProgram(body) };
  }
}
