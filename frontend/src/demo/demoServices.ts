import dayjs from "dayjs";
import {
  DEMO_USER,
  DEMO_CALENDAR_ITEMS,
} from "./demoData";
import {
  getDemoBrandProfile,
  getDemoCalendarItems,
  getDemoContacts,
  getDemoConversations,
  getDemoWhatsappConversations,
  seedDemoCalendarForCurrentMonth,
  setDemoCalendarItems,
  setDemoContacts,
  setDemoConversations,
  setDemoWhatsappConversations,
} from "./demoStorage";
import { CalendarItem } from "../services/calendarService";
import { ChatMessage, ChatResponse } from "../services/chatService";
import { Contact, SendMessageResponse, WhatsAppConversation } from "../services/messagingService";

const delay = async (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const demoAuth = {
  getCurrentUser: async () => {
    await delay(200);
    return { ...DEMO_USER, onboardingCompleted: false };
  },
  completeOnboarding: async (data: Record<string, unknown>) => {
    await delay(300);
    localStorage.setItem("melo_demo_onboarding_done", "true");
    return {
      success: true,
      user: { ...DEMO_USER, onboardingCompleted: true, ...data },
    };
  },
};

export const demoChat = {
  sendMessage: async (message: string): Promise<ChatResponse> => {
    await delay(400);
    const store = getDemoConversations();
    const convo = store.map[store.list[0].id];
    const newMessages: ChatMessage[] = [
      ...(convo?.messages || []),
      { role: "user", content: message, timestamp: new Date() },
      {
        role: "assistant",
        content:
          "Here is a warm, playful draft for Maya's cake shop. Want a 7-day plan?",
        timestamp: new Date(),
      },
    ];
    const updated = {
      ...convo,
      messages: newMessages,
      updatedAt: new Date().toISOString(),
    };
    store.map[updated.id] = updated;
    setDemoConversations(store);
    return { success: true, response: newMessages[newMessages.length - 1].content };
  },
  getConversations: async () => {
    await delay(200);
    const store = getDemoConversations();
    return { success: true, conversations: store.list, folders: [] };
  },
  getConversation: async (id: string) => {
    await delay(200);
    const store = getDemoConversations();
    return { success: true, conversation: store.map[id] };
  },
  generateImage: async () => {
    await delay(500);
    return {
      success: true,
      imageUrl: "/umiushi/うみうしモデル.8192/texture_00.png",
      conversationId: "demo-conv-1",
    };
  },
  generatePlan: async () => {
    await delay(600);
    return {
      success: true,
      plan: DEMO_CALENDAR_ITEMS.map((item) => ({
        date: item.date,
        time: item.time,
        platform: item.platform,
        title: item.title,
        content: item.content,
      })),
    };
  },
  sendToCalendar: async () => {
    await delay(400);
    const items = getDemoCalendarItems();
    setDemoCalendarItems(items);
    return { success: true, count: items.length };
  },
};

export const demoCalendar = {
  getCalendarItems: async () => {
    await delay(200);
    seedDemoCalendarForCurrentMonth();
    return { success: true, items: getDemoCalendarItems() };
  },
  updateCalendarItem: async (id: string, update: Partial<CalendarItem>) => {
    await delay(200);
    const items = getDemoCalendarItems();
    const updatedItems = items.map((item) =>
      item.id === id ? { ...item, ...update, updatedAt: new Date().toISOString() } : item
    );
    setDemoCalendarItems(updatedItems);
    return {
      success: true,
      item: updatedItems.find((item) => item.id === id),
    };
  },
  createCalendarItem: async (item: Omit<CalendarItem, "id" | "userId" | "createdAt" | "updatedAt">) => {
    await delay(200);
    const items = getDemoCalendarItems();
    const created: CalendarItem = {
      ...item,
      id: `demo-${Date.now()}`,
      userId: DEMO_USER.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...items, created];
    setDemoCalendarItems(updated);
    return { success: true, item: created };
  },
  deleteCalendarItem: async (id: string) => {
    await delay(200);
    const items = getDemoCalendarItems().filter((item) => item.id !== id);
    setDemoCalendarItems(items);
    return { success: true };
  },
};

export const demoAnalytics = async () => {
  await delay(300);
  const today = dayjs();
  return {
    success: true,
    analytics: {
      overview: {
        totalCalendarItems: 7,
        totalConversations: 3,
        totalCampaigns: 1,
        totalEvents: 7,
        totalPostsGenerated: 14,
        totalLinkedInPosts: 2,
        totalAIGeneratedContent: 12,
        totalMediaFiles: 6,
        publishedPosts: 3,
        scheduledPosts: 7,
        draftPosts: 4,
        totalPosts: {
          total: 14,
          published: 3,
          publishedText: "3 published this week",
        },
        scheduledItems: {
          total: 7,
          scheduled: 7,
          scheduledPct: "100% scheduled",
        },
        aiContentUtilization: {
          total: 12,
          used: 10,
          usagePct: "83% used",
        },
        totalAIWords: 8240,
        next7Days: DEMO_CALENDAR_ITEMS.map((item) => ({
          type: "calendar",
          id: item.id,
          title: item.title,
          platform: item.platform,
          date: item.date,
          time: item.time,
          status: item.status,
        })),
      },
      breakdown: {
        postsByPlatform: { instagram: 5, facebook: 4, twitter: 3, linkedin: 2 },
        postsByStatus: { draft: 4, scheduled: 7, published: 3 },
        aiContentByType: { text: 9, image: 3 },
      },
      recentActivity: Array.from({ length: 7 }).map((_, idx) => ({
        date: today.subtract(6 - idx, "day").format("YYYY-MM-DD"),
        posts: 2,
        conversations: 1,
        calendarItems: 1,
        events: 1,
        aiContent: 2,
        total: 7,
      })),
      timeSeries: {
        campaigns: [],
        events: [],
        calendarItems: [],
        conversations: [],
        posts: [],
        linkedInPosts: [],
        aiContent: [],
        mediaFiles: [],
      },
      upcomingWeekEvents: [],
      lastUpdated: new Date().toISOString(),
    },
  };
};

export const demoMessaging = {
  getContacts: async (): Promise<Contact[]> => {
    await delay(200);
    return getDemoContacts();
  },
  createContact: async (contact: Partial<Contact>): Promise<Contact> => {
    await delay(200);
    const contacts = getDemoContacts();
    const created = {
      ...contact,
      _id: `demo-contact-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Contact;
    const next = [...contacts, created];
    setDemoContacts(next);
    return created;
  },
  updateContact: async (id: string, contact: Partial<Contact>): Promise<Contact> => {
    await delay(200);
    const contacts = getDemoContacts();
    const next = contacts.map((c) =>
      c._id === id ? { ...c, ...contact, updatedAt: new Date().toISOString() } : c
    );
    setDemoContacts(next);
    return next.find((c) => c._id === id) as Contact;
  },
  deleteContact: async (id: string): Promise<void> => {
    await delay(200);
    const contacts = getDemoContacts().filter((c) => c._id !== id);
    setDemoContacts(contacts);
  },
  sendWhatsApp: async (): Promise<SendMessageResponse> => {
    await delay(300);
    return { success: true, messageSid: "demo-msg-1" };
  },
  sendSMS: async (): Promise<SendMessageResponse> => {
    await delay(300);
    return { success: true, messageSid: "demo-msg-2" };
  },
  sendMMS: async (): Promise<SendMessageResponse> => {
    await delay(300);
    return { success: true, messageSid: "demo-msg-3" };
  },
  getWhatsAppConversations: async (): Promise<WhatsAppConversation[]> => {
    await delay(200);
    return getDemoWhatsappConversations();
  },
};

export const demoBrandProfile = {
  getProfile: async () => {
    await delay(200);
    return getDemoBrandProfile();
  },
};
