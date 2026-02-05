// Board templates for solo developers, entrepreneurs, and one-person armies
// Each template has themed columns and labels specific to the workflow

export interface BoardTemplate {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  category: "development" | "business" | "content" | "personal" | "learning";
  columns: string[];
  labels: { name: string; color: string }[];
}

export const BOARD_TEMPLATES: BoardTemplate[] = [
  // ==================== DEVELOPMENT ====================
  {
    id: "sdlc",
    name: "SDLC / Software Development",
    description: "Full software development lifecycle from ideation to deployment",
    icon: "Code2",
    category: "development",
    columns: ["Backlog", "Spec & Design", "In Development", "Code Review", "QA / Testing", "Ready to Deploy", "Done"],
    labels: [
      { name: "Feature", color: "#22c55e" },
      { name: "Bug", color: "#ef4444" },
      { name: "Tech Debt", color: "#f97316" },
      { name: "Refactor", color: "#8b5cf6" },
      { name: "Documentation", color: "#06b6d4" },
      { name: "Urgent", color: "#dc2626" },
      { name: "Quick Win", color: "#84cc16" },
      { name: "Blocked", color: "#71717a" },
    ],
  },
  {
    id: "bug_tracker",
    name: "Bug Tracker",
    description: "Track and squash bugs systematically",
    icon: "Bug",
    category: "development",
    columns: ["Reported", "Triaged", "Investigating", "In Progress", "Fixed", "Verified", "Closed"],
    labels: [
      { name: "Critical", color: "#dc2626" },
      { name: "High", color: "#f97316" },
      { name: "Medium", color: "#eab308" },
      { name: "Low", color: "#22c55e" },
      { name: "UI/UX", color: "#8b5cf6" },
      { name: "Backend", color: "#3b82f6" },
      { name: "Frontend", color: "#06b6d4" },
      { name: "Mobile", color: "#ec4899" },
      { name: "Cannot Reproduce", color: "#71717a" },
    ],
  },
  {
    id: "sprint",
    name: "Sprint Board",
    description: "Agile sprint planning for solo devs",
    icon: "Zap",
    category: "development",
    columns: ["Sprint Backlog", "To Do", "In Progress", "Review", "Done"],
    labels: [
      { name: "Story", color: "#22c55e" },
      { name: "Task", color: "#3b82f6" },
      { name: "Spike", color: "#8b5cf6" },
      { name: "Bug", color: "#ef4444" },
      { name: "Carry Over", color: "#f97316" },
      { name: "Stretch Goal", color: "#06b6d4" },
    ],
  },
  {
    id: "devops",
    name: "DevOps / Infrastructure",
    description: "Manage deployments, CI/CD, and infrastructure tasks",
    icon: "Server",
    category: "development",
    columns: ["Planned", "In Progress", "Testing", "Staging", "Production", "Monitoring"],
    labels: [
      { name: "CI/CD", color: "#22c55e" },
      { name: "Security", color: "#ef4444" },
      { name: "Performance", color: "#f97316" },
      { name: "Scaling", color: "#8b5cf6" },
      { name: "Monitoring", color: "#3b82f6" },
      { name: "Cost Optimization", color: "#eab308" },
      { name: "Incident", color: "#dc2626" },
    ],
  },

  // ==================== BUSINESS ====================
  {
    id: "sales_pipeline",
    name: "Sales Pipeline",
    description: "Track leads from first contact to closed deal",
    icon: "DollarSign",
    category: "business",
    columns: ["Leads", "Contacted", "Qualified", "Proposal Sent", "Negotiating", "Closed Won", "Closed Lost"],
    labels: [
      { name: "Hot Lead", color: "#ef4444" },
      { name: "Warm Lead", color: "#f97316" },
      { name: "Cold Lead", color: "#3b82f6" },
      { name: "Enterprise", color: "#8b5cf6" },
      { name: "SMB", color: "#22c55e" },
      { name: "Startup", color: "#06b6d4" },
      { name: "Referral", color: "#ec4899" },
      { name: "Inbound", color: "#84cc16" },
      { name: "Outbound", color: "#eab308" },
    ],
  },
  {
    id: "crm",
    name: "CRM / Customer Management",
    description: "Manage customer relationships and follow-ups",
    icon: "Users",
    category: "business",
    columns: ["New Contacts", "Nurturing", "Active Customers", "At Risk", "Upsell Opportunity", "Champions"],
    labels: [
      { name: "VIP", color: "#eab308" },
      { name: "Follow Up", color: "#f97316" },
      { name: "Support Needed", color: "#ef4444" },
      { name: "Happy", color: "#22c55e" },
      { name: "Feedback Given", color: "#8b5cf6" },
      { name: "Testimonial", color: "#ec4899" },
    ],
  },
  {
    id: "freelance",
    name: "Freelance Projects",
    description: "Manage client projects, invoicing, and deliverables",
    icon: "Briefcase",
    category: "business",
    columns: ["Inquiry", "Scoping", "Proposal", "Active Project", "Review", "Invoiced", "Paid"],
    labels: [
      { name: "High Value", color: "#eab308" },
      { name: "Retainer", color: "#22c55e" },
      { name: "One-off", color: "#3b82f6" },
      { name: "Urgent", color: "#ef4444" },
      { name: "Overdue", color: "#dc2626" },
      { name: "Waiting on Client", color: "#f97316" },
      { name: "Web Dev", color: "#8b5cf6" },
      { name: "Design", color: "#ec4899" },
      { name: "Consulting", color: "#06b6d4" },
    ],
  },
  {
    id: "product_launch",
    name: "Product Launch",
    description: "Plan and execute a product launch end-to-end",
    icon: "Rocket",
    category: "business",
    columns: ["Ideas", "Research", "Planning", "Building", "Pre-Launch", "Launch Day", "Post-Launch"],
    labels: [
      { name: "Marketing", color: "#ec4899" },
      { name: "Product", color: "#8b5cf6" },
      { name: "Engineering", color: "#3b82f6" },
      { name: "Design", color: "#06b6d4" },
      { name: "Legal", color: "#71717a" },
      { name: "Press", color: "#f97316" },
      { name: "Partner", color: "#22c55e" },
      { name: "Blocker", color: "#ef4444" },
    ],
  },

  // ==================== MARKETING & CONTENT ====================
  {
    id: "marketing",
    name: "Marketing Campaigns",
    description: "Plan and track marketing initiatives",
    icon: "Megaphone",
    category: "content",
    columns: ["Ideas", "Planning", "Creating", "Review", "Scheduled", "Live", "Analyzing"],
    labels: [
      { name: "SEO", color: "#22c55e" },
      { name: "Paid Ads", color: "#eab308" },
      { name: "Social", color: "#3b82f6" },
      { name: "Email", color: "#8b5cf6" },
      { name: "Content", color: "#ec4899" },
      { name: "PR", color: "#f97316" },
      { name: "A/B Test", color: "#06b6d4" },
      { name: "Evergreen", color: "#84cc16" },
    ],
  },
  {
    id: "content_calendar",
    name: "Content Calendar",
    description: "Plan blog posts, videos, and social content",
    icon: "Calendar",
    category: "content",
    columns: ["Ideas", "Research", "Outline", "Writing/Creating", "Editing", "Scheduled", "Published"],
    labels: [
      { name: "Blog Post", color: "#3b82f6" },
      { name: "Video", color: "#ef4444" },
      { name: "Podcast", color: "#8b5cf6" },
      { name: "Twitter Thread", color: "#06b6d4" },
      { name: "LinkedIn", color: "#0077b5" },
      { name: "Newsletter", color: "#f97316" },
      { name: "Tutorial", color: "#22c55e" },
      { name: "Case Study", color: "#ec4899" },
      { name: "Repurpose", color: "#eab308" },
    ],
  },
  {
    id: "social_media",
    name: "Social Media",
    description: "Manage social posts across platforms",
    icon: "Share2",
    category: "content",
    columns: ["Content Ideas", "Creating", "Ready to Post", "Scheduled", "Posted", "Engaging"],
    labels: [
      { name: "Twitter/X", color: "#1da1f2" },
      { name: "LinkedIn", color: "#0077b5" },
      { name: "Instagram", color: "#e4405f" },
      { name: "TikTok", color: "#000000" },
      { name: "YouTube", color: "#ff0000" },
      { name: "Threads", color: "#000000" },
      { name: "Meme", color: "#eab308" },
      { name: "Educational", color: "#22c55e" },
      { name: "Promotional", color: "#f97316" },
    ],
  },
  {
    id: "youtube",
    name: "YouTube Channel",
    description: "Manage video production pipeline",
    icon: "Youtube",
    category: "content",
    columns: ["Video Ideas", "Scripting", "Filming", "Editing", "Thumbnail & Title", "Scheduled", "Published", "Promoting"],
    labels: [
      { name: "Tutorial", color: "#22c55e" },
      { name: "Vlog", color: "#3b82f6" },
      { name: "Review", color: "#8b5cf6" },
      { name: "Short", color: "#f97316" },
      { name: "Collaboration", color: "#ec4899" },
      { name: "Trending Topic", color: "#ef4444" },
      { name: "Evergreen", color: "#84cc16" },
      { name: "Sponsored", color: "#eab308" },
    ],
  },

  // ==================== PERSONAL ====================
  {
    id: "personal",
    name: "Personal Tasks",
    description: "Simple task management for daily life",
    icon: "User",
    category: "personal",
    columns: ["Inbox", "To Do", "In Progress", "Waiting", "Done"],
    labels: [
      { name: "Home", color: "#22c55e" },
      { name: "Health", color: "#ef4444" },
      { name: "Finance", color: "#eab308" },
      { name: "Family", color: "#ec4899" },
      { name: "Errands", color: "#f97316" },
      { name: "Admin", color: "#71717a" },
      { name: "Important", color: "#8b5cf6" },
      { name: "Quick", color: "#06b6d4" },
    ],
  },
  {
    id: "gtd",
    name: "GTD (Getting Things Done)",
    description: "David Allen's GTD methodology",
    icon: "Inbox",
    category: "personal",
    columns: ["Inbox", "Next Actions", "Waiting For", "Projects", "Someday/Maybe", "Done"],
    labels: [
      { name: "@Home", color: "#22c55e" },
      { name: "@Work", color: "#3b82f6" },
      { name: "@Computer", color: "#8b5cf6" },
      { name: "@Phone", color: "#f97316" },
      { name: "@Errands", color: "#eab308" },
      { name: "2 min task", color: "#84cc16" },
      { name: "Weekly Review", color: "#ec4899" },
    ],
  },
  {
    id: "weekly_planning",
    name: "Weekly Planning",
    description: "Plan your week with daily columns",
    icon: "CalendarDays",
    category: "personal",
    columns: ["Backlog", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Weekend", "Done"],
    labels: [
      { name: "Deep Work", color: "#8b5cf6" },
      { name: "Meetings", color: "#3b82f6" },
      { name: "Admin", color: "#71717a" },
      { name: "Health", color: "#22c55e" },
      { name: "Learning", color: "#f97316" },
      { name: "Fun", color: "#ec4899" },
      { name: "Must Do", color: "#ef4444" },
    ],
  },
  {
    id: "goals",
    name: "Goals & OKRs",
    description: "Track quarterly and yearly goals",
    icon: "Target",
    category: "personal",
    columns: ["Brainstorm", "This Quarter", "In Progress", "On Track", "At Risk", "Achieved"],
    labels: [
      { name: "Career", color: "#3b82f6" },
      { name: "Health", color: "#22c55e" },
      { name: "Finance", color: "#eab308" },
      { name: "Relationships", color: "#ec4899" },
      { name: "Learning", color: "#8b5cf6" },
      { name: "Side Project", color: "#f97316" },
      { name: "Q1", color: "#06b6d4" },
      { name: "Q2", color: "#84cc16" },
      { name: "Q3", color: "#f59e0b" },
      { name: "Q4", color: "#ef4444" },
    ],
  },
  {
    id: "habit_tracker",
    name: "Habit Tracker",
    description: "Build and track habits",
    icon: "Repeat",
    category: "personal",
    columns: ["Want to Start", "Building", "Consistent", "Mastered", "Paused"],
    labels: [
      { name: "Morning", color: "#f97316" },
      { name: "Evening", color: "#8b5cf6" },
      { name: "Daily", color: "#22c55e" },
      { name: "Weekly", color: "#3b82f6" },
      { name: "Health", color: "#ef4444" },
      { name: "Productivity", color: "#eab308" },
      { name: "Mindfulness", color: "#06b6d4" },
    ],
  },

  // ==================== LEARNING ====================
  {
    id: "learning",
    name: "Learning & Courses",
    description: "Track courses, books, and learning goals",
    icon: "GraduationCap",
    category: "learning",
    columns: ["Want to Learn", "Researching", "In Progress", "Practicing", "Completed", "Teaching Others"],
    labels: [
      { name: "Course", color: "#3b82f6" },
      { name: "Book", color: "#8b5cf6" },
      { name: "Tutorial", color: "#22c55e" },
      { name: "Podcast", color: "#f97316" },
      { name: "Video", color: "#ef4444" },
      { name: "Hands-on", color: "#eab308" },
      { name: "Theory", color: "#71717a" },
      { name: "Certification", color: "#ec4899" },
    ],
  },
  {
    id: "reading_list",
    name: "Reading List",
    description: "Track books and articles",
    icon: "BookOpen",
    category: "learning",
    columns: ["Want to Read", "Reading", "On Hold", "Finished", "Favorites"],
    labels: [
      { name: "Fiction", color: "#ec4899" },
      { name: "Non-Fiction", color: "#3b82f6" },
      { name: "Technical", color: "#8b5cf6" },
      { name: "Business", color: "#eab308" },
      { name: "Self-Help", color: "#22c55e" },
      { name: "Article", color: "#f97316" },
      { name: "Must Read", color: "#ef4444" },
    ],
  },
  {
    id: "side_projects",
    name: "Side Projects",
    description: "Manage your side projects and experiments",
    icon: "Lightbulb",
    category: "learning",
    columns: ["Ideas", "Validating", "Building MVP", "Launched", "Growing", "Archived"],
    labels: [
      { name: "SaaS", color: "#8b5cf6" },
      { name: "Open Source", color: "#22c55e" },
      { name: "Mobile App", color: "#3b82f6" },
      { name: "Web App", color: "#06b6d4" },
      { name: "Chrome Ext", color: "#eab308" },
      { name: "AI/ML", color: "#f97316" },
      { name: "For Fun", color: "#ec4899" },
      { name: "Revenue", color: "#84cc16" },
    ],
  },

  // ==================== BASIC ====================
  {
    id: "kanban",
    name: "Simple Kanban",
    description: "Classic To Do, Doing, Done",
    icon: "LayoutGrid",
    category: "personal",
    columns: ["To Do", "In Progress", "Done"],
    labels: [
      { name: "High Priority", color: "#ef4444" },
      { name: "Medium Priority", color: "#f97316" },
      { name: "Low Priority", color: "#22c55e" },
    ],
  },
  {
    id: "blank",
    name: "Blank Board",
    description: "Start from scratch",
    icon: "Plus",
    category: "personal",
    columns: [],
    labels: [],
  },
];

// Get templates grouped by category
export function getTemplatesByCategory() {
  const categories = {
    development: { name: "Development", icon: "Code2", templates: [] as BoardTemplate[] },
    business: { name: "Business & Sales", icon: "Briefcase", templates: [] as BoardTemplate[] },
    content: { name: "Marketing & Content", icon: "Megaphone", templates: [] as BoardTemplate[] },
    personal: { name: "Personal", icon: "User", templates: [] as BoardTemplate[] },
    learning: { name: "Learning & Growth", icon: "GraduationCap", templates: [] as BoardTemplate[] },
  };

  BOARD_TEMPLATES.forEach(template => {
    categories[template.category].templates.push(template);
  });

  return categories;
}

// Get a specific template by ID
export function getTemplateById(id: string): BoardTemplate | undefined {
  return BOARD_TEMPLATES.find(t => t.id === id);
}
