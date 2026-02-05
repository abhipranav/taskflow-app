// Natural Language Task Parser
// Parses input like "Fix login bug p1 tomorrow #backend @john" into structured task data

export interface ParsedTask {
  title: string;
  priority?: string;
  dueDate?: Date;
  labels: string[];
  assignee?: string;
  estimatedTime?: number; // in minutes
  isRecurring?: boolean;
  recurringPattern?: string;
}

// Priority keywords
const PRIORITY_PATTERNS: Record<string, string> = {
  "p1": "p1", "!1": "p1", "urgent": "p1", "critical": "p1", "high": "p1",
  "p2": "p2", "!2": "p2", "important": "p2", "medium": "p2",
  "p3": "p3", "!3": "p3", "normal": "p3",
  "p4": "p4", "!4": "p4", "low": "p4",
};

// Time estimation keywords
const TIME_PATTERNS: Record<string, number> = {
  "5m": 5, "5min": 5, "5mins": 5,
  "10m": 10, "10min": 10, "10mins": 10,
  "15m": 15, "15min": 15, "15mins": 15, "quick": 15,
  "30m": 30, "30min": 30, "30mins": 30, "half hour": 30,
  "45m": 45, "45min": 45, "45mins": 45,
  "1h": 60, "1hr": 60, "1hour": 60, "hour": 60,
  "1.5h": 90, "1.5hr": 90, "90m": 90, "90min": 90,
  "2h": 120, "2hr": 120, "2hours": 120,
  "3h": 180, "3hr": 180, "3hours": 180,
  "4h": 240, "4hr": 240, "half day": 240,
  "8h": 480, "8hr": 480, "full day": 480, "day": 480,
};

// Recurring patterns
const RECURRING_PATTERNS: Record<string, string> = {
  "daily": "daily",
  "every day": "daily",
  "everyday": "daily",
  "weekly": "weekly",
  "every week": "weekly",
  "monthly": "monthly",
  "every month": "monthly",
  "weekdays": "weekdays",
  "every weekday": "weekdays",
};

// Date parsing
function parseRelativeDate(input: string): Date | undefined {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  const lower = input.toLowerCase();
  
  // Exact matches
  if (lower === "today" || lower === "tod") {
    return today;
  }
  
  if (lower === "tomorrow" || lower === "tom" || lower === "tmr" || lower === "tmrw") {
    const date = new Date(today);
    date.setDate(date.getDate() + 1);
    return date;
  }
  
  if (lower === "next week" || lower === "nextweek") {
    const date = new Date(today);
    date.setDate(date.getDate() + 7);
    return date;
  }
  
  // Days of week
  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const shortDays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  
  let dayIndex = daysOfWeek.indexOf(lower);
  if (dayIndex === -1) dayIndex = shortDays.indexOf(lower);
  
  if (dayIndex !== -1) {
    const date = new Date(today);
    const currentDay = date.getDay();
    const daysUntil = (dayIndex - currentDay + 7) % 7 || 7; // Next occurrence
    date.setDate(date.getDate() + daysUntil);
    return date;
  }
  
  // "in X days"
  const inDaysMatch = lower.match(/in\s+(\d+)\s+days?/);
  if (inDaysMatch) {
    const date = new Date(today);
    date.setDate(date.getDate() + parseInt(inDaysMatch[1]));
    return date;
  }
  
  // "in X weeks"
  const inWeeksMatch = lower.match(/in\s+(\d+)\s+weeks?/);
  if (inWeeksMatch) {
    const date = new Date(today);
    date.setDate(date.getDate() + parseInt(inWeeksMatch[1]) * 7);
    return date;
  }
  
  // End of week (Friday)
  if (lower === "eow" || lower === "end of week") {
    const date = new Date(today);
    const daysUntilFriday = (5 - date.getDay() + 7) % 7 || 7;
    date.setDate(date.getDate() + daysUntilFriday);
    return date;
  }
  
  // End of month
  if (lower === "eom" || lower === "end of month") {
    const date = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return date;
  }
  
  return undefined;
}

