import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/db/schema";
import { randomUUID } from "crypto";

const sqlite = new Database("./dev.db");
const db = drizzle(sqlite, { schema });

// ============================================
// TEAM MEMBERS
// ============================================
const users = {
  // YOU - The team lead/owner
  abhijeet: {
    id: randomUUID(),
    email: "abhijeetpranavmishra@gmail.com",
    name: "Abhijeet Mishra",
    image: "https://avatars.githubusercontent.com/u/100030060?v=4",
  },
  // TEAM MEMBERS
  priya: {
    id: randomUUID(),
    email: "priya@taskflow.dev",
    name: "Priya Sharma",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
  },
  rahul: {
    id: randomUUID(),
    email: "rahul@taskflow.dev",
    name: "Rahul Patel",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul",
  },
  sneha: {
    id: randomUUID(),
    email: "sneha@taskflow.dev",
    name: "Sneha Gupta",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha",
  },
};

// Helper to create dates
const daysFromNow = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

async function seed() {
  console.log("🌱 Seeding database...\n");

  // Clear existing data
  console.log("🗑️  Clearing existing data...");
  sqlite.exec("DELETE FROM activities");
  sqlite.exec("DELETE FROM attachments");
  sqlite.exec("DELETE FROM links");
  sqlite.exec("DELETE FROM checklists");
  sqlite.exec("DELETE FROM card_labels");
  sqlite.exec("DELETE FROM cards");
  sqlite.exec("DELETE FROM labels");
  sqlite.exec("DELETE FROM columns");
  sqlite.exec("DELETE FROM board_members");
  sqlite.exec("DELETE FROM boards");
  sqlite.exec("DELETE FROM user_preferences");
  sqlite.exec("DELETE FROM session");
  sqlite.exec("DELETE FROM account");
  sqlite.exec("DELETE FROM user");

  // ============================================
  // CREATE USERS
  // ============================================
  console.log("👥 Creating users...");
  for (const user of Object.values(users)) {
    await db.insert(schema.users).values({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      createdAt: daysAgo(30),
    });
  }
  console.log(`   Created ${Object.keys(users).length} users`);

  // ============================================
  // BOARD 1: TaskFlow Development (Sprint Board)
  // ============================================
  console.log("\n📋 Creating Board 1: TaskFlow Development...");
  const board1Id = randomUUID();
  await db.insert(schema.boards).values({
    id: board1Id,
    userId: users.abhijeet.id,
    name: "TaskFlow Development",
    background: "#0f172a",
    createdAt: daysAgo(14),
  });

  // Add all team members to board 1
  for (const [key, user] of Object.entries(users)) {
    await db.insert(schema.boardMembers).values({
      boardId: board1Id,
      userId: user.id,
      role: key === "abhijeet" ? "owner" : "member",
    });
  }

  // Sprint columns
  const board1Columns = [
    { id: randomUUID(), name: "Backlog", position: 0 },
    { id: randomUUID(), name: "To Do", position: 1 },
    { id: randomUUID(), name: "In Progress", position: 2 },
    { id: randomUUID(), name: "Review", position: 3 },
    { id: randomUUID(), name: "Done", position: 4 },
  ];

  for (const col of board1Columns) {
    await db.insert(schema.columns).values({
      id: col.id,
      boardId: board1Id,
      name: col.name,
      position: col.position,
    });
  }

  // Labels for board 1
  const board1Labels = [
    { id: randomUUID(), name: "Feature", color: "#3b82f6" },
    { id: randomUUID(), name: "Bug", color: "#ef4444" },
    { id: randomUUID(), name: "Enhancement", color: "#8b5cf6" },
    { id: randomUUID(), name: "Documentation", color: "#06b6d4" },
    { id: randomUUID(), name: "Priority", color: "#f59e0b" },
  ];

  for (const label of board1Labels) {
    await db.insert(schema.labels).values({
      id: label.id,
      boardId: board1Id,
      name: label.name,
      color: label.color,
    });
  }

  // Cards for Board 1 - TaskFlow Development Sprint
  const board1Cards = [
    // Backlog
    { col: 0, title: "Add notification system", description: "Implement real-time notifications for task assignments and updates", assignee: null, dueDate: null, labels: [0, 2] },
    { col: 0, title: "Implement WebSocket support", description: "Add real-time sync between clients using WebSockets", assignee: null, dueDate: null, labels: [0] },
    { col: 0, title: "Add recurring tasks", description: "Allow users to create tasks that repeat on schedule", assignee: null, dueDate: null, labels: [0] },
    
    // To Do
    { col: 1, title: "Add keyboard shortcuts help modal", description: "Create a modal showing all available keyboard shortcuts when user presses ?", assignee: "priya", dueDate: daysFromNow(3), labels: [0, 4] },
    { col: 1, title: "Implement bulk card actions", description: "Allow selecting multiple cards and performing actions like move, delete, archive", assignee: "rahul", dueDate: daysFromNow(5), labels: [0] },
    { col: 1, title: "Fix column drag on mobile", description: "Column reordering doesn't work well on touch devices", assignee: "sneha", dueDate: daysFromNow(2), labels: [1, 4] },
    
    // In Progress
    { col: 2, title: "Board activity log", description: "Track all changes to boards and cards with timestamps and user info. Show in a sidebar sheet.", assignee: "priya", dueDate: daysFromNow(1), labels: [0] },
    { col: 2, title: "Card attachments feature", description: "Allow uploading files to cards. Store in local public/uploads folder for now.", assignee: "rahul", dueDate: daysFromNow(2), labels: [0] },
    
    // Review
    { col: 3, title: "PWA manifest and icons", description: "Add manifest.json with proper icons for installable app experience", assignee: "sneha", dueDate: daysAgo(0), labels: [0, 2] },
    { col: 3, title: "Board templates feature", description: "Created templates: Kanban, Sprint, Bug Tracker, Personal, Blank", assignee: "abhijeet", dueDate: daysAgo(1), labels: [0] },
    
    // Done
    { col: 4, title: "Implement command palette", description: "Cmd+K to open search/command palette for quick navigation", assignee: "abhijeet", dueDate: daysAgo(3), labels: [0] },
    { col: 4, title: "Add My Tasks page", description: "Dashboard showing all tasks assigned to current user across all boards", assignee: "priya", dueDate: daysAgo(5), labels: [0] },
    { col: 4, title: "GitHub/GitLab link integration", description: "Link cards to issues and PRs, show status badges", assignee: "rahul", dueDate: daysAgo(4), labels: [0, 2] },
    { col: 4, title: "Board background customization", description: "Let users pick background colors for boards", assignee: "sneha", dueDate: daysAgo(6), labels: [2] },
    { col: 4, title: "Assignee picker component", description: "UI to assign tasks to board members with avatars", assignee: "abhijeet", dueDate: daysAgo(7), labels: [0] },
  ];

  let cardPosition = 0;
  for (const card of board1Cards) {
    const cardId = randomUUID();
    const assigneeId = card.assignee 
      ? users[card.assignee as keyof typeof users]?.id 
      : null;

    await db.insert(schema.cards).values({
      id: cardId,
      columnId: board1Columns[card.col].id,
      title: card.title,
      description: card.description,
      assigneeId,
      dueDate: card.dueDate,
      position: cardPosition++,
    });

    // Add labels
    for (const labelIdx of card.labels) {
      await db.insert(schema.cardLabels).values({
        cardId,
        labelId: board1Labels[labelIdx].id,
      });
    }

    // Add some checklists to in-progress cards
    if (card.col === 2) {
      const subtasks = [
        { text: "Create database schema", completed: true },
        { text: "Implement server actions", completed: true },
        { text: "Build UI components", completed: false },
        { text: "Add integration tests", completed: false },
      ];
      let pos = 0;
      for (const subtask of subtasks) {
        await db.insert(schema.checklists).values({
          id: randomUUID(),
          cardId,
          text: subtask.text,
          completed: subtask.completed,
          position: pos++,
        });
      }
    }

    // Add activity log for some cards
    if (card.col === 4) {
      await db.insert(schema.activities).values({
        id: randomUUID(),
        userId: assigneeId || users.abhijeet.id,
        boardId: board1Id,
        cardId,
        action: "created",
        entityType: "card",
        entityTitle: card.title,
        createdAt: daysAgo(8),
      });
      await db.insert(schema.activities).values({
        id: randomUUID(),
        userId: users.abhijeet.id,
        boardId: board1Id,
        cardId,
        action: "moved",
        entityType: "card",
        entityTitle: card.title,
        details: "from In Progress to Done",
        createdAt: card.dueDate || daysAgo(2),
      });
    }
  }

  console.log(`   Created ${board1Cards.length} cards`);

  // ============================================
  // BOARD 2: Bug Tracker
  // ============================================
  console.log("\n🐛 Creating Board 2: Bug Tracker...");
  const board2Id = randomUUID();
  await db.insert(schema.boards).values({
    id: board2Id,
    userId: users.abhijeet.id,
    name: "Bug Tracker",
    background: "#7f1d1d",
    createdAt: daysAgo(10),
  });

  // Add members
  await db.insert(schema.boardMembers).values({ boardId: board2Id, userId: users.abhijeet.id, role: "owner" });
  await db.insert(schema.boardMembers).values({ boardId: board2Id, userId: users.priya.id, role: "member" });
  await db.insert(schema.boardMembers).values({ boardId: board2Id, userId: users.rahul.id, role: "member" });

  // Bug tracker columns
  const board2Columns = [
    { id: randomUUID(), name: "Reported", position: 0 },
    { id: randomUUID(), name: "Triaged", position: 1 },
    { id: randomUUID(), name: "Fixing", position: 2 },
    { id: randomUUID(), name: "Testing", position: 3 },
    { id: randomUUID(), name: "Closed", position: 4 },
  ];

  for (const col of board2Columns) {
    await db.insert(schema.columns).values({ id: col.id, boardId: board2Id, name: col.name, position: col.position });
  }

  // Bug labels
  const board2Labels = [
    { id: randomUUID(), name: "Critical", color: "#ef4444" },
    { id: randomUUID(), name: "High", color: "#f97316" },
    { id: randomUUID(), name: "Medium", color: "#f59e0b" },
    { id: randomUUID(), name: "Low", color: "#84cc16" },
    { id: randomUUID(), name: "UI", color: "#8b5cf6" },
    { id: randomUUID(), name: "Backend", color: "#06b6d4" },
  ];

  for (const label of board2Labels) {
    await db.insert(schema.labels).values({ id: label.id, boardId: board2Id, name: label.name, color: label.color });
  }

  const board2Cards = [
    { col: 0, title: "Modal doesn't close on escape key", labels: [2, 4], assignee: null },
    { col: 0, title: "API rate limit errors not handled", labels: [1, 5], assignee: null },
    { col: 1, title: "Card description loses formatting on save", labels: [2, 4], assignee: "priya" },
    { col: 1, title: "Session expires too quickly", labels: [1, 5], assignee: "rahul" },
    { col: 2, title: "Drag ghost image offset on Firefox", labels: [2, 4], assignee: "priya" },
    { col: 3, title: "Date picker shows wrong timezone", labels: [1, 4], assignee: "rahul" },
    { col: 4, title: "Fixed: 404 on board refresh", labels: [0, 5], assignee: "abhijeet" },
    { col: 4, title: "Fixed: Memory leak in activity polling", labels: [0, 5], assignee: "priya" },
  ];

  cardPosition = 0;
  for (const card of board2Cards) {
    const cardId = randomUUID();
    await db.insert(schema.cards).values({
      id: cardId,
      columnId: board2Columns[card.col].id,
      title: card.title,
      assigneeId: card.assignee ? users[card.assignee as keyof typeof users].id : null,
      position: cardPosition++,
    });
    for (const labelIdx of card.labels) {
      await db.insert(schema.cardLabels).values({ cardId, labelId: board2Labels[labelIdx].id });
    }
  }

  console.log(`   Created ${board2Cards.length} bugs`);

  // ============================================
  // BOARD 3: Personal Tasks
  // ============================================
  console.log("\n📝 Creating Board 3: Personal Tasks...");
  const board3Id = randomUUID();
  await db.insert(schema.boards).values({
    id: board3Id,
    userId: users.abhijeet.id,
    name: "Personal Tasks",
    background: "#134e4a",
    createdAt: daysAgo(20),
  });

  await db.insert(schema.boardMembers).values({ boardId: board3Id, userId: users.abhijeet.id, role: "owner" });

  const board3Columns = [
    { id: randomUUID(), name: "Ideas", position: 0 },
    { id: randomUUID(), name: "To Do", position: 1 },
    { id: randomUUID(), name: "Doing", position: 2 },
    { id: randomUUID(), name: "Done", position: 3 },
  ];

  for (const col of board3Columns) {
    await db.insert(schema.columns).values({ id: col.id, boardId: board3Id, name: col.name, position: col.position });
  }

  const board3Cards = [
    { col: 0, title: "Learn Rust for CLI tools", assignee: "abhijeet" },
    { col: 0, title: "Write blog post about TaskFlow", assignee: "abhijeet" },
    { col: 1, title: "Update portfolio website", assignee: "abhijeet", dueDate: daysFromNow(7) },
    { col: 1, title: "Review pull requests", assignee: "abhijeet", dueDate: daysFromNow(1) },
    { col: 2, title: "Prepare demo video for TaskFlow", assignee: "abhijeet", dueDate: daysFromNow(2) },
    { col: 3, title: "Set up development environment", assignee: "abhijeet" },
    { col: 3, title: "Complete TypeScript course", assignee: "abhijeet" },
  ];

  cardPosition = 0;
  for (const card of board3Cards) {
    await db.insert(schema.cards).values({
      id: randomUUID(),
      columnId: board3Columns[card.col].id,
      title: card.title,
      assigneeId: users[card.assignee as keyof typeof users].id,
      dueDate: (card as any).dueDate || null,
      position: cardPosition++,
    });
  }

  console.log(`   Created ${board3Cards.length} personal tasks`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log("\n✅ Seed complete!\n");
  console.log("📊 Summary:");
  console.log("   • 4 Users (You + 3 team members)");
  console.log("   • 3 Boards (Development Sprint, Bug Tracker, Personal)");
  console.log("   • 30 Cards with labels, assignments, and checklists");
  console.log("\n👤 Your login: abhijeet@taskflow.dev");
  console.log("   Team: Priya, Rahul, Sneha");
  console.log("\n🚀 Run 'npm run dev' and sign in with GitHub!");
  console.log("   (Your GitHub email will be matched to abhijeet@taskflow.dev)");
}

seed()
  .catch(console.error)
  .finally(() => {
    sqlite.close();
    process.exit(0);
  });
