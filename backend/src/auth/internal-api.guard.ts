import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

/**
 * Guards internal-only endpoints (called exclusively by our own Next.js
 * server, never by a browser). The frontend attaches the shared secret as
 * `x-internal-api-key` on every server-to-server call.
 *
 * This is NOT end-user authentication — the Next.js server is responsible
 * for verifying the end user's JWT and deciding which `userId` to send. This
 * guard only proves "this request came from our frontend server" so that a
 * stranger who finds the backend URL can't call it directly.
 */
@Injectable()
export class InternalApiGuard implements CanActivate {
  private readonly logger = new Logger(InternalApiGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('INTERNAL_API_KEY');
    if (!expected) {
      // Fail closed: a missing secret must never mean "allow everyone".
      this.logger.error(
        'INTERNAL_API_KEY is not set — rejecting request. Set it in the backend .env.',
      );
      throw new UnauthorizedException();
    }

    const request = context.switchToHttp().getRequest();
    const provided = request.headers['x-internal-api-key'];

    if (typeof provided !== 'string' || !safeCompare(provided, expected)) {
      throw new UnauthorizedException();
    }

    return true;
  }
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
