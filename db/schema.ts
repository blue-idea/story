import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export type NovelStatus =
  | "draft"
  | "planning"
  | "in_progress"
  | "completed"
  | "failed";
export type ChapterStatus =
  | "pending"
  | "writing"
  | "validating"
  | "completed"
  | "failed";
export type AccountType =
  | "credentials"
  | "email"
  | "oauth"
  | "oidc"
  | "webauthn";

export type CoreConfig = {
  genre: string;
  protagonist: string;
  conflict: string;
};

export type CustomConfig = {
  worldbuilding: string;
  perspective: string;
  tone: string;
  theme: string;
  audience: string;
  chapterCount: number;
};

export type CharacterProfile = {
  name: string;
  role: string;
  summary: string;
};

export type UserPreferencesPayload = {
  preferredGenres: string[];
  defaultTone: string | null;
  defaultChapterCount: number | null;
};

export const users = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash"),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: varchar("image", { length: 255 }),
});

export const accounts = pgTable(
  "account",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 255 }).$type<AccountType>().notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (table) => [
    uniqueIndex("account_provider_account_unique").on(
      table.provider,
      table.providerAccountId,
    ),
  ],
);

export const sessions = pgTable("session", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionToken: varchar("sessionToken", { length: 255 }).notNull().unique(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    compoundKey: primaryKey({ columns: [table.identifier, table.token] }),
  }),
);

export const userPreferences = pgTable(
  "user_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    preferences: jsonb("preferences").$type<UserPreferencesPayload>().notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("user_preferences_user_unique").on(table.userId)],
);

export const novels = pgTable(
  "novels",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    status: varchar("status", { length: 32 })
      .$type<NovelStatus>()
      .default("draft")
      .notNull(),
    coreConfig: jsonb("core_config").$type<CoreConfig>().notNull(),
    customConfig: jsonb("custom_config").$type<CustomConfig>().notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_novels_user").on(table.userId),
    index("idx_novels_status").on(table.status),
  ],
);

export const novelProfiles = pgTable(
  "novel_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    novelId: uuid("novel_id")
      .notNull()
      .references(() => novels.id, { onDelete: "cascade" }),
    outline: text("outline").notNull(),
    characterProfiles: jsonb("character_profiles")
      .$type<CharacterProfile[]>()
      .notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("novel_profiles_novel_unique").on(table.novelId)],
);

export const chapters = pgTable(
  "chapters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    novelId: uuid("novel_id")
      .notNull()
      .references(() => novels.id, { onDelete: "cascade" }),
    chapterNumber: integer("chapter_number").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    outlineSummary: text("outline_summary").notNull(),
    content: text("content").default("").notNull(),
    wordCount: integer("word_count").default(0).notNull(),
    status: varchar("status", { length: 32 })
      .$type<ChapterStatus>()
      .default("pending")
      .notNull(),
    wordCountValid: boolean("word_count_valid").default(false).notNull(),
    suspenseValid: boolean("suspense_valid").default(false).notNull(),
    passed: boolean("passed").default(false).notNull(),
    retryCount: integer("retry_count").default(0).notNull(),
    validationLog: text("validation_log"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_chapters_novel_num").on(
      table.novelId,
      table.chapterNumber,
    ),
  ],
);
