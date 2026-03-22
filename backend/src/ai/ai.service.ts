import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
      images?: Array<{
        image_url?: {
          url?: string;
        };
      }>;
    };
  }>;
};

@Injectable()
export class AiService {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async generateCaption(prompt: string): Promise<{ caption: string }> {
    try {
      const data = await this.postToOpenRouter({
        model: this.config.get<string>('OPENROUTER_CAPTION_MODEL'),
        messages: [
          {
            role: 'system',
            content:
              'You are a social media copywriter. Write one short engaging Thai caption only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const caption = data?.choices?.[0]?.message?.content;

      if (typeof caption !== 'string' || !caption.trim()) {
        throw new InternalServerErrorException('Caption not returned');
      }

      return { caption: caption.trim() };
    } catch (error) {
      this.handleAiError(error, 'Generate caption failed');
    }
  }

  async generateImage(prompt: string): Promise<{ imageDataUrl: string }> {
    try {
      const data = await this.postToOpenRouter(
        {
          model: this.config.get<string>('OPENROUTER_IMAGE_MODEL'),
          modalities: ['image', 'text'],
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        30000,
      );

      const message = data?.choices?.[0]?.message;

      const imageDataUrl =
        this.pickDataImageUrl(message?.images?.[0]?.image_url?.url) ??
        this.extractImageDataUrl(message?.content);

      if (!imageDataUrl) {
        throw new InternalServerErrorException('Image not returned');
      }

      return { imageDataUrl };
    } catch (error) {
      console.error(
        'GENERATE IMAGE ERROR:',
        JSON.stringify(
          (error as any)?.response?.data || (error as any)?.message,
          null,
          2,
        ),
      );

      this.handleAiError(error, 'Generate image failed');
    }
  }

  private async postToOpenRouter(
    body: Record<string, unknown>,
    timeout = 15000,
  ): Promise<OpenRouterResponse> {
    const response = await firstValueFrom(
      this.http.post(
        `${this.config.get<string>('OPENROUTER_BASE_URL')}/chat/completions`,
        body,
        {
          headers: {
            Authorization: `Bearer ${this.config.get<string>('OPENROUTER_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          timeout,
        },
      ),
    );

    return response.data;
  }

  private handleAiError(error: unknown, fallbackMessage: string): never {
    const status = (error as any)?.response?.status;
    const message =
      (error as any)?.response?.data?.error?.message ||
      (error as any)?.response?.data?.message ||
      (error as any)?.message ||
      fallbackMessage;

    if (status === 401) {
      throw new UnauthorizedException(message);
    }

    throw new InternalServerErrorException(message);
  }

  private extractImageDataUrl(content: unknown): string | null {
    if (!content) return null;

    if (typeof content === 'string') {
      return this.extractDataUrlFromText(content);
    }

    if (Array.isArray(content)) {
      for (const item of content) {
        const imageDataUrl = this.extractImageDataUrl(item);
        if (imageDataUrl) return imageDataUrl;
      }
      return null;
    }

    if (typeof content !== 'object') {
      return null;
    }

    const obj = content as Record<string, any>;

    return (
      this.pickDataImageUrl(obj?.images?.[0]?.image_url?.url) ??
      this.pickDataImageUrl(obj?.image_url) ??
      this.pickDataImageUrl(obj?.image_url?.url) ??
      this.pickDataImageUrl(obj?.url) ??
      this.pickDataImageUrl(obj?.data) ??
      this.buildDataUrlFromSource(obj?.source) ??
      this.buildDataUrlFromB64(obj?.b64_json) ??
      null
    );
  }

  private extractDataUrlFromText(text: string): string | null {
    const match = text.match(
      /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/,
    );

    return match?.[0] ?? null;
  }

  private pickDataImageUrl(value: unknown): string | null {
    return typeof value === 'string' && value.startsWith('data:image/')
      ? value
      : null;
  }

  private buildDataUrlFromSource(source: unknown): string | null {
    if (
      source &&
      typeof source === 'object' &&
      typeof (source as any).data === 'string' &&
      typeof (source as any).media_type === 'string'
    ) {
      return `data:${(source as any).media_type};base64,${(source as any).data}`;
    }

    return null;
  }

  private buildDataUrlFromB64(b64: unknown): string | null {
    return typeof b64 === 'string' && b64.length > 0
      ? `data:image/png;base64,${b64}`
      : null;
  }
}
