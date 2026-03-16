import { Module } from '@nestjs/common';
import { SanctionController } from './sanction.controller';
import { SanctionService } from './sanction.service';

@Module({
  controllers: [SanctionController],
  providers: [SanctionService],
  exports: [SanctionService],
})
export class SanctionModule {}
