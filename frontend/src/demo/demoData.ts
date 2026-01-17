import dayjs from "dayjs";
import { CalendarItem } from "../services/calendarService";
import { ChatMessage, Conversation, ConversationListItem } from "../services/chatService";
import { Contact, WhatsAppConversation } from "../services/messagingService";

export const DEMO_USER = {
  id: "demo-maya",
  email: "maya@cakeshop.demo",
  name: "Maya",
  onboardingCompleted: false,
};

const baseDate = dayjs().startOf("month").add(1, "day");

export const DEMO_CALENDAR_ITEMS: CalendarItem[] = [
  {
    id: "demo-cal-1",
    userId: DEMO_USER.id,
    campaignId: null,
    campaignName: "Valentine 7-day",
    platform: "instagram",
    date: baseDate.add(2, "day").format("YYYY-MM-DD"),
    time: "10:00",
    title: "Strawberry Cream Launch",
    content: "Warm, playful launch post with CTA for in-store pre-order.",
    imageUrl: "/mendako/めんだこモデル.8192/texture_00.png",
    status: "draft",
    createdAt: baseDate.toISOString(),
    updatedAt: baseDate.toISOString(),
  },
  {
    id: "demo-cal-2",
    userId: DEMO_USER.id,
    campaignId: null,
    campaignName: "Valentine 7-day",
    platform: "facebook",
    date: baseDate.add(3, "day").format("YYYY-MM-DD"),
    time: "14:00",
    title: "Couple Bundle Promo",
    content: "Bundle deal post, includes customizable message card.",
    imageUrl: "/kurage/クラゲモデル.8192/texture_00.png",
    status: "draft",
    createdAt: baseDate.toISOString(),
    updatedAt: baseDate.toISOString(),
  },
  {
    id: "demo-cal-3",
    userId: DEMO_USER.id,
    campaignId: null,
    campaignName: "Valentine 7-day",
    platform: "twitter",
    date: baseDate.add(4, "day").format("YYYY-MM-DD"),
    time: "18:00",
    title: "Behind the Scenes",
    content: "Short BTS clip showing fresh bake process.",
    imageUrl: "/kurione/クリオネモデル.8192/texture_00.png",
    status: "draft",
    createdAt: baseDate.toISOString(),
    updatedAt: baseDate.toISOString(),
  },
];

export const DEMO_MESSAGES: ChatMessage[] = [
  {
    role: "user",
    content:
      "I want a 7-day Valentine's campaign for my cake shop. Warm and playful tone.",
    timestamp: new Date(),
  },
  {
    role: "assistant",
    content:
      "Great! I'll generate a 7-day plan focusing on strawberry cream cake and pre-orders.",
    timestamp: new Date(),
  },
];

export const DEMO_CONVERSATION: Conversation = {
  id: "demo-conv-1",
  title: "Valentine Campaign",
  messages: DEMO_MESSAGES,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const DEMO_CONVERSATION_LIST: ConversationListItem[] = [
  {
    id: DEMO_CONVERSATION.id,
    title: DEMO_CONVERSATION.title,
    createdAt: DEMO_CONVERSATION.createdAt,
    updatedAt: DEMO_CONVERSATION.updatedAt,
  },
];

export const DEMO_CONTACTS: Contact[] = [
  {
    _id: "demo-contact-1",
    name: "Lina Park",
    phoneNumber: "+1 555 010 201",
    email: "lina@example.com",
    notes: "Wedding cake inquiry",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEMO_WHATSAPP_CONVERSATIONS: WhatsAppConversation[] = [
  {
    phoneNumber: "+1 555 010 201",
    messageCount: 2,
    lastMessageAt: new Date().toISOString(),
    messages: [
      {
        _id: "demo-wh-1",
        content: "Hi! Can I customize a message on the cake?",
        createdAt: new Date().toISOString(),
        postType: "text",
        direction: "incoming",
      },
      {
        _id: "demo-wh-2",
        content: "Absolutely! We can add a short message card and frosting text.",
        createdAt: new Date().toISOString(),
        postType: "text",
        direction: "outgoing",
      },
    ],
  },
];

export const DEMO_BRAND_PROFILE = {
  brandName: "Maya's Cake Studio",
  industry: "food",
  toneOfVoice: "warm",
  customTone: "",
  targetAudience: ["Couples", "Office workers", "Nearby residents"],
  knowledgeProducts: ["Strawberry cream cake", "Custom message cards"],
  companyDescription:
    "A neighborhood cake studio focused on warm, playful desserts and quick pre-orders.",
  productTypes: ["Food & Beverage"],
  productImages: [],
  meloGoals: ["Boost Valentine pre-orders", "Increase repeat customers"],
};
