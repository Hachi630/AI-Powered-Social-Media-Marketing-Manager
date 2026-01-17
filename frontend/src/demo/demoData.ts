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
    date: "2026-02-08",
    time: "09:00",
    title: 'Day 1: "Love is in the Oven" Launch',
    content: "Love is in the air... and in the oven! ❤️✨ We are officially kicking off Valentine's Week at Maya's Cake Studio! Whether you need a treat for your boo, your bestie, or just you (we don't judge!), we've got the goods. Swipe to see our limited-time Valentine's menu featuring heart-shaped brownies and rose-swirl cupcakes! 🌹🍫 Pre-order link in bio before we sell out!",
    imageUrl: "/img/i2.jpg",
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
    date: "2026-02-09",
    time: "10:00",
    title: 'Day 2: "School Crush & Lunchbox Love"',
    content: "Pack a little extra love in their lunchbox this week! 💌 Our decorated sugar cookies and brownie bites are the perfect surprise for the kids—or that campus crush you've been eyeing in the library. 😉 Grab a box of 6 or 12 today! Tag a parent (or a crush) who needs a hint!",
    imageUrl: "/img/i2.jpg",
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
    date: "2026-02-10",
    time: "14:00",
    title: "Day 3: Galentine's Day Prep",
    content: "Who needs a date when you have cake? 👯‍♀️💕 Ladies, get ready for Galentine's! We're talking dessert tables filled with pink velvet cupcakes and gooey brownies for your girls' night in. Because best friends are the real soulmates. Order a 'Bestie Box' for pickup!",
    imageUrl: "/img/i2.jpg",
    status: "draft",
    createdAt: baseDate.toISOString(),
    updatedAt: baseDate.toISOString(),
  },
  {
    id: "demo-cal-4",
    userId: DEMO_USER.id,
    campaignId: null,
    campaignName: "Valentine 7-day",
    platform: "linkedin",
    date: "2026-02-11",
    time: "11:00",
    title: 'Day 4: The "Grand Gesture"',
    content: "Flowers are nice, but have you ever tried cake? 🎂👀 If you really want to wow them this year, skip the drugstore chocolates and go for one of our custom Mini Cakes (Bento Cakes). Small enough to share, sweet enough to say 'I love you' perfectly. Only a few custom slots left! Message us to claim yours.",
    imageUrl: "/img/i2.jpg",
    status: "draft",
    createdAt: baseDate.toISOString(),
    updatedAt: baseDate.toISOString(),
  },
  {
    id: "demo-cal-5",
    userId: DEMO_USER.id,
    campaignId: null,
    campaignName: "Valentine 7-day",
    platform: "instagram",
    date: "2026-02-12",
    time: "16:00",
    title: 'Day 5: The "Don\'t Panic!" Reminder',
    content: "48 Hours to go! ⏰ This is your friendly reminder from Maya's Cake Studio: Don't show up empty-handed! We still have a few cupcake assortments and cookie boxes available for pre-order. Be the hero of Valentine's Day. 🦸‍♂️🦸‍♀️ Click the link in bio to secure the goods!",
    imageUrl: "/img/i2.jpg",
    status: "draft",
    createdAt: baseDate.toISOString(),
    updatedAt: baseDate.toISOString(),
  },
  {
    id: "demo-cal-6",
    userId: DEMO_USER.id,
    campaignId: null,
    campaignName: "Valentine 7-day",
    platform: "facebook",
    date: "2026-02-13",
    time: "12:00",
    title: "Day 6: Galentine's / Self-Love Celebration",
    content: "Happy Galentine's Day! 🥂 Whether you're celebrating with the squad or having a cozy night in, you deserve a treat. Stop by the studio today to grab a single cupcake or a fudgy brownie just for you. Treat yourself—you've earned it! Open until 8PM for walk-ins!",
    imageUrl: "/img/i2.jpg",
    status: "draft",
    createdAt: baseDate.toISOString(),
    updatedAt: baseDate.toISOString(),
  },
  {
    id: "demo-cal-7",
    userId: DEMO_USER.id,
    campaignId: null,
    campaignName: "Valentine 7-day",
    platform: "instagram",
    date: "2026-02-14",
    time: "08:00",
    title: "Day 7: The Big Day!",
    content: "Happy Valentine's Day from the whole team at Maya's Cake Studio! ❤️🧁 We are feeling the love today! We have a few extra sweets in the case for last-minute gifters, but hurry in before they vanish. Thank you for letting us be a small part of your love stories! Come say hi! We're open until sold out!",
    imageUrl: "/img/i2.jpg",
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
