import { NextAuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      httpOptions: {
        timeout: 10000,
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password.");
        }

        await connectToDatabase();
        const user = await User.findOne({
          email: credentials.email.toLowerCase().trim(),
        });

        if (!user) {
          throw new Error("No account found with this email. Please register first.");
        }

        if (!user.password) {
          if (user.googleId) {
            throw new Error(
              "This account was created with Google. Please log in using Google, or use 'Forgot password?' to set a password."
            );
          } else {
            throw new Error(
              "No password has been set for this account yet. Please use 'Forgot password?' or Register to set a password."
            );
          }
        }

        const isPasswordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordMatch) {
          throw new Error("Incorrect password. Please try again.");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (trigger === "update" && session?.currency) {
        token.currency = session.currency;
      }
      if (user?.id) {
        token.sub = user.id;
      }
      if (account && account.provider === "google" && user?.email) {
        try {
          await connectToDatabase();
          let dbUser = await User.findOne({ email: user.email.toLowerCase().trim() });
          if (!dbUser) {
            dbUser = await User.create({
              name: user.name || "Google User",
              email: user.email.toLowerCase().trim(),
              image: user.image || undefined,
              googleId: account.providerAccountId,
              currency: "USD",
            });
          }
          token.sub = dbUser._id.toString();
          token.currency = dbUser.currency || "USD";
        } catch (err) {
          console.error("[Auth Error]", err instanceof Error ? err.message : "Authentication error");
          if (user?.id) {
            token.sub = user.id;
          }
        }
      } else if (token.sub && !token.currency) {
        try {
          await connectToDatabase();
          const dbUser = await User.findById(token.sub);
          if (dbUser) {
            token.currency = dbUser.currency || "USD";
          }
        } catch {}
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
    throw new Error("Unauthorized: Please sign in to access your account.");
  }
  return session.user;
}
