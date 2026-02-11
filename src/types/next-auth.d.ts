import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      role: string;
      // Extended fields
      full_name?: string | null;
      fullName?: string | null;
      phone?: string | null;
      avatar?: string | null;
      avatar_url?: string | null;
      referral_code?: string | null;
      referralCode?: string | null;
      points?: number;
      created_at?: string | Date | null;
      createdAt?: string | Date | null;
    };
  }

  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    role: string;
    // Extended fields
    full_name?: string | null;
    fullName?: string | null;
    phone?: string | null;
    avatar?: string | null;
    avatar_url?: string | null;
    referral_code?: string | null;
    referralCode?: string | null;
    points?: number;
    created_at?: string | Date | null;
    createdAt?: string | Date | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    // Extended fields
    full_name?: string;
    phone?: string;
    avatar?: string;
    referral_code?: string;
    points?: number;
  }
}
