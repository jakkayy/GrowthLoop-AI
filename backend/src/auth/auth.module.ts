import { Global, Module } from '@nestjs/common';
import { InternalApiGuard } from './internal-api.guard';

/**
 * Global so InternalApiGuard can be injected (via ConfigService) and applied
 * with @UseGuards(InternalApiGuard) on any controller without importing
 * this module everywhere.
 */
@Global()
@Module({
  providers: [InternalApiGuard],
  exports: [InternalApiGuard],
})
export class AuthModule {}
