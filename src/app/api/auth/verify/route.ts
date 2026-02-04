import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createApiResponse, createApiError, handleApiError, parseRequestBody } from '@/lib/api-utils';
import { verifyEmailSchema, validate, formatZodErrors } from '@/lib/validations';
import { ApiErrors } from '@/lib/api-error';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await parseRequestBody(request);

    // Validate input
    const validation = validate(verifyEmailSchema, body);
    if (!validation.success) {
      return createApiError(
        'VALIDATION_ERROR',
        'Invalid verification data',
        400,
        { fields: formatZodErrors(validation.errors) }
      );
    }

    const { token } = validation.data;

    // Check if Supabase is configured
    if (!supabase) {
      if (process.env.NODE_ENV === 'development') {
        return createApiResponse({
          message: 'Email verified successfully (development mode)',
        });
      }
      throw ApiErrors.serviceUnavailable('Database not configured');
    }

    // Find verification token
    const { data: verificationRecord, error: findError } = await supabase
      .from('email_verifications')
      .select('user_id, expires_at')
      .eq('token', token)
      .single();

    if (findError || !verificationRecord) {
      throw ApiErrors.invalidInput('Invalid or expired verification token');
    }

    // Check if token is expired
    if (new Date(verificationRecord.expires_at) < new Date()) {
      // Delete expired token
      await supabase.from('email_verifications').delete().eq('token', token);
      throw ApiErrors.invalidInput('Verification token has expired');
    }

    // Update user as verified
    const { error: updateError } = await supabase
      .from('users')
      .update({ email_verified: true })
      .eq('id', verificationRecord.user_id);

    if (updateError) {
      throw ApiErrors.databaseError('Failed to verify email');
    }

    // Delete used token
    await supabase.from('email_verifications').delete().eq('token', token);

    return createApiResponse({
      message: 'Email verified successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
