import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // Check if Supabase is configured
        if (!supabase) {
          // Development mode with mock user
          if (process.env.NODE_ENV === 'development') {
            // Mock admin user for development
            if (credentials.email === 'admin@sosinamart.com' && credentials.password === 'Admin123') {
              return {
                id: 'dev-admin-1',
                email: 'admin@sosinamart.com',
                name: 'Admin User',
                role: 'admin',
              };
            }
            // Mock customer user for development
            if (credentials.email === 'customer@test.com' && credentials.password === 'Customer123') {
              return {
                id: 'dev-customer-1',
                email: 'customer@test.com',
                name: 'Test Customer',
                role: 'customer',
              };
            }
          }
          throw new Error('Invalid credentials');
        }

        // Fetch user from Supabase
        const { data: user, error } = await supabase
          .from('users')
          .select('id, email, password_hash, first_name, last_name, role, email_verified')
          .eq('email', credentials.email.toLowerCase())
          .single();

        if (error || !user) {
          throw new Error('Invalid credentials');
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );

        if (!isValidPassword) {
          throw new Error('Invalid credentials');
        }

        // Check if email is verified (optional - can be enforced later)
        // if (!user.email_verified) {
        //   throw new Error('Please verify your email before logging in');
        // }

        return {
          id: user.id,
          email: user.email,
          name: `${user.first_name} ${user.last_name}`.trim(),
          role: user.role || 'customer',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        const userRole = (user as { role?: string }).role;
        token.role = (userRole === 'admin' ? 'admin' : 'customer') as 'customer' | 'admin';
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    // signOut: '/logout',
    error: '/login', // Error code passed in query string as ?error=
    // verifyRequest: '/verify-email',
    // newUser: '/register',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'sosina-mart-secret-key-change-in-production',
  debug: process.env.NODE_ENV === 'development',
};

// Type augmentation for next-auth
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: 'customer' | 'admin';
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: 'customer' | 'admin';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'customer' | 'admin';
  }
}
