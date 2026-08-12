import { NextAuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      httpOptions: {
        timeout: 10000, // Increase HTTP timeout to 10s for slow network calls
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Triggered on initial sign-in when account is present
      if (user?.id) {
        token.sub = user.id;
      }
      if (account && user?.email) {
        try {
          await connectToDatabase();
          let dbUser = await User.findOne({ email: user.email });
          if (!dbUser) {
            dbUser = await User.create({
              name: user.name || "Google User",
              email: user.email,
              image: user.image || undefined,
              googleId: account.providerAccountId,
              currency: "USD",
            });
          }
          token.sub = dbUser._id.toString();
          token.currency = dbUser.currency || "USD";
        } catch (err) {
          console.error("[REDACTED Auth Error]", err instanceof Error ? err.message : "Authentication processing error");
          if (user?.id) {
            token.sub = user.id;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.currency = (token.currency as string) || "USD";
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
};

export async function getAuthSession() {
  return await getServerSession(authOptions);
}

export async function requireAuthUser() {
  const session = await getAuthSession();
  if (!session || !session.user || !session.user.id) {
    throw new Error("Unauthorized: Please sign in with Google to access your account.");
  }
  return session.user;
}