export function parseNaturalLanguageTask(input: string): ParsedTask {
  let title = input.trim();
  const labels: string[] = [];
  let priority: string | undefined;
  let dueDate: Date | undefined;
  let assignee: string | undefined;
  let estimatedTime: number | undefined;
  let isRecurring = false;
  let recurringPattern: string | undefined;
  
  // Extract labels (#tag)
  const labelMatches = title.match(/#(\w+)/g);
  if (labelMatches) {
    labelMatches.forEach(match => {
      labels.push(match.substring(1));
      title = title.replace(match, "").trim();
    });
  }
  
  // Extract assignee (@name)
  const assigneeMatch = title.match(/@(\w+)/);
  if (assigneeMatch) {
    assignee = assigneeMatch[1];
    title = title.replace(assigneeMatch[0], "").trim();
  }
  
  // Extract priority
  const words = title.toLowerCase().split(/\s+/);
  for (const word of words) {
    if (PRIORITY_PATTERNS[word]) {
      priority = PRIORITY_PATTERNS[word];
      title = title.replace(new RegExp(`\\b${word}\\b`, "i"), "").trim();
      break;
    }
  }
  
  // Extract time estimate
  for (const [pattern, minutes] of Object.entries(TIME_PATTERNS)) {
    const regex = new RegExp(`\\b${pattern}\\b`, "i");
    if (regex.test(title)) {
      estimatedTime = minutes;
      title = title.replace(regex, "").trim();
      break;
    }
  }
  
  // Extract recurring pattern
  for (const [pattern, value] of Object.entries(RECURRING_PATTERNS)) {
    const regex = new RegExp(`\\b${pattern}\\b`, "i");
    if (regex.test(title)) {
      isRecurring = true;
      recurringPattern = value;
      title = title.replace(regex, "").trim();
      break;
    }
  }
  
  // Extract dates - check various patterns
  const datePatterns = [
    "today", "tod",
    "tomorrow", "tom", "tmr", "tmrw",
    "next week", "nextweek",
    "eow", "end of week",
    "eom", "end of month",
    "monday", "mon", "tuesday", "tue", "wednesday", "wed", 
    "thursday", "thu", "friday", "fri", "saturday", "sat", "sunday", "sun",
  ];
  
  for (const pattern of datePatterns) {
    const regex = new RegExp(`\\b${pattern}\\b`, "i");
    if (regex.test(title)) {
      dueDate = parseRelativeDate(pattern);
      title = title.replace(regex, "").trim();
      break;
    }
  }
  
  // Check for "in X days/weeks" pattern
  const inDaysMatch = title.match(/in\s+\d+\s+(days?|weeks?)/i);
  if (inDaysMatch) {
    dueDate = parseRelativeDate(inDaysMatch[0]);
    title = title.replace(inDaysMatch[0], "").trim();
  }
  
  // Clean up extra whitespace
  title = title.replace(/\s+/g, " ").trim();
  
  return {
    title,
    priority,
    dueDate,
    labels,
    assignee,
    estimatedTime,
    isRecurring,
    recurringPattern,
  };
}

// Generate smart suggestions based on task title
export function generateSmartSuggestions(title: string): Partial<ParsedTask> {
  const lower = title.toLowerCase();
  const suggestions: Partial<ParsedTask> = {};
  
  // Bug detection
  if (lower.includes("bug") || lower.includes("fix") || lower.includes("broken") || lower.includes("error")) {
    suggestions.priority = "p1";
    suggestions.labels = ["bug"];
    suggestions.estimatedTime = 60; // 1 hour default for bugs
  }
  
  // Feature detection
  if (lower.includes("feature") || lower.includes("add") || lower.includes("implement") || lower.includes("create")) {
    suggestions.labels = ["feature"];
    suggestions.estimatedTime = 240; // 4 hours default
  }
  
  // Content/writing detection
  if (lower.includes("write") || lower.includes("blog") || lower.includes("article") || lower.includes("post") || lower.includes("content")) {
    suggestions.labels = ["content"];
    suggestions.estimatedTime = 120; // 2 hours
  }
  
  // Meeting detection
  if (lower.includes("meeting") || lower.includes("call") || lower.includes("sync") || lower.includes("standup")) {
    suggestions.labels = ["meeting"];
    suggestions.estimatedTime = 30;
  }
  
  // Review detection
  if (lower.includes("review") || lower.includes("pr") || lower.includes("code review")) {
    suggestions.labels = ["review"];
    suggestions.estimatedTime = 30;
  }
  
  // Research detection
  if (lower.includes("research") || lower.includes("investigate") || lower.includes("explore") || lower.includes("learn")) {
    suggestions.labels = ["research"];
    suggestions.estimatedTime = 120;
  }
  
  // Urgent keywords
  if (lower.includes("asap") || lower.includes("urgent") || lower.includes("immediately") || lower.includes("now")) {
    suggestions.priority = "p1";
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    suggestions.dueDate = today;
  }
  
  return suggestions;
}
