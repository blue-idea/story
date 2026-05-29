import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { and, eq } from "drizzle-orm";
import NextAuth, { getServerSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare, hash } from "bcryptjs";

import { db } from "../db";
import { accounts, users, verificationTokens } from "../db/schema";

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function buildDisplayName(email: string): string {
  const [localPart] = email.split("@");
  return localPart || "writer";
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(password, passwordHash);
}

async function upsertCredentialsAccount(userId: string, email: string) {
  const existingAccount = await db.query.accounts.findFirst({
    where: and(
      eq(accounts.userId, userId),
      eq(accounts.provider, "credentials"),
      eq(accounts.providerAccountId, email),
    ),
    columns: {
      id: true,
    },
  });

  if (existingAccount) {
    return;
  }

  await db.insert(accounts).values({
    userId,
    type: "credentials",
    provider: "credentials",
    providerAccountId: email,
  });
}

export const authConfig: NextAuthOptions = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        const email = normalizeEmail(credentials?.email);
        const password =
          typeof credentials?.password === "string"
            ? credentials.password.trim()
            : "";

        if (!email || !password) {
          return null;
        }

        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (existingUser) {
          if (existingUser.passwordHash) {
            const passwordMatched = await verifyPassword(
              password,
              existingUser.passwordHash,
            );

            if (!passwordMatched) {
              return null;
            }
          } else {
            // 兼容历史账号：首次凭密码登录时补齐 password_hash
            const upgradedHash = await hashPassword(password);
            await db
              .update(users)
              .set({ passwordHash: upgradedHash })
              .where(eq(users.id, existingUser.id));
          }

          await upsertCredentialsAccount(existingUser.id, email);

          return {
            id: existingUser.id,
            name: existingUser.name,
            email: existingUser.email,
            image: existingUser.image,
          };
        }

        const passwordHash = await hashPassword(password);

        const [createdUser] = await db
          .insert(users)
          .values({
            email,
            name: buildDisplayName(email),
            passwordHash,
            emailVerified: new Date(),
          })
          .returning({
            id: users.id,
            name: users.name,
            email: users.email,
            image: users.image,
          });

        await upsertCredentialsAccount(createdUser.id, email);

        return createdUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : "";
      }

      return session;
    },
  },
};

export const handler = NextAuth(authConfig);

export function auth() {
  return getServerSession(authConfig);
}
