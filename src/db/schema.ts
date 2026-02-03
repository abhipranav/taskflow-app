import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ============================================
// Users Table (NextAuth compatible)
// ============================================
export const users = sqliteTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp" }),
  name: text("name"),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// Accounts Table (NextAuth OAuth accounts)
// ============================================
export const accounts = sqliteTable("account", {
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
}, (table) => ({
  compositePk: primaryKey({ columns: [table.provider, table.providerAccountId] }),
}));

// ============================================
// Sessions Table (NextAuth sessions)
// ============================================
export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

// ============================================
// Verification Tokens Table (NextAuth)
// ============================================
export const verificationTokens = sqliteTable("verificationToken", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
}, (table) => ({
  compositePk: primaryKey({ columns: [table.identifier, table.token] }),
}));

// ============================================
// User Preferences Table
// ============================================
export const userPreferences = sqliteTable("user_preferences", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme").default("system"), // light, dark, system
  compactMode: integer("compact_mode", { mode: "boolean" }).default(false),
  aiProvider: text("ai_provider").default("gemini"), // gemini, groq, ollama
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// Boards Table
// ============================================
export const boards = sqliteTable("boards", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  background: text("background"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// Board Members Junction Table (Collaboration)
// ============================================
export const boardMembers = sqliteTable("board_members", {
  boardId: text("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"), // owner, admin, member
  joinedAt: integer("joined_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
}, (table) => ({
  compositePk: primaryKey({ columns: [table.boardId, table.userId] }),
}));


// ============================================
// Columns Table
// ============================================
export const columns = sqliteTable("columns", {
  id: text("id").primaryKey(),
  boardId: text("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  position: integer("position").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// Cards Table
// ============================================
export const cards = sqliteTable("cards", {
  id: text("id").primaryKey(),
  columnId: text("column_id").notNull().references(() => columns.id, { onDelete: "cascade" }),
  assigneeId: text("assignee_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  summary: text("summary"),
  dueDate: integer("due_date", { mode: "timestamp" }),
  position: integer("position").notNull(),
  priority: text("priority").default("none"), // none, p1, p2, p3, p4
  estimatedTime: integer("estimated_time"), // in minutes
  isRecurring: integer("is_recurring", { mode: "boolean" }).default(false),
  recurringPattern: text("recurring_pattern"), // daily, weekly, monthly, custom
  recurringDays: text("recurring_days"), // JSON array for custom days e.g. ["mon", "wed", "fri"]
  parentCardId: text("parent_card_id"), // Self-reference for recurring task templates (no inline reference to avoid circular type)
  archivedAt: integer("archived_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});


// ============================================
// Labels Table
// ============================================
export const labels = sqliteTable("labels", {
  id: text("id").primaryKey(),
  boardId: text("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull(),
});

// ============================================
// Card Labels Junction Table
// ============================================
export const cardLabels = sqliteTable("card_labels", {
  cardId: text("card_id").notNull().references(() => cards.id, { onDelete: "cascade" }),
  labelId: text("label_id").notNull().references(() => labels.id, { onDelete: "cascade" }),
});

// ============================================
// Checklists Table
// ============================================
export const checklists = sqliteTable("checklists", {
  id: text("id").primaryKey(),
  cardId: text("card_id").notNull().references(() => cards.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  completed: integer("completed", { mode: "boolean" }).default(false),
  position: integer("position").notNull(),
});

// ============================================
// Links Table (GitHub/GitLab)
// ============================================
export const links = sqliteTable("links", {
  id: text("id").primaryKey(),
  cardId: text("card_id").notNull().references(() => cards.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  type: text("type"), // github_issue, github_pr, gitlab_issue, gitlab_mr
  title: text("title"),
  status: text("status"),
  cachedAt: integer("cached_at", { mode: "timestamp" }),
});

// ============================================
// Attachments Table
// ============================================
export const attachments = sqliteTable("attachments", {
  id: text("id").primaryKey(),
  cardId: text("card_id").notNull().references(() => cards.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  name: text("name").notNull(),
  size: integer("size").notNull(),
  type: text("type").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// Time Entries Table (Time Tracking)
// ============================================
export const timeEntries = sqliteTable("time_entries", {
  id: text("id").primaryKey(),
  cardId: text("card_id").notNull().references(() => cards.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  duration: integer("duration").notNull(), // Duration in seconds
  description: text("description"),
  startedAt: integer("started_at", { mode: "timestamp" }),
  endedAt: integer("ended_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// Card Dependencies Table
// ============================================
export const cardDependencies = sqliteTable("card_dependencies", {
  id: text("id").primaryKey(),
  cardId: text("card_id").notNull().references(() => cards.id, { onDelete: "cascade" }),
  dependsOnCardId: text("depends_on_card_id").notNull().references(() => cards.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// Activities Table (Audit Log)
// ============================================
export const activities = sqliteTable("activities", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  boardId: text("board_id").references(() => boards.id, { onDelete: "cascade" }),
  cardId: text("card_id").references(() => cards.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // created, updated, moved, deleted, archived, restored
  entityType: text("entity_type").notNull(), // board, card, column
  entityTitle: text("entity_title"),
  details: text("details"), // JSON string with change details
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// Newsletter Subscribers Table
// ============================================
export const subscribers = sqliteTable("subscribers", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  status: text("status").notNull().default("active"), // active, unsubscribed
  source: text("source").default("website"), // website, blog, footer
  subscribedAt: integer("subscribed_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  unsubscribedAt: integer("unsubscribed_at", { mode: "timestamp" }),
});

// Type exports for subscribers
export type Subscriber = typeof subscribers.$inferSelect;
export type NewSubscriber = typeof subscribers.$inferInsert;

// ============================================
// Notifications Table (In-App Notifications)
// ============================================
export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // due_soon, overdue, mention, card_assigned, reminder
  title: text("title").notNull(),
  message: text("message").notNull(),
  cardId: text("card_id").references(() => cards.id, { onDelete: "cascade" }),
  boardId: text("board_id").references(() => boards.id, { onDelete: "cascade" }),
  read: integer("read", { mode: "boolean" }).default(false),
  actionUrl: text("action_url"), // URL to navigate to when clicked
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  readAt: integer("read_at", { mode: "timestamp" }),
});

// ============================================
// Notification Preferences Table
// ============================================
export const notificationPreferences = sqliteTable("notification_preferences", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  
  // In-App Notifications
  inAppEnabled: integer("in_app_enabled", { mode: "boolean" }).default(true),
  inAppDueSoon: integer("in_app_due_soon", { mode: "boolean" }).default(true), // 24h before due
  inAppOverdue: integer("in_app_overdue", { mode: "boolean" }).default(true),
  inAppAssigned: integer("in_app_assigned", { mode: "boolean" }).default(true),
  
  // Email Notifications
  emailEnabled: integer("email_enabled", { mode: "boolean" }).default(true),
  emailAddress: text("email_address"), // Override user's default email
  emailDueSoon: integer("email_due_soon", { mode: "boolean" }).default(true),
  emailOverdue: integer("email_overdue", { mode: "boolean" }).default(true),
  emailDailyDigest: integer("email_daily_digest", { mode: "boolean" }).default(false),
  emailDigestTime: text("email_digest_time").default("08:00"), // HH:MM format
  
  // Push Notifications (Browser/System)
  pushEnabled: integer("push_enabled", { mode: "boolean" }).default(false),
  pushSubscription: text("push_subscription"), // JSON string with push subscription data
  pushDueSoon: integer("push_due_soon", { mode: "boolean" }).default(true),
  pushOverdue: integer("push_overdue", { mode: "boolean" }).default(true),
  pushAssigned: integer("push_assigned", { mode: "boolean" }).default(true),
  
  // Reminder Settings
  reminderLeadTime: integer("reminder_lead_time").default(24), // hours before due date
  quietHoursStart: text("quiet_hours_start"), // HH:MM format
  quietHoursEnd: text("quiet_hours_end"), // HH:MM format
  
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// Scheduled Reminders Table (for tracking sent reminders)
// ============================================
export const scheduledReminders = sqliteTable("scheduled_reminders", {
  id: text("id").primaryKey(),
  cardId: text("card_id").notNull().references(() => cards.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // due_soon, overdue, custom
  scheduledFor: integer("scheduled_for", { mode: "timestamp" }).notNull(),
  sentAt: integer("sent_at", { mode: "timestamp" }),
  channels: text("channels"), // JSON array: ["email", "push", "in_app"]
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ============================================
// Chat Messages Table (AI Chat History)
// ============================================
export const chatMessages = sqliteTable("chat_messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id").notNull(), // Groups messages in a conversation
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // user, assistant
  content: text("content").notNull(),
  personaId: text("persona_id"), // Which AI persona was used
  contextUsed: text("context_used"), // JSON array of context types used
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Relations
// ============================================
export const usersRelations = relations(users, ({ many, one }) => ({
  boards: many(boards),
  assignedCards: many(cards),
  preferences: one(userPreferences),
  notificationPreferences: one(notificationPreferences),
  notifications: many(notifications),
  boardMemberships: many(boardMembers),
  timeEntries: many(timeEntries),
  chatMessages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  user: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
}));

export const boardsRelations = relations(boards, ({ one, many }) => ({
  user: one(users, {
    fields: [boards.userId],
    references: [users.id],
  }),
  columns: many(columns),
  labels: many(labels),
  members: many(boardMembers),
}));

export const boardMembersRelations = relations(boardMembers, ({ one }) => ({
  board: one(boards, {
    fields: [boardMembers.boardId],
    references: [boards.id],
  }),
  user: one(users, {
    fields: [boardMembers.userId],
    references: [users.id],
  }),
}));

export const columnsRelations = relations(columns, ({ one, many }) => ({
  board: one(boards, {
    fields: [columns.boardId],
    references: [boards.id],
  }),
  cards: many(cards),
}));

export const cardsRelations = relations(cards, ({ one, many }) => ({
  column: one(columns, {
    fields: [cards.columnId],
    references: [columns.id],
  }),
  assignee: one(users, {
    fields: [cards.assigneeId],
    references: [users.id],
  }),
  parentCard: one(cards, {
    fields: [cards.parentCardId],
    references: [cards.id],
    relationName: "parentCard",
  }),
  recurringInstances: many(cards, { relationName: "parentCard" }),
  cardLabels: many(cardLabels),
  checklists: many(checklists),
  links: many(links),
  attachments: many(attachments),
  timeEntries: many(timeEntries),
  dependencies: many(cardDependencies, { relationName: "dependencies" }),
  dependents: many(cardDependencies, { relationName: "dependents" }),
}));

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  card: one(cards, {
    fields: [timeEntries.cardId],
    references: [cards.id],
  }),
  user: one(users, {
    fields: [timeEntries.userId],
    references: [users.id],
  }),
}));

export const cardDependenciesRelations = relations(cardDependencies, ({ one }) => ({
  card: one(cards, {
    fields: [cardDependencies.cardId],
    references: [cards.id],
    relationName: "dependencies",
  }),
  dependsOnCard: one(cards, {
    fields: [cardDependencies.dependsOnCardId],
    references: [cards.id],
    relationName: "dependents",
  }),
}));

export const labelsRelations = relations(labels, ({ one, many }) => ({
  board: one(boards, {
    fields: [labels.boardId],
    references: [boards.id],
  }),
  cardLabels: many(cardLabels),
}));

export const cardLabelsRelations = relations(cardLabels, ({ one }) => ({
  card: one(cards, {
    fields: [cardLabels.cardId],
    references: [cards.id],
  }),
  label: one(labels, {
    fields: [cardLabels.labelId],
    references: [labels.id],
  }),
}));

export const checklistsRelations = relations(checklists, ({ one }) => ({
  card: one(cards, {
    fields: [checklists.cardId],
    references: [cards.id],
  }),
}));

export const linksRelations = relations(links, ({ one }) => ({
  card: one(cards, {
    fields: [links.cardId],
    references: [cards.id],
  }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  card: one(cards, {
    fields: [attachments.cardId],
    references: [cards.id],
  }),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  card: one(cards, {
    fields: [notifications.cardId],
    references: [cards.id],
  }),
  board: one(boards, {
    fields: [notifications.boardId],
    references: [boards.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

export const scheduledRemindersRelations = relations(scheduledReminders, ({ one }) => ({
  card: one(cards, {
    fields: [scheduledReminders.cardId],
    references: [cards.id],
  }),
  user: one(users, {
    fields: [scheduledReminders.userId],
    references: [users.id],
  }),
}));

// ============================================
// Type Exports
// ============================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Board = typeof boards.$inferSelect;
export type NewBoard = typeof boards.$inferInsert;
export type Column = typeof columns.$inferSelect;
export type NewColumn = typeof columns.$inferInsert;
export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
export type Label = typeof labels.$inferSelect;
export type NewLabel = typeof labels.$inferInsert;
export type Checklist = typeof checklists.$inferSelect;
export type NewChecklist = typeof checklists.$inferInsert;
export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;
export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreferences = typeof notificationPreferences.$inferInsert;
export type ScheduledReminder = typeof scheduledReminders.$inferSelect;
export type NewScheduledReminder = typeof scheduledReminders.$inferInsert;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type NewTimeEntry = typeof timeEntries.$inferInsert;
export type CardDependency = typeof cardDependencies.$inferSelect;
export type NewCardDependency = typeof cardDependencies.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
