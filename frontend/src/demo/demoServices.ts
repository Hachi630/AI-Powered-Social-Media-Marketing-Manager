import dayjs from "dayjs";
import {
  DEMO_USER,
  DEMO_CALENDAR_ITEMS,
} from "./demoData";
// Import demo image for proper bundling
import demoGeneratedImage from "/img/i2.jpg?url";
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
    // Check if onboarding is completed (either from modal or from demo step)
    const onboardingCompleted =
      localStorage.getItem("melo_demo_onboarding_done") === "true" ||
      localStorage.getItem("melo_demo_onboarding_completed") === "true";
    return { ...DEMO_USER, onboardingCompleted };
  },
  completeOnboarding: async (data: Record<string, unknown>) => {
    await delay(300);
    localStorage.setItem("melo_demo_onboarding_done", "true");
    localStorage.setItem("melo_demo_onboarding_completed", "true");
    return {
      success: true,
      user: { ...DEMO_USER, onboardingCompleted: true, ...data },
    };
  },
};

// Full 7-day Valentine campaign plan for demo
const DEMO_CAMPAIGN_PLAN = `Hello! I would love to help you whip up a sweet and successful Valentine's campaign for Maya's Cake Studio. 🧁

Since our audience ranges from students looking for a sweet treat to partners looking for a romantic gesture, I've designed this **7-Day "Love is Sweet" Campaign** to cover all bases—romantic love, friendship, family, and self-love.

Here is a ready-to-use plan that highlights our cookies, brownies, cupcakes, and custom cakes with a warm, playful vibe.

📅 **Campaign Title:** 7 Days of Sweetness

Timeline: February 8th – February 14th

**Day 1: The "Love is in the Oven" Tease (Feb 8)**

• **Focus:** Launching the Valentine's Menu & Pre-orders.
• **Target Audience:** Everyone.
• **Caption:** "Love is in the air... and in the oven! ❤️✨ We are officially kicking off Valentine's Week at Maya's Cake Studio! Whether you need a treat for your boo, your bestie, or just you (we don't judge!), we've got the goods. Swipe to see our limited-time Valentine's menu featuring heart-shaped brownies and rose-swirl cupcakes! 🌹🍫"
• **Visual:** A flat-lay photo of the full Valentine's collection.
• **CTA:** "Pre-order link in bio before we sell out!"

**Day 2: The "School Crush & Lunchbox Love" (Feb 9)**

• **Focus:** Cookies and Brownies.
• **Target Audience:** Parents and Students.
• **Caption:** "Pack a little extra love in their lunchbox this week! 💌 Our decorated sugar cookies and brownie bites are the perfect surprise for the kids—or that campus crush you've been eyeing in the library. 😉 grab a box of 6 or 12 today!"
• **Visual:** A cute video of a child or student opening a box to find a heart-shaped cookie.
• **CTA:** "Tag a parent (or a crush) who needs a hint!"

**Day 3: Galentine's Day Prep (Feb 10)**

• **Focus:** Cupcakes and Dessert Tables.
• **Target Audience:** Women / Friends.
• **Caption:** "Who needs a date when you have cake? 👯‍♀️💕 Ladies, get ready for Galentine's! We're talking dessert tables filled with pink velvet cupcakes and gooey brownies for your girls' night in. Because best friends are the real soulmates."
• **Visual:** A photo of a group of friends laughing while holding cupcakes.
• **CTA:** "Order a 'Bestie Box' for pickup!"

**Day 4: The "Grand Gesture" (Feb 11)**

• **Focus:** Custom Celebration Cakes / Mini Cakes.
• **Target Audience:** Men / Partners.
• **Caption:** "Flowers are nice, but have you ever tried cake? 🎂👀 If you really want to wow them this year, skip the drugstore chocolates and go for one of our custom Mini Cakes (Bento Cakes). Small enough to share, sweet enough to say 'I love you' perfectly."
• **Visual:** Close up of a Bento cake with "Be Mine" written in icing.
• **CTA:** "Only a few custom slots left! Message us to claim yours."

**Day 5: The "Don't Panic!" Reminder (Feb 12)**

• **Focus:** Urgency / All Products.
• **Target Audience:** Last-minute shoppers.
• **Caption:** "48 Hours to go! ⏰ This is your friendly reminder from Maya's Cake Studio: Don't show up empty-handed! We still have a few cupcake assortments and cookie boxes available for pre-order. Be the hero of Valentine's Day. 🦸‍♂️🦸‍♀️"
• **Visual:** An aesthetic shot of a packed bakery box being tied with a red ribbon.
• **CTA:** "Click the link in bio to secure the goods!"

**Day 6: Galentine's / Self-Love Celebration (Feb 13)**

• **Focus:** Single Cupcakes / Brownies.
• **Target Audience:** Students / Singles.
• **Caption:** "Happy Galentine's Day! 🥂 Whether you're celebrating with the squad or having a cozy night in, you deserve a treat. Stop by the studio today to grab a single cupcake or a fudgy brownie just for you. Treat yourself—you've earned it!"
• **Visual:** A boomerang video of a fork diving into a slice of cake.
• **CTA:** "Open until [Time] for walk-ins!"

**Day 7: The Big Day! (Feb 14)**

• **Focus:** Community Love / Walk-ins.
• **Target Audience:** Everyone.
• **Caption:** "Happy Valentine's Day from the whole team at Maya's Cake Studio! ❤️🧁 We are feeling the love today! We have a few extra sweets in the case for last-minute gifters, but hurry in before they vanish. Thank you for letting us be a small part of your love stories!"
• **Visual:** A smiling photo of the team holding a tray of Valentine's treats.
• **CTA:** "Come say hi! We're open until sold out!"

🎨 **Visual Tip for the Week:**
Keep the colors warm—lots of pinks, reds, whites, and chocolates. Since our tone is playful, don't be afraid to use fun props like heart-shaped sunglasses or confetti in your photos!

How does this schedule look to you? I can tweak any of the days if you want to focus more on a specific product like wedding tastings! 🍰`;

