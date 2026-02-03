import { db } from "./index";
import { users, boards, columns, cards, labels, cardLabels } from "./schema";

// Generate unique IDs
function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

async function seed() {
  console.log("🌱 Seeding database...");

  // Create demo user
  const userId = generateId();
  await db.insert(users).values({
    id: userId,
    email: "demo@taskflow.app",
    name: "Demo User",
    image: null,
  });
  console.log("✅ Created demo user");

  // Create demo board
  const boardId = generateId();
  await db.insert(boards).values({
    id: boardId,
    userId: userId,
    name: "My First Board",
    background: null,
  });
  console.log("✅ Created demo board");

  // Create columns
  const columnData = [
    { id: generateId(), name: "To Do", position: 0 },
    { id: generateId(), name: "In Progress", position: 1 },
    { id: generateId(), name: "Done", position: 2 },
  ];

  for (const col of columnData) {
    await db.insert(columns).values({
      id: col.id,
      boardId: boardId,
      name: col.name,
      position: col.position,
    });
  }
  console.log("✅ Created columns");

  // Create labels
  const labelData = [
    { id: generateId(), name: "Bug", color: "#ef4444" },
    { id: generateId(), name: "Feature", color: "#10b981" },
    { id: generateId(), name: "Enhancement", color: "#3b82f6" },
    { id: generateId(), name: "Documentation", color: "#f59e0b" },
    { id: generateId(), name: "Priority", color: "#8b5cf6" },
  ];

  for (const label of labelData) {
    await db.insert(labels).values({
      id: label.id,
      boardId: boardId,
      name: label.name,
      color: label.color,
    });
  }
  console.log("✅ Created labels");

  // Create cards
  const cardsData = [
    {
      id: generateId(),
      columnId: columnData[0].id,
      title: "Set up project structure",
      description: "Initialize Next.js with TypeScript and configure Tailwind CSS",
      position: 0,
      labelIds: [labelData[1].id], // Feature
    },
    {
      id: generateId(),
      columnId: columnData[0].id,
      title: "Design database schema",
      description: "Create Drizzle ORM schema for tasks, boards, and users",
      position: 1,
      labelIds: [labelData[2].id], // Enhancement
    },
    {
      id: generateId(),
      columnId: columnData[1].id,
      title: "Build Kanban board UI",
      description: "Implement drag-and-drop with @dnd-kit",
      position: 0,
      labelIds: [labelData[1].id, labelData[4].id], // Feature, Priority
    },
    {
      id: generateId(),
      columnId: columnData[2].id,
      title: "Create PRD document",
      description: "Document product requirements and features",
      position: 0,
      labelIds: [labelData[3].id], // Documentation
    },
  ];

  for (const card of cardsData) {
    await db.insert(cards).values({
      id: card.id,
      columnId: card.columnId,
      assigneeId: userId,
      title: card.title,
      description: card.description,
      position: card.position,
    });

    // Assign labels to cards
    for (const labelId of card.labelIds) {
      await db.insert(cardLabels).values({
        cardId: card.id,
        labelId: labelId,
      });
    }
  }
  console.log("✅ Created cards");

  console.log("🎉 Database seeded successfully!");
}

// Run seed
seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
