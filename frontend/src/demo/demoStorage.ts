import dayjs from "dayjs";
import {
  DEMO_BRAND_PROFILE,
  DEMO_CALENDAR_ITEMS,
  DEMO_CONTACTS,
  DEMO_CONVERSATION,
  DEMO_CONVERSATION_LIST,
  DEMO_WHATSAPP_CONVERSATIONS,
} from "./demoData";
import { CalendarItem } from "../services/calendarService";
import { Conversation, ConversationListItem } from "../services/chatService";
import { Contact, WhatsAppConversation } from "../services/messagingService";

const CALENDAR_KEY = "melo_demo_calendar_items";
const CONVERSATIONS_KEY = "melo_demo_chat_conversations";
const CONTACTS_KEY = "melo_demo_contacts";
const WHATSAPP_KEY = "melo_demo_conversations";
const BRAND_KEY = "melo_demo_brand_profile";

const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const getDemoCalendarItems = (): CalendarItem[] => {
  const stored = safeParse<CalendarItem[] | null>(
    localStorage.getItem(CALENDAR_KEY),
    null
  );
  if (stored && stored.length > 0) return stored;
  localStorage.setItem(CALENDAR_KEY, JSON.stringify(DEMO_CALENDAR_ITEMS));
  return DEMO_CALENDAR_ITEMS;
};

export const setDemoCalendarItems = (items: CalendarItem[]): void => {
  localStorage.setItem(CALENDAR_KEY, JSON.stringify(items));
};

export const getDemoConversations = (): {
  list: ConversationListItem[];
  map: Record<string, Conversation>;
} => {
  const stored = safeParse<{
    list: ConversationListItem[];
    map: Record<string, Conversation>;
  } | null>(localStorage.getItem(CONVERSATIONS_KEY), null);
  if (stored && Array.isArray(stored.list) && stored.list.length > 0 && stored.map) {
    return stored;
  }
  const seed = {
    list: DEMO_CONVERSATION_LIST,
    map: {
      [DEMO_CONVERSATION.id]: DEMO_CONVERSATION,
    },
  };
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(seed));
  return seed;
};

export const setDemoConversations = (data: {
  list: ConversationListItem[];
  map: Record<string, Conversation>;
}): void => {
  localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(data));
};

export const getDemoContacts = (): Contact[] => {
  const stored = safeParse<Contact[] | null>(
    localStorage.getItem(CONTACTS_KEY),
    null
  );
  if (stored && stored.length > 0) return stored;
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(DEMO_CONTACTS));
  return DEMO_CONTACTS;
};

export const setDemoContacts = (contacts: Contact[]): void => {
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
};

export const getDemoWhatsappConversations = (): WhatsAppConversation[] => {
  const stored = safeParse<WhatsAppConversation[] | null>(
    localStorage.getItem(WHATSAPP_KEY),
    null
  );
  if (stored && stored.length > 0) return stored;
  localStorage.setItem(
    WHATSAPP_KEY,
    JSON.stringify(DEMO_WHATSAPP_CONVERSATIONS)
  );
  return DEMO_WHATSAPP_CONVERSATIONS;
};

export const setDemoWhatsappConversations = (
  conversations: WhatsAppConversation[]
): void => {
  localStorage.setItem(WHATSAPP_KEY, JSON.stringify(conversations));
};

export const getDemoBrandProfile = (): typeof DEMO_BRAND_PROFILE => {
  const stored = safeParse<typeof DEMO_BRAND_PROFILE | null>(
    localStorage.getItem(BRAND_KEY),
    null
  );
  if (stored) return stored;
  localStorage.setItem(BRAND_KEY, JSON.stringify(DEMO_BRAND_PROFILE));
  return DEMO_BRAND_PROFILE;
};

export const setDemoBrandProfile = (
  profile: typeof DEMO_BRAND_PROFILE
): void => {
  localStorage.setItem(BRAND_KEY, JSON.stringify(profile));
};

export const seedDemoCalendarForCurrentMonth = (): void => {
  const items = getDemoCalendarItems();
  const baseDate = dayjs().startOf("month").add(1, "day");
  const seeded = items.map((item, index) => ({
    ...item,
    date: baseDate.add(index + 2, "day").format("YYYY-MM-DD"),
  }));
  setDemoCalendarItems(seeded);
};
