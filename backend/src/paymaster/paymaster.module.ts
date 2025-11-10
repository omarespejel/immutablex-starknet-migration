import { Module } from '@nestjs/common';
import { PaymasterService } from './paymaster.service';
import { PaymasterController } from './paymaster.controller';

@Module({
  controllers: [PaymasterController],
  providers: [PaymasterService],
  exports: [PaymasterService],
})
export class PaymasterModule {}
