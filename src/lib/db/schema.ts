import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  primaryKey,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "editor", "viewer"]);
export const teamRoleEnum = pgEnum("team_role", ["owner", "admin", "member"]);
export const activityActionEnum = pgEnum("activity_action", [
  "created",
  "updated",
  "deleted",
  "viewed",
]);

// ============ AUTH TABLES (Auth.js compatible) ============

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
  role: userRoleEnum("role").default("viewer").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => [
    primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  ]
);

// ============ TEAMS ============

export const teams = pgTable("teams", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description"),
  createdBy: text("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const teamMembers = pgTable(
  "team_members",
  {
    teamId: text("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: teamRoleEnum("role").default("member").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.teamId, t.userId] })]
);

export const teamInvitations = pgTable("team_invitations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  teamId: text("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  token: text("token").unique().notNull(),
  role: teamRoleEnum("role").default("member").notNull(),
  maxUses: integer("max_uses"), // null = unlimited
  uses: integer("uses").default(0).notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  createdBy: text("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ============ CONTENT TABLES ============

export const shelves = pgTable("shelves", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description"),
  coverImage: text("cover_image"),
  sortOrder: integer("sort_order").default(0).notNull(),
  teamId: text("team_id").references(() => teams.id, {
    onDelete: "set null",
  }),
  createdBy: text("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const books = pgTable("books", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  shelfId: text("shelf_id").references(() => shelves.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description"),
  coverImage: text("cover_image"),
  sortOrder: integer("sort_order").default(0).notNull(),
  teamId: text("team_id").references(() => teams.id, {
    onDelete: "set null",
  }),
  createdBy: text("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const chapters = pgTable("chapters", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  bookId: text("book_id")
    .notNull()
    .references(() => books.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdBy: text("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const pages = pgTable("pages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  chapterId: text("chapter_id").references(() => chapters.id, {
    onDelete: "set null",
  }),
  bookId: text("book_id").references(() => books.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  content: text("content"), // Markdown/JSON content
  html: text("html"), // Rendered HTML
  draft: boolean("draft").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  // Public sharing fields
  isPublic: boolean("is_public").default(false).notNull(),
  shareToken: text("share_token").unique(),
  createdBy: text("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const revisions = pgTable("revisions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  pageId: text("page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  html: text("html"),
  revisionNumber: integer("revision_number").default(1).notNull(),
  createdBy: text("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ============ TAGGING SYSTEM ============

export const tags = pgTable("tags", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").unique().notNull(),
  slug: text("slug").unique().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const taggables = pgTable(
  "taggables",
  {
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    taggableId: text("taggable_id").notNull(),
    taggableType: text("taggable_type").notNull(), // 'shelf', 'book', 'chapter', 'page'
  },
  (t) => [primaryKey({ columns: [t.tagId, t.taggableId, t.taggableType] })]
);

// ============ ATTACHMENTS ============

export const attachments = pgTable("attachments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  pageId: text("page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  path: text("path").notNull(),
  size: integer("size").notNull(),
  mimeType: text("mime_type").notNull(),
  createdBy: text("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ============ COMMENTS ============

export const comments = pgTable("comments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  pageId: text("page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  parentId: text("parent_id"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// ============ ACTIVITY LOG ============

export const activities = pgTable("activities", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  entityType: text("entity_type").notNull(), // 'shelf', 'book', 'chapter', 'page'
  entityId: text("entity_id").notNull(),
  entityName: text("entity_name"),
  action: activityActionEnum("action").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

// ============ RELATIONS ============

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  shelves: many(shelves),
  books: many(books),
  chapters: many(chapters),
  pages: many(pages),
  comments: many(comments),
  activities: many(activities),
  teamMemberships: many(teamMembers),
  createdTeams: many(teams),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [teams.createdBy],
    references: [users.id],
  }),
  members: many(teamMembers),
  shelves: many(shelves),
  books: many(books),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export const teamInvitationsRelations = relations(teamInvitations, ({ one }) => ({
  team: one(teams, {
    fields: [teamInvitations.teamId],
    references: [teams.id],
  }),
  createdByUser: one(users, {
    fields: [teamInvitations.createdBy],
    references: [users.id],
  }),
}));

export const shelvesRelations = relations(shelves, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [shelves.createdBy],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [shelves.teamId],
    references: [teams.id],
  }),
  books: many(books),
}));

export const booksRelations = relations(books, ({ one, many }) => ({
  shelf: one(shelves, {
    fields: [books.shelfId],
    references: [shelves.id],
  }),
  createdByUser: one(users, {
    fields: [books.createdBy],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [books.teamId],
    references: [teams.id],
  }),
  chapters: many(chapters),
  pages: many(pages),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  book: one(books, {
    fields: [chapters.bookId],
    references: [books.id],
  }),
  createdByUser: one(users, {
    fields: [chapters.createdBy],
    references: [users.id],
  }),
  pages: many(pages),
}));

export const pagesRelations = relations(pages, ({ one, many }) => ({
  chapter: one(chapters, {
    fields: [pages.chapterId],
    references: [chapters.id],
  }),
  book: one(books, {
    fields: [pages.bookId],
    references: [books.id],
  }),
  createdByUser: one(users, {
    fields: [pages.createdBy],
    references: [users.id],
  }),
  revisions: many(revisions),
  attachments: many(attachments),
  comments: many(comments),
}));

export const revisionsRelations = relations(revisions, ({ one }) => ({
  page: one(pages, {
    fields: [revisions.pageId],
    references: [pages.id],
  }),
  createdByUser: one(users, {
    fields: [revisions.createdBy],
    references: [users.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  page: one(pages, {
    fields: [comments.pageId],
    references: [pages.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  taggables: many(taggables),
}));

export const taggablesRelations = relations(taggables, ({ one }) => ({
  tag: one(tags, {
    fields: [taggables.tagId],
    references: [tags.id],
  }),
}));

// ============ TYPE EXPORTS ============

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;

export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;

export type TeamInvitation = typeof teamInvitations.$inferSelect;
export type NewTeamInvitation = typeof teamInvitations.$inferInsert;

export type Shelf = typeof shelves.$inferSelect;
export type NewShelf = typeof shelves.$inferInsert;

export type Book = typeof books.$inferSelect;
export type NewBook = typeof books.$inferInsert;

export type Chapter = typeof chapters.$inferSelect;
export type NewChapter = typeof chapters.$inferInsert;

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;

export type Revision = typeof revisions.$inferSelect;
export type NewRevision = typeof revisions.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;
