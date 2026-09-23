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
 * Verifies the `x-hub-signature-256` header Facebook sends on every
 * webhook POST: "sha256=" + HMAC-SHA256 of the raw request body, keyed
 * with the app secret. Without this, anyone who finds the webhook URL
 * can forge comment events and burn our OpenRouter budget by triggering
 * unlimited AI auto-replies.
 *
 * Only applies to the POST (event delivery) route — the GET verification
 * handshake has no body/signature and is checked separately via
 * hub.verify_token.
 */
@Injectable()
export class FacebookSignatureGuard implements CanActivate {
  private readonly logger = new Logger(FacebookSignatureGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.config.get<string>('FACEBOOK_APP_SECRET');
    if (!secret) {
      this.logger.error(
        'FACEBOOK_APP_SECRET is not set — rejecting webhook request.',
      );
      throw new UnauthorizedException();
    }

    const request = context.switchToHttp().getRequest();
    const header = request.headers['x-hub-signature-256'];
    const rawBody: Buffer | undefined = request.rawBody;

    if (typeof header !== 'string' || !header.startsWith('sha256=') || !rawBody) {
      throw new UnauthorizedException();
    }

    const expected = createHmac('sha256', secret).update(rawBody).digest();
    const provided = Buffer.from(header.slice('sha256='.length), 'hex');

    if (
      expected.length !== provided.length ||
      !timingSafeEqual(expected, provided)
    ) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