export const demoChat = {
  sendMessage: async (message: string): Promise<ChatResponse> => {
    await delay(400);
    const store = getDemoConversations();
    const convo = store.map[store.list[0].id];
    
    // Check if message is about Valentine campaign
    const isValentineCampaign = message.toLowerCase().includes('valentine') && 
                                 (message.toLowerCase().includes('campaign') || 
                                  message.toLowerCase().includes('7-day') ||
                                  message.toLowerCase().includes('7 day'));
    
    const assistantResponse = isValentineCampaign 
      ? DEMO_CAMPAIGN_PLAN
      : "Here is a warm, playful draft for Maya's cake shop. Want a 7-day plan?";
    
    const newMessages: ChatMessage[] = [
      ...(convo?.messages || []),
      { role: "user", content: message, timestamp: new Date() },
      {
        role: "assistant",
        content: assistantResponse,
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
    return { success: true, response: assistantResponse };
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
      imageUrl: demoGeneratedImage,
      conversationId: "demo-conv-1",
    };
  },
  generatePlan: async () => {
    await delay(600);
    // Generate a comprehensive 7-day Valentine campaign plan
    const plan = [
      // Day 1 - Feb 8
      {
        date: "2026-02-08",
        time: "09:00",
        platform: "instagram",
        title: 'Day 1: "Love is in the Oven" Launch',
        content: "Love is in the air... and in the oven! ❤️✨ We are officially kicking off Valentine's Week at Maya's Cake Studio! Whether you need a treat for your boo, your bestie, or just you (we don't judge!), we've got the goods. Swipe to see our limited-time Valentine's menu featuring heart-shaped brownies and rose-swirl cupcakes! 🌹🍫 Pre-order link in bio before we sell out!",
      },
      {
        date: "2026-02-09",
        time: "10:00",
        platform: "facebook",
        title: 'Day 2: "School Crush & Lunchbox Love"',
        content: "Pack a little extra love in their lunchbox this week! 💌 Our decorated sugar cookies and brownie bites are the perfect surprise for the kids—or that campus crush you've been eyeing in the library. 😉 Grab a box of 6 or 12 today! Tag a parent (or a crush) who needs a hint!",
      },
      {
        date: "2026-02-10",
        time: "14:00",
        platform: "twitter",
        title: "Day 3: Galentine's Day Prep",
        content: "Who needs a date when you have cake? 👯‍♀️💕 Ladies, get ready for Galentine's! We're talking dessert tables filled with pink velvet cupcakes and gooey brownies for your girls' night in. Because best friends are the real soulmates. Order a 'Bestie Box' for pickup!",
      },
      {
        date: "2026-02-11",
        time: "11:00",
        platform: "linkedin",
        title: 'Day 4: The "Grand Gesture"',
        content: "Flowers are nice, but have you ever tried cake? 🎂👀 If you really want to wow them this year, skip the drugstore chocolates and go for one of our custom Mini Cakes (Bento Cakes). Small enough to share, sweet enough to say 'I love you' perfectly. Only a few custom slots left! Message us to claim yours.",
      },
      {
        date: "2026-02-12",
        time: "16:00",
        platform: "instagram",
        title: 'Day 5: The "Don\'t Panic!" Reminder',
        content: "48 Hours to go! ⏰ This is your friendly reminder from Maya's Cake Studio: Don't show up empty-handed! We still have a few cupcake assortments and cookie boxes available for pre-order. Be the hero of Valentine's Day. 🦸‍♂️🦸‍♀️ Click the link in bio to secure the goods!",
      },
      {
        date: "2026-02-13",
        time: "12:00",
        platform: "facebook",
        title: "Day 6: Galentine's / Self-Love Celebration",
        content: "Happy Galentine's Day! 🥂 Whether you're celebrating with the squad or having a cozy night in, you deserve a treat. Stop by the studio today to grab a single cupcake or a fudgy brownie just for you. Treat yourself—you've earned it! Open until 8PM for walk-ins!",
      },
      {
        date: "2026-02-14",
        time: "08:00",
        platform: "instagram",
        title: "Day 7: The Big Day!",
        content: "Happy Valentine's Day from the whole team at Maya's Cake Studio! ❤️🧁 We are feeling the love today! We have a few extra sweets in the case for last-minute gifters, but hurry in before they vanish. Thank you for letting us be a small part of your love stories! Come say hi! We're open until sold out!",
      },
    ];

    return {
      success: true,
      plan,
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
          type: "calendar" as const,
          id: item.id,
          title: item.title,
          platform: item.platform,
          date: item.date,
          time: item.time,
          status: item.status,
        })),
        bestPostingTimes: {
          instagram: "10:00 AM - 11:00 AM (Weekdays)",
          facebook: "1:00 PM - 3:00 PM (Wed-Fri)",
          twitter: "12:00 PM - 1:00 PM (Mon-Fri)",
          overall: "10:00 AM - 11:00 AM (Tuesday & Thursday)"
        },
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
