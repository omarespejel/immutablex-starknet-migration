import { Module } from '@nestjs/common';
import { PaymasterService } from './paymaster.service';

@Module({
  providers: [PaymasterService],
  exports: [PaymasterService],
})
export class PaymasterModule {}
