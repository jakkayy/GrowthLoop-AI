import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DraftsService {
  private readonly logger = new Logger(DraftsService.name);
  private readonly supabase: SupabaseClient;

  constructor(private readonly config: ConfigService) {
    this.supabase = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async create(input: {
    userId: string;
    lineUserId: string;
    caption: string;
    imageUrl: string;
  }): Promise<string> {
    const { data, error } = await this.supabase
      .from('post_drafts')
      .insert({
        user_id: input.userId,
        line_user_id: input.lineUserId,
        caption: input.caption,
        image_url: input.imageUrl,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);
    return data.id as string;
  }

  async markSent(draftId: string) {
    const sentAt = new Date();
    const expiresAt = new Date(sentAt.getTime() + 2 * 60 * 60 * 1000);

    const { error } = await this.supabase
      .from('post_drafts')
      .update({
        sent_at: sentAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq('id', draftId);

    if (error) throw new Error(error.message);
  }

  async approve(draftId: string) {
    const { error } = await this.supabase
      .from('post_drafts')
      .update({ status: 'approved' })
      .eq('id', draftId)
      .eq('status', 'pending');

    if (error) throw new Error(error.message);
  }

  async deny(draftId: string) {
    const { error } = await this.supabase
      .from('post_drafts')
      .update({ status: 'denied' })
      .eq('id', draftId)
      .eq('status', 'pending');

    if (error) throw new Error(error.message);
  }

  async expireOverdue() {
    const { error, count } = await this.supabase
      .from('post_drafts')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .not('expires_at', 'is', null)
      .lt('expires_at', new Date().toISOString());

    if (error) {
      this.logger.error(`expireOverdue error: ${error.message}`);
      return;
    }
    if (count && count > 0) {
      this.logger.log(`Expired ${count} overdue drafts`);
    }
  }

  async getPendingUnsent(): Promise<
    { id: string; line_user_id: string; caption: string; image_url: string }[]
  > {
    const { data, error } = await this.supabase
      .from('post_drafts')
      .select('id, line_user_id, caption, image_url')
      .eq('status', 'pending')
      .is('sent_at', null);

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async getApproved(): Promise<
    { id: string; user_id: string; caption: string; image_url: string }[]
  > {
    const { data, error } = await this.supabase
      .from('post_drafts')
      .select('id, user_id, caption, image_url')
      .eq('status', 'approved');

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  async markPosted(draftId: string) {
    const { error } = await this.supabase
      .from('post_drafts')
      .update({ status: 'posted' })
      .eq('id', draftId);

    if (error) throw new Error(error.message);
  }

  async getAllActiveUsers(): Promise<
    { user_id: string; line_user_id: string; generate_time: string; post_time: string }[]
  > {
    const { data, error } = await this.supabase
      .from('line_connections')
      .select('user_id, line_user_id, users!inner(generate_time, post_time)')
      .eq('status', 'active');

    if (error) throw new Error(error.message);

    return (data ?? []).map((row: any) => ({
      user_id: row.user_id,
      line_user_id: row.line_user_id,
      generate_time: row.users?.generate_time ?? '06:00',
      post_time: row.users?.post_time ?? '10:00',
    }));
  }

  async getApprovedWithSchedule(): Promise<
    { id: string; user_id: string; caption: string; image_url: string; post_time: string }[]
  > {
    const { data, error } = await this.supabase
      .from('post_drafts')
      .select('id, user_id, caption, image_url, users!inner(post_time)')
      .eq('status', 'approved');

    if (error) throw new Error(error.message);

    return (data ?? []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      caption: row.caption,
      image_url: row.image_url,
      post_time: row.users?.post_time ?? '10:00',
    }));
  }
}
