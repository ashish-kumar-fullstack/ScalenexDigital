import { getServerSession, type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "./db";
import { User } from "./models";
import { loginSchema } from "./validation";
import { rateLimit } from "./security";
import { serverEnv } from "./env";
export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(input) {
        try {
          serverEnv();
          const v = loginSchema.parse(input);
          await rateLimit("login:" + v.email, 8, 900);
          await rateLimit("login-global", 300, 60);
          await db();
          const u = await User.findOne({ email: v.email }).select(
            "+passwordHash",
          );
          const valid = await compare(
            v.password,
            u?.passwordHash ||
              "$2b$12$C6UzMDM.H6dfI/f/IKcEe.2R/YHGST.HXYAbMJpkBZHMpg/.L67Zy",
          );
          if (!u || !valid || u.status !== "ACTIVE") return null;
          await User.updateOne(
            { _id: u._id },
            { $set: { lastLogin: new Date() } },
          );
          return {
            id: String(u._id),
            name: u.name,
            email: u.email,
            sessionVersion: u.sessionVersion,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.version = (
          user as typeof user & { sessionVersion: number }
        ).sessionVersion;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.uid);
        session.user.sessionVersion = Number(token.version);
      }
      return session;
    },
  },
  useSecureCookies: process.env.NODE_ENV === "production",
};
export const session = () => getServerSession(authOptions);
