import { useState } from "react";
import styles from "./MiniDemo.module.css";

type Tab = "dashboard" | "calendar" | "social";

interface Suggestion {
  id: string;
  text: string;
  platform: "linkedin" | "instagram" | "twitter";
  meta: string;
}

const SUGGESTIONS: Suggestion[] = [
  {
    id: "li",
    platform: "linkedin",
    text: "Write a LinkedIn post about hybrid retrieval",
    meta: "LinkedIn · ~180 words",
  },
  {
    id: "ig",
    platform: "instagram",
    text: "Plan a 7-day Instagram campaign for our spring launch",
    meta: "Instagram · 7 posts",
  },
  {
    id: "tw",
    platform: "twitter",
    text: "Draft a tweet thread on RAG architectures",
    meta: "X · 4 tweets",
  },
];

const FAKE_RESPONSES: Record<string, string> = {
  li: `Spent the weekend on hybrid retrieval. Pairing pgvector with full-text search made my embedding-only setup feel a lot smarter on queries like exact product names.

The funny part is how often the boring layer wins. Embeddings alone miss "SKU-2049" every time. Adding plain keyword matching costs almost nothing and recovers those queries instantly.

Different problems want different tools. Sometimes the unfashionable one earns its keep.

#rag #pgvector #postgres #OpenToWork`,
  ig: `Day 1 — Hero post: "New Spring Drop is here."
Day 2 — Behind-the-scenes reel from the studio.
Day 3 — Designer Q&A carousel.
Day 4 — Customer styling photo with our top tee.
Day 5 — Limited-edition reveal teaser.
Day 6 — Influencer collab unboxing.
Day 7 — Last-day reminder + thank-you note.`,
  tw: `1/ Most RAG setups stop at "embed → cosine". The interesting work starts after.

2/ Late-interaction models keep token-level signal alive at query time. Recall jumps on multi-hop questions hard to ignore.

3/ The infra cost is real. Memory-mapped storage and specialized engines like PLAID are the boring tax you pay for that quality.

4/ My take: start with hybrid (BM25 + dense), then move to late-interaction only when your evals say you need it.`,
};

const PLATFORM_BADGE: Record<Suggestion["platform"], { label: string; bg: string; fg: string }> = {
  linkedin: { label: "in", bg: "#0a66c2", fg: "#ffffff" },
  instagram: { label: "ig", bg: "linear-gradient(135deg,#f58529,#dd2a7b,#8134af)", fg: "#ffffff" },
  twitter: { label: "x", bg: "#000000", fg: "#ffffff" },
};

const CHAT_HISTORY = [
  { id: 1, title: "Hybrid retrieval post for LinkedIn", time: "2m", active: true },
  { id: 2, title: "Spring campaign — 7 day plan", time: "1h" },
  { id: 3, title: "Brand voice for casual tone", time: "Yesterday" },
  { id: 4, title: "Q4 launch calendar", time: "3d" },
  { id: 5, title: "Image: minimalist product shot", time: "5d" },
];

interface CalEvent {
  time: string;
  platform: Suggestion["platform"];
  title: string;
  status: "published" | "scheduled";
}

const CAL_EVENTS: Record<number, CalEvent[]> = {
  6: [{ time: "9:00", platform: "linkedin", title: "Hybrid retrieval post", status: "published" }],
  8: [{ time: "14:30", platform: "instagram", title: "Behind-the-scenes reel", status: "published" }],
  10: [{ time: "10:00", platform: "twitter", title: "RAG thread", status: "published" }],
  11: [{ time: "9:00", platform: "linkedin", title: "Vector search lessons", status: "scheduled" }],
  13: [
    { time: "9:00", platform: "linkedin", title: "Weekly project update", status: "scheduled" },
    { time: "15:00", platform: "instagram", title: "Q&A reel", status: "scheduled" },
  ],
  16: [{ time: "12:00", platform: "twitter", title: "Saturday recap thread", status: "scheduled" }],
  18: [{ time: "9:00", platform: "linkedin", title: "Hiring update", status: "scheduled" }],
};

