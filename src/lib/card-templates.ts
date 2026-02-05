// Card Templates - Pre-defined task templates with checklists for common workflows

export interface CardTemplate {
  id: string;
  name: string;
  icon: string;
  category: "development" | "content" | "meeting" | "sales" | "general";
  description: string;
  defaultTitle: string;
  defaultDescription?: string;
  suggestedPriority?: string;
  suggestedLabels?: string[];
  estimatedTime?: number; // in minutes
  checklist: string[];
}

export const CARD_TEMPLATES: CardTemplate[] = [
  // Development Templates
  {
    id: "bug-report",
    name: "Bug Report",
    icon: "🐛",
    category: "development",
    description: "Track and fix a bug with structured steps",
    defaultTitle: "Fix: ",
    defaultDescription: "## Bug Description\n\n## Steps to Reproduce\n1. \n2. \n3. \n\n## Expected Behavior\n\n## Actual Behavior\n\n## Environment\n- Browser: \n- OS: ",
    suggestedPriority: "p2",
    suggestedLabels: ["bug"],
    estimatedTime: 60,
    checklist: [
      "Reproduce the bug locally",
      "Identify root cause",
      "Write failing test",
      "Implement fix",
      "Verify fix works",
      "Write regression test",
      "Update documentation if needed",
      "Create PR for review",
    ],
  },
  {
    id: "feature-request",
    name: "Feature Request",
    icon: "✨",
    category: "development",
    description: "Plan and implement a new feature",
    defaultTitle: "Feature: ",
    defaultDescription: "## Overview\n\n## User Story\nAs a [user type], I want [goal] so that [benefit].\n\n## Acceptance Criteria\n- [ ] \n- [ ] \n\n## Technical Notes\n",
    suggestedLabels: ["feature"],
    estimatedTime: 240,
    checklist: [
      "Define requirements",
      "Create technical design",
      "Break into subtasks",
      "Implement core functionality",
      "Add unit tests",
      "Add integration tests",
      "Update documentation",
      "Code review",
      "QA testing",
      "Deploy to staging",
      "Deploy to production",
    ],
  },
  {
    id: "code-review",
    name: "Code Review",
    icon: "👀",
    category: "development",
    description: "Review a pull request",
    defaultTitle: "Review: PR #",
    suggestedLabels: ["review"],
    estimatedTime: 30,
    checklist: [
      "Understand the context/ticket",
      "Review code changes",
      "Check for edge cases",
      "Verify tests are adequate",
      "Test locally if needed",
      "Leave constructive feedback",
      "Approve or request changes",
    ],
  },
  {
    id: "tech-debt",
    name: "Tech Debt",
    icon: "🔧",
    category: "development",
    description: "Address technical debt",
    defaultTitle: "Refactor: ",
    suggestedLabels: ["tech-debt"],
    estimatedTime: 120,
    checklist: [
      "Document current state",
      "Define desired state",
      "Identify breaking changes",
      "Create migration plan",
      "Implement refactor",
      "Update tests",
      "Update documentation",
      "Verify no regressions",
    ],
  },

  // Content Templates
  {
    id: "blog-post",
    name: "Blog Post",
    icon: "📝",
    category: "content",
    description: "Write and publish a blog post",
    defaultTitle: "Write: ",
    defaultDescription: "## Topic\n\n## Target Audience\n\n## Key Points\n- \n- \n- \n\n## Call to Action\n",
    suggestedLabels: ["content", "blog"],
    estimatedTime: 180,
    checklist: [
      "Research topic",
      "Create outline",
      "Write first draft",
      "Add images/diagrams",
      "Self-edit for clarity",
      "Proofread",
      "Add SEO metadata",
      "Schedule/publish",
      "Promote on social media",
    ],
  },
  {
    id: "social-media-post",
    name: "Social Media Post",
    icon: "📱",
    category: "content",
    description: "Create social media content",
    defaultTitle: "Post: ",
    suggestedLabels: ["content", "social"],
    estimatedTime: 30,
    checklist: [
      "Define message",
      "Write copy",
      "Create/select visual",
      "Add hashtags",
      "Schedule post",
      "Engage with comments",
    ],
  },
  {
    id: "newsletter",
    name: "Newsletter",
    icon: "📧",
    category: "content",
    description: "Create and send newsletter",
    defaultTitle: "Newsletter: ",
    suggestedLabels: ["content", "newsletter"],
    estimatedTime: 120,
    checklist: [
      "Gather content/updates",
      "Write subject line",
      "Write intro",
      "Add main content sections",
      "Include call to action",
      "Preview and test",
      "Schedule send",
      "Monitor open rates",
    ],
  },

  // Meeting Templates
  {
    id: "meeting-notes",
    name: "Meeting Notes",
    icon: "🤝",
    category: "meeting",
    description: "Capture and track meeting outcomes",
    defaultTitle: "Meeting: ",
    defaultDescription: "## Attendees\n\n## Agenda\n1. \n\n## Discussion\n\n## Decisions\n\n## Action Items\n",
    suggestedLabels: ["meeting"],
    estimatedTime: 60,
    checklist: [
      "Prepare agenda",
      "Send calendar invite",
      "Take notes during meeting",
      "Capture action items",
      "Send follow-up summary",
      "Track action item completion",
    ],
  },
  {
    id: "one-on-one",
    name: "1:1 Meeting",
    icon: "👥",
    category: "meeting",
    description: "Prepare for 1:1 meeting",
    defaultTitle: "1:1 with ",
    defaultDescription: "## Topics to Discuss\n\n## Updates to Share\n\n## Questions\n\n## Feedback\n",
    suggestedLabels: ["meeting", "1:1"],
    estimatedTime: 30,
    checklist: [
      "Review previous 1:1 notes",
      "Prepare talking points",
      "List questions",
      "Take notes",
      "Document action items",
    ],
  },

  // Sales Templates
  {
    id: "sales-call",
    name: "Sales Call",
    icon: "📞",
    category: "sales",
    description: "Prepare for and follow up on sales call",
    defaultTitle: "Call: ",
    defaultDescription: "## Prospect\n- Company: \n- Contact: \n- Role: \n\n## Pain Points\n\n## Our Solution\n\n## Next Steps\n",
    suggestedLabels: ["sales", "call"],
    estimatedTime: 45,
    checklist: [
      "Research prospect/company",
      "Prepare talking points",
      "Review previous interactions",
      "Make the call",
      "Take notes",
      "Send follow-up email",
      "Update CRM",
      "Schedule next touchpoint",
    ],
  },
  {
    id: "proposal",
    name: "Proposal",
    icon: "📋",
    category: "sales",
    description: "Create and send a proposal",
    defaultTitle: "Proposal for ",
    suggestedLabels: ["sales", "proposal"],
    estimatedTime: 180,
    checklist: [
      "Understand requirements",
      "Define scope",
      "Create pricing",
      "Draft proposal",
      "Internal review",
      "Send to prospect",
      "Follow up",
      "Handle questions/objections",
    ],
  },

  // General Templates
  {
    id: "research",
    name: "Research Task",
    icon: "🔍",
    category: "general",
    description: "Research and document findings",
    defaultTitle: "Research: ",
    defaultDescription: "## Question/Goal\n\n## Sources\n\n## Key Findings\n\n## Recommendations\n",
    suggestedLabels: ["research"],
    estimatedTime: 120,
    checklist: [
      "Define research question",
      "Identify sources",
      "Gather information",
      "Analyze findings",
      "Document conclusions",
      "Share with team",
    ],
  },
  {
    id: "quick-task",
    name: "Quick Task",
    icon: "⚡",
    category: "general",
    description: "Simple task with no checklist",
    defaultTitle: "",
    estimatedTime: 15,
    checklist: [],
  },
  {
    id: "learning",
    name: "Learning Goal",
    icon: "📚",
    category: "general",
    description: "Track learning a new skill or topic",
    defaultTitle: "Learn: ",
    suggestedLabels: ["learning"],
    estimatedTime: 120,
    checklist: [
      "Define learning objective",
      "Find resources (courses, docs, tutorials)",
      "Block time for learning",
      "Take notes",
      "Practice/apply",
      "Review and solidify",
    ],
  },
];

export function getTemplateById(id: string): CardTemplate | undefined {
  return CARD_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(category: CardTemplate["category"]): CardTemplate[] {
  return CARD_TEMPLATES.filter(t => t.category === category);
}
