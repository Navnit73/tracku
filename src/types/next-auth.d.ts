import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      currency?: string;
      role?: string;
      status?: string;
      isSuperAdmin?: boolean;
      isVipOverride?: boolean;
      lastLoginAt?: Date | string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    currency?: string;
    role?: string;
    status?: string;
    isSuperAdmin?: boolean;
    isVipOverride?: boolean;
    lastLoginAt?: Date | string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    currency?: string;
    role?: string;
    status?: string;
    isSuperAdmin?: boolean;
    isVipOverride?: boolean;
    lastLoginAt?: Date | string;
  }
}