const RECENT_POSTS = [
  {
    id: "r1",
    platform: "linkedin" as const,
    time: "Sat · 9:00 AM",
    preview: "Spent the weekend on hybrid retrieval. Pairing pgvector with full-text search…",
    status: "published" as const,
    metric: "23 reactions · 4 comments",
  },
  {
    id: "r2",
    platform: "instagram" as const,
    time: "Wed · 2:30 PM",
    preview: "Behind the scenes of our spring shoot — the floor was lava…",
    status: "published" as const,
    metric: "84 likes",
  },
  {
    id: "r3",
    platform: "twitter" as const,
    time: "Mon · 10:00 AM",
    preview: "1/ Most RAG setups stop at 'embed → cosine'. The interesting work…",
    status: "scheduled" as const,
    metric: "Scheduled for tomorrow",
  },
];

function PlatformBadge({ p, size = 22 }: { p: Suggestion["platform"]; size?: number }) {
  const cfg = PLATFORM_BADGE[p];
  return (
    <span
      className={styles.platformBadge}
      style={{
        background: cfg.bg,
        color: cfg.fg,
        width: size,
        height: size,
        fontSize: size <= 22 ? 11 : 13,
      }}
    >
      {cfg.label}
    </span>
  );
}

export default function MiniDemo() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [activeSuggestion, setActiveSuggestion] = useState<Suggestion | null>(null);
  const [typing, setTyping] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [posted, setPosted] = useState(false);

  const submitPrompt = (s: Suggestion) => {
    setActiveSuggestion(s);
    setShowResponse(false);
    setTyping(true);
    window.setTimeout(() => {
      setTyping(false);
      setShowResponse(true);
    }, 1100);
  };

  const reset = () => {
    setActiveSuggestion(null);
    setShowResponse(false);
    setTyping(false);
  };

  const handlePost = () => {
    if (posted) return;
    setPosted(true);
    window.setTimeout(() => setPosted(false), 2400);
  };

  return (
    <div className={styles.frame}>
      {/* Browser chrome */}
      <div className={styles.bar}>
        <span className={styles.dot} style={{ background: "#ff5f57" }} />
        <span className={styles.dot} style={{ background: "#febc2e" }} />
        <span className={styles.dot} style={{ background: "#28c840" }} />
        <span className={styles.barArrows}>‹ ›</span>
        <span className={styles.url}>app.melo.ai{tab !== "dashboard" ? `/${tab}` : ""}</span>
      </div>

      {/* Top nav */}
      <div className={styles.nav}>
        <span className={styles.logo}>Melo</span>
        <div className={styles.tabs} role="tablist">
          {([
            { key: "dashboard", label: "Dashboard" },
            { key: "calendar", label: "Calendar" },
            { key: "social", label: "Social" },
          ] as { key: Tab; label: string }[]).map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={tab === t.key ? styles.tabActive : styles.tab}
              onClick={() => {
                setTab(t.key);
                if (t.key !== "dashboard") reset();
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <span className={styles.avatar} />
      </div>

      {/* Body */}
      <div className={styles.body}>
        {tab === "dashboard" && (
          <div className={styles.dashboardLayout}>
            <aside className={styles.sidebar}>
              <div className={styles.sidebarHeader}>
                <span>Chats</span>
                <span className={styles.sidebarPlus}>+</span>
              </div>
              {CHAT_HISTORY.map((c) => (
                <div
                  key={c.id}
                  className={c.active ? styles.chatItemActive : styles.chatItem}
                >
                  <div className={styles.chatItemTitle}>{c.title}</div>
                  <div className={styles.chatItemTime}>{c.time}</div>
                </div>
              ))}
            </aside>

            <main className={styles.main}>
              <div
                className={styles.chatInput}
                onClick={() => activeSuggestion && reset()}
              >
                <span className={styles.plus}>+</span>
                <span className={activeSuggestion ? styles.value : styles.placeholder}>
                  {activeSuggestion?.text || "What would you like to know?"}
                </span>
                <span className={styles.send}>↑</span>
              </div>

              {!activeSuggestion && (
                <>
                  <div className={styles.suggestionsLabel}>Try one of these</div>
                  <div className={styles.suggestions}>
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={styles.suggestion}
                        onClick={() => submitPrompt(s)}
                      >
                        <PlatformBadge p={s.platform} />
                        <div className={styles.suggestionBody}>
                          <div className={styles.suggestionText}>{s.text}</div>
                          <div className={styles.suggestionMeta}>{s.meta}</div>
                        </div>
                        <span className={styles.suggestionArrow}>↑</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {typing && (
                <div className={styles.thinking}>
                  <span className={styles.thinkingDot} />
                  <span className={styles.thinkingDot} />
                  <span className={styles.thinkingDot} />
                  <span className={styles.thinkingLabel}>Melo is drafting your post…</span>
                </div>
              )}

              {showResponse && activeSuggestion && !typing && (
                <div className={styles.response}>
                  <div className={styles.responseHeader}>
                    <span className={styles.responseAvatar} />
                    <div className={styles.responseMeta}>
                      <div className={styles.responseName}>Melo</div>
                      <div className={styles.responseSub}>
                        <PlatformBadge p={activeSuggestion.platform} size={14} />
                        <span>Just now · ~12s</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.responseBody}>
                    {FAKE_RESPONSES[activeSuggestion.id]}
                  </div>
                  <div className={styles.responseActions}>
                    <button type="button" className={styles.actionGhost}>
                      ⎘ Copy
                    </button>
                    <button type="button" className={styles.actionGhost}>
                      🗓 Save to calendar
                    </button>
                    <button type="button" className={styles.actionPrimary}>
                      Post now →
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}

        {tab === "calendar" && (
          <div className={styles.calendar}>
            <div className={styles.calHead}>
              <div>
                <div className={styles.calMonth}>January 2026</div>
                <div className={styles.calHint}>21 posts scheduled this month</div>
              </div>
              <div className={styles.calControls}>
                <button type="button" className={styles.calNav}>‹</button>
                <button type="button" className={styles.calToday}>Today</button>
                <button type="button" className={styles.calNav}>›</button>
              </div>
            </div>
            <div className={styles.calWeek}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className={styles.calWeekday}>{d}</div>
              ))}
            </div>
            <div className={styles.calGrid}>
              {Array.from({ length: 14 }, (_, i) => i + 6).map((day) => (
                <div key={day} className={styles.calCell}>
                  <span className={styles.calDay}>{day}</span>
                  {(CAL_EVENTS[day] || []).map((ev, i) => (
                    <div
                      key={i}
                      className={
                        ev.status === "published"
                          ? styles.calEventPublished
                          : styles.calEventScheduled
                      }
                    >
                      <PlatformBadge p={ev.platform} size={14} />
                      <span className={styles.calEventTime}>{ev.time}</span>
                      <span className={styles.calEventTitle}>{ev.title}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "social" && (
          <div className={styles.social}>
            <div className={styles.socialStats}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>12</div>
                <div className={styles.statLabel}>posts this month</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>+47</div>
                <div className={styles.statLabel}>new followers</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>3.2k</div>
                <div className={styles.statLabel}>impressions</div>
              </div>
            </div>

            <div className={styles.socialCards}>
              <div className={styles.socialCard}>
                <PlatformBadge p="linkedin" size={36} />
                <div className={styles.socialBody}>
                  <div className={styles.socialName}>LinkedIn</div>
                  <div className={styles.socialMeta}>Connected · Auto-publish on</div>
                </div>
                <span className={styles.socialBadge}>● Live</span>
              </div>
              <div className={styles.socialCard}>
                <PlatformBadge p="instagram" size={36} />
                <div className={styles.socialBody}>
                  <div className={styles.socialName}>Instagram</div>
                  <div className={styles.socialMeta}>Connected · Auto-publish on</div>
                </div>
                <span className={styles.socialBadge}>● Live</span>
              </div>
              <div className={styles.socialCard}>
                <PlatformBadge p="twitter" size={36} />
                <div className={styles.socialBody}>
                  <div className={styles.socialName}>X (Twitter)</div>
                  <div className={styles.socialMeta}>Connected · Manual review</div>
                </div>
                <span className={styles.socialBadgeIdle}>○ Paused</span>
              </div>
            </div>

            <div className={styles.recent}>
              <div className={styles.recentTitle}>Recent posts</div>
              {RECENT_POSTS.map((p) => (
                <div key={p.id} className={styles.recentItem}>
                  <PlatformBadge p={p.platform} size={24} />
                  <div className={styles.recentBody}>
                    <div className={styles.recentMeta}>
                      <span>{p.time}</span>
                      <span className={p.status === "published" ? styles.dotPub : styles.dotSched}>
                        {p.status === "published" ? "✓ Published" : "⏱ Scheduled"}
                      </span>
                    </div>
                    <div className={styles.recentPreview}>{p.preview}</div>
                    <div className={styles.recentMetric}>{p.metric}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className={posted ? styles.postBtnPosted : styles.postBtn}
              onClick={handlePost}
            >
              {posted ? "✓ Scheduled for Mon 09:00" : "+ Schedule new recurring post"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
