import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User, IUser } from "@/models/User";
import { FULL_ACCESS_EMAILS } from "@/lib/subscription";

/**
 * Known Super Admin Whitelisted Emails
 */
export const SUPER_ADMIN_EMAILS: string[] = [
  ...FULL_ACCESS_EMAILS,
  "navnitrai5389@gmail.com",
];

/**
 * Checks if an email is registered as an authoritative Super Administrator.
 */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();

  // 1. Check in-code list
  if (SUPER_ADMIN_EMAILS.some((e) => e.trim().toLowerCase() === cleanEmail)) {
    return true;
  }

  // 2. Check environment variable overrides
  const envEmails =
    process.env.SUPER_ADMIN_EMAILS ||
    process.env.FULL_ACCESS_EMAILS ||
    process.env.VIP_EMAILS ||
    "";
  if (envEmails) {
    const list = envEmails.split(",").map((e) => e.trim().toLowerCase());
    if (list.includes(cleanEmail)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a user object qualifies for Super Admin privileges.
 */
export function isUserSuperAdmin(user?: {
  email?: string | null;
  role?: string | null;
  isSuperAdmin?: boolean;
} | null): boolean {
  if (!user) return false;
  if (user.isSuperAdmin === true) return true;
  if (user.role === "superadmin" || user.role === "admin") return true;
  if (user.email && isSuperAdminEmail(user.email)) return true;
  return false;
}

/**
 * Server-side security guard for Super Admin actions & API endpoints.
 * Verifies session, verifies database status, and throws if unauthorized or suspended.
 */
export async function requireSuperAdmin(): Promise<{
  sessionUser: { id: string; name?: string | null; email?: string | null };
  dbUser: IUser;
}> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    throw new Error("Unauthorized: Please sign in to access the Super Admin Portal.");
  }

  await connectToDatabase();
  const dbUser = await User.findById(session.user.id);

  if (!dbUser) {
    throw new Error("User account not found.");
  }

  if (dbUser.status === "suspended" || dbUser.status === "banned") {
    throw new Error("Your account has been suspended by an administrator.");
  }

  const isAdmin =
    isSuperAdminEmail(dbUser.email) ||
    dbUser.role === "superadmin" ||
    dbUser.role === "admin" ||
    isSuperAdminEmail(session.user.email);

  if (!isAdmin) {
    throw new Error("Forbidden: You do not have Super Admin privileges.");
  }

  return {
    sessionUser: session.user,
    dbUser,
  };
}
