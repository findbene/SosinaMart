import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { createApiResponse, createApiError, handleApiError, parseRequestBody } from '@/lib/api-utils';
import { registerSchema, validate, formatZodErrors } from '@/lib/validations';
import { ApiErrors } from '@/lib/api-error';
import { generateOrderNumber } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await parseRequestBody(request);

    // Validate input
    const validation = validate(registerSchema, body);
    if (!validation.success) {
      return createApiError(
        'VALIDATION_ERROR',
        'Invalid registration data',
        400,
        { fields: formatZodErrors(validation.errors) }
      );
    }

    const { email, password, firstName, lastName, phone } = validation.data;

    // Check if Supabase is configured
    if (!supabase) {
      // Development mode - simulate successful registration
      if (process.env.NODE_ENV === 'development') {
        return createApiResponse(
          {
            id: `dev-${generateOrderNumber()}`,
            email: email.toLowerCase(),
            firstName,
            lastName,
            message: 'Registration successful (development mode)',
          },
          undefined,
          201
        );
      }
      throw ApiErrors.serviceUnavailable('Database not configured');
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      throw ApiErrors.alreadyExists('User with this email');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        role: 'customer',
        email_verified: false,
        created_at: new Date().toISOString(),
      })
      .select('id, email, first_name, last_name')
      .single();

    if (createError) {
      console.error('User creation error:', createError);
      throw ApiErrors.databaseError('Failed to create user');
    }

    // Create associated customer record for CRM
    await supabase.from('customers').insert({
      user_id: newUser.id,
      email: email.toLowerCase(),
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      status: 'active',
      marketing_consent: false,
      customer_since: new Date().toISOString(),
      total_orders: 0,
      total_spent: 0,
    });

    // TODO: Send verification email

    return createApiResponse(
      {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        message: 'Registration successful',
      },
      undefined,
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
