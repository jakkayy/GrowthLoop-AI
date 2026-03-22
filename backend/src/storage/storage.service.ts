import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly supabase: SupabaseClient;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const supabaseUrl = this.config.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.bucket =
      this.config.get<string>('SUPABASE_STORAGE_BUCKET') || 'generated-images';

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase env vars');
    }

    this.supabase = createClient(supabaseUrl, serviceRoleKey);
  }

  async saveDataUrlAsPublicImage(dataUrl: string): Promise<string> {
    const matches = dataUrl.match(
      /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/,
    );

    if (!matches) {
      throw new InternalServerErrorException('Invalid image data URL');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    const ext = this.mimeToExt(mimeType);
    const path = `generated/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(base64Data, 'base64');

    const { error: uploadError } = await this.supabase.storage
      .from(this.bucket)
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: false,
        cacheControl: '3600',
      });

    if (uploadError) {
      throw new InternalServerErrorException(uploadError.message);
    }

    const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(path);

    if (!data?.publicUrl) {
      throw new InternalServerErrorException('Failed to get public URL');
    }

    return data.publicUrl;
  }

  private mimeToExt(mime: string): string {
    if (mime === 'image/png') return 'png';
    if (mime === 'image/jpeg') return 'jpg';
    if (mime === 'image/webp') return 'webp';
    return 'png';
  }
}
