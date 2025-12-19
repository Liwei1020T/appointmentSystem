import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      role: string;
      // Extended fields
      full_name?: string;
      fullName?: string;
      phone?: string | null;
      avatar?: string;
      avatar_url?: string;
      referral_code?: string;
      referralCode?: string;
      points?: number;
      created_at?: string | Date;
      createdAt?: string | Date;
    };
  }

  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    role: string;
    // Extended fields
    full_name?: string;
    fullName?: string;
    phone?: string | null;
    avatar?: string;
    avatar_url?: string;
    referral_code?: string;
    referralCode?: string;
    points?: number;
    created_at?: string | Date;
    createdAt?: string | Date;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    // Extended fields
    full_name?: string;
    phone?: string;
    avatar?: string;
    referral_code?: string;
    points?: number;
  }
}
