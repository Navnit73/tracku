import { NextAuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "demo-google-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "demo-google-secret",
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Demo Account",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "demo@finances.app" },
        name: { label: "Name", type: "text", placeholder: "Demo User" },
      },
      async authorize(credentials) {
        const email = credentials?.email || "demo@finances.app";
        const name = credentials?.name || "Demo User";

        try {
          await connectToDatabase();
          let user = await User.findOne({ email });

          if (!user) {
            user = await User.create({
              name,
              email,
              image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
              currency: "USD",
            });
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image,
            currency: user.currency,
          };
        } catch (error) {
          console.error("Auth error:", error);
          // Fallback user object if DB is not reachable immediately
          return {
            id: "demo-user-id-12345",
            name,
            email,
            image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
            currency: "USD",
          };
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          await connectToDatabase();
          const existingUser = await User.findOne({ email: user.email });
          if (!existingUser) {
            await User.create({
              name: user.name || "Google User",
              email: user.email,
              image: user.image || undefined,
              googleId: account.providerAccountId,
              currency: "USD",
            });
          }
        } catch (err) {
          console.error("Error saving Google user:", err);
        }
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "default_secret_key_finance_tracker_2026",
  pages: {
    signIn: "/auth/signin",
  },
};

export async function getAuthSession() {
  return await getServerSession(authOptions);
}

export async function requireAuthUser() {
  const session = await getAuthSession();
  if (!session || !session.user || !session.user.id) {
    // If running locally without auth session, fallback to default demo user for frictionless dev
    return {
      id: "demo-user-id-12345",
      name: "Demo User",
      email: "demo@finances.app",
    };
  }
  return session.user;
}
