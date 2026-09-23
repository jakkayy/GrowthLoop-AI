import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verifies the `x-line-signature` header LINE sends on every webhook
 * request: HMAC-SHA256 of the raw request body, keyed with the channel
 * secret, base64-encoded. Without this, anyone who finds the webhook URL
 * can forge postback events — including "approve this draft", which
 * posts straight to the customer's Facebook page.
 */
@Injectable()
export class LineSignatureGuard implements CanActivate {
  private readonly logger = new Logger(LineSignatureGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.config.get<string>('LINE_CHANNEL_SECRET');
    if (!secret) {
      this.logger.error(
        'LINE_CHANNEL_SECRET is not set — rejecting webhook request.',
      );
      throw new UnauthorizedException();
    }

    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-line-signature'];
    const rawBody: Buffer | undefined = request.rawBody;

    if (typeof signature !== 'string' || !rawBody) {
      throw new UnauthorizedException();
    }

    const expected = createHmac('sha256', secret).update(rawBody).digest();
    const provided = Buffer.from(signature, 'base64');

    if (
      expected.length !== provided.length ||
      !timingSafeEqual(expected, provided)
    ) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
