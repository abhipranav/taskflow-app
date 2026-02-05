import { type ChatMessage } from "@/app/actions/chat";
import { type PersonaId } from "@/lib/ai-personas";

const CHAT_STORAGE_KEY = "taskflow-ai-chat";
const CHAT_HISTORY_KEY = "taskflow-ai-chat-history";
const CONVERSATION_ID_KEY = "taskflow-conversation-id";

const MAX_CONVERSATIONS = 20;
const MAX_MESSAGES = 200;
const MAX_MESSAGE_CHARS = 4000;
const MAX_AGE_DAYS = 30;

interface ChatState {
  messages: ChatMessage[];
  personaId: PersonaId;
  conversationId: string;
  updatedAt: number;
}

interface ChatConversation {
  id: string;
  title: string;
  personaId: PersonaId;
  messages: ChatMessage[];
  updatedAt: number;
}

interface ChatHistory {
  version: 1;
  conversations: ChatConversation[];
}

export interface ChatConversationSummary {
  id: string;
  title: string;
  personaId: PersonaId;
  updatedAt: number;
  messageCount: number;
}

const isBrowser = () => typeof window !== "undefined";

const reviveMessages = (messages: ChatMessage[]) =>
  messages.map((msg) => ({
    ...msg,
    timestamp: new Date(msg.timestamp),
  }));

const truncate = (value: string, max: number) => {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
};

const deriveTitle = (messages: ChatMessage[]) => {
  const firstUserMessage = messages.find(
    (message) => message.role === "user" && message.content.trim().length > 0
  );

  if (!firstUserMessage) return "New chat";

  const firstLine = firstUserMessage.content.split("\n").find(Boolean) || "";
  return truncate(firstLine.trim(), 56) || "New chat";
};

const normalizeMessages = (messages: ChatMessage[]) =>
  messages
    .slice(-MAX_MESSAGES)
    .map((message) => ({
      ...message,
      content: truncate(message.content, MAX_MESSAGE_CHARS),
    }));

const pruneConversations = (conversations: ChatConversation[]) => {
  const maxAgeMs = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const now = Date.now();

  return conversations
    .filter((conversation) => now - conversation.updatedAt <= maxAgeMs)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_CONVERSATIONS);
};

const loadHistory = (): ChatHistory => {
  if (!isBrowser()) {
    return { version: 1, conversations: [] };
  }

  const stored = localStorage.getItem(CHAT_HISTORY_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as ChatHistory;
      const conversations = (parsed.conversations || []).map((conversation) => ({
        ...conversation,
        title: conversation.title || deriveTitle(conversation.messages || []),
        updatedAt: Number(conversation.updatedAt || Date.now()),
        messages: reviveMessages(conversation.messages || []),
      }));

      const pruned = pruneConversations(conversations);
      if (pruned.length !== conversations.length) {
        saveHistory({ version: 1, conversations: pruned });
      }

      return {
        version: 1,
        conversations: pruned,
      };
    } catch {
      // Fall through to migration.
    }
  }

  const legacy = localStorage.getItem(CHAT_STORAGE_KEY);
  if (!legacy) {
    return { version: 1, conversations: [] };
  }

  try {
    const parsed = JSON.parse(legacy) as ChatState;
    const conversationId = parsed.conversationId || getConversationId();
    const messages = reviveMessages(parsed.messages || []);
    const conversation: ChatConversation = {
      id: conversationId,
      title: deriveTitle(messages),
      personaId: parsed.personaId || "friendly-assistant",
      messages: normalizeMessages(messages),
      updatedAt: parsed.updatedAt || Date.now(),
    };

    const history: ChatHistory = { version: 1, conversations: [conversation] };
    saveHistory(history);
    return history;
  } catch {
    return { version: 1, conversations: [] };
  }
};

const saveHistory = (history: ChatHistory) => {
  if (!isBrowser()) return;
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
};

// Get or create a persistent conversation ID
export function getConversationId(): string {
  if (!isBrowser()) return crypto.randomUUID();

  let id = localStorage.getItem(CONVERSATION_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CONVERSATION_ID_KEY, id);
  }
  return id;
}

export function setConversationId(id: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(CONVERSATION_ID_KEY, id);
}

export function startNewConversation(): string {
  const newId = crypto.randomUUID();
  setConversationId(newId);
  return newId;
}

export function listConversations(): ChatConversationSummary[] {
  const history = loadHistory();
  return history.conversations
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((conversation) => ({
      id: conversation.id,
      title: conversation.title || deriveTitle(conversation.messages),
      personaId: conversation.personaId,
      updatedAt: conversation.updatedAt,
      messageCount: conversation.messages.length,
    }));
}

export function deleteConversation(conversationId: string): void {
  if (!isBrowser()) return;
  const history = loadHistory();
  history.conversations = history.conversations.filter(
    (conversation) => conversation.id !== conversationId
  );
  saveHistory({ version: 1, conversations: pruneConversations(history.conversations) });
}

// Save chat state to localStorage
export function saveChatState(state: Omit<ChatState, "updatedAt">): void {
  if (!isBrowser()) return;

  const updatedAt = Date.now();
  const messages = normalizeMessages(state.messages);
  const history = loadHistory();

  const conversation: ChatConversation = {
    id: state.conversationId,
    title: deriveTitle(messages),
    personaId: state.personaId,
    messages,
    updatedAt,
  };

  const existingIndex = history.conversations.findIndex(
    (entry) => entry.id === state.conversationId
  );

  if (existingIndex >= 0) {
    history.conversations[existingIndex] = conversation;
  } else {
    history.conversations.push(conversation);
  }

  history.conversations = pruneConversations(history.conversations);
  saveHistory(history);

  const fullState: ChatState = {
    ...state,
    updatedAt,
  };

  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(fullState));
}

// Load chat state from localStorage
export function loadChatState(conversationId?: string): ChatState | null {
  if (!isBrowser()) return null;

  const id = conversationId || getConversationId();
  const history = loadHistory();
  const conversation = history.conversations.find((entry) => entry.id === id);

  if (conversation) {
    return {
      messages: reviveMessages(conversation.messages),
      personaId: conversation.personaId,
      conversationId: conversation.id,
      updatedAt: conversation.updatedAt,
    };
  }

  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!stored) return null;

    const state = JSON.parse(stored) as ChatState;
    state.messages = reviveMessages(state.messages);
    return state;
  } catch {
    return null;
  }
}

// Clear chat state (removes current conversation)
export function clearChatState(): void {
  if (!isBrowser()) return;

  const currentId = getConversationId();
  deleteConversation(currentId);
  localStorage.removeItem(CHAT_STORAGE_KEY);
  startNewConversation();
}

// Check if there's an active chat session
export function hasActiveChatSession(): boolean {
  if (!isBrowser()) return false;

  const state = loadChatState();
  if (!state) return false;

  const twentyFourHours = 24 * 60 * 60 * 1000;
  return Date.now() - state.updatedAt < twentyFourHours;
}
