import { useState } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Bell,
  CreditCard,
  Home,
  PieChart,
  Plus,
  Send,
  Settings,
  TrendingUp,
} from "lucide-react";

const transactions = [
  {
    id: 1,
    name: "Figma Pro",
    category: "Software",
    amount: -15.0,
    date: "Today, 9:41 AM",
    icon: "🎨",
  },
  {
    id: 2,
    name: "Stripe payout",
    category: "Income",
    amount: +2400.0,
    date: "Yesterday, 3:12 PM",
    icon: "💳",
  },
  {
    id: 3,
    name: "Linear",
    category: "Software",
    amount: -8.0,
    date: "Jun 30, 11:00 AM",
    icon: "🔷",
  },
  {
    id: 4,
    name: "Vercel",
    category: "Infrastructure",
    amount: -20.0,
    date: "Jun 29, 8:00 AM",
    icon: "▲",
  },
  {
    id: 5,
    name: "Client invoice",
    category: "Income",
    amount: +6000.0,
    date: "Jun 28, 2:45 PM",
    icon: "📄",
  },
];

const quickActions = [
  { label: "Send", icon: Send },
  { label: "Request", icon: ArrowDownLeft },
  { label: "Top up", icon: Plus },
  { label: "More", icon: Settings },
];

type Tab = "home" | "cards" | "analytics" | "settings";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [notifDot] = useState(true);

  return (
    <div
      className="min-h-screen flex items-start justify-center bg-[#EDEEF2] py-10"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Phone frame */}
      <div
        className="relative bg-background rounded-[40px] overflow-hidden flex flex-col"
        style={{
          width: 390,
          minHeight: 844,
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-8 pt-5 pb-1">
          <span className="text-[13px] font-semibold text-foreground tracking-tight">
            9:41
          </span>
          <div className="flex items-center gap-[5px]">
            <span className="text-[10px] text-foreground opacity-70">●●●</span>
            <span className="text-[10px] text-foreground opacity-70">WiFi</span>
            <span className="text-[10px] text-foreground opacity-70">
              100%
            </span>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 pb-28">
          {/* Header */}
          <div className="flex items-center justify-between mt-4 mb-8">
            <div>
              <p className="text-[13px] font-medium text-muted-foreground tracking-wide uppercase">
                Good morning
              </p>
              <h1 className="text-[26px] font-bold text-foreground leading-tight mt-0.5">
                Marcus Lee
              </h1>
            </div>
            <div className="relative">
              <button className="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center transition-colors hover:bg-muted">
                <Bell size={18} className="text-foreground" strokeWidth={1.75} />
              </button>
              {notifDot && (
                <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-primary border-2 border-background" />
              )}
            </div>
          </div>

          {/* Balance card */}
          <div
            className="rounded-2xl p-7 mb-6 relative overflow-hidden"
            style={{ background: "#1A1A2E" }}
          >
            {/* Subtle gradient orb */}
            <div
              className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, #4B6BFB, transparent)" }}
            />
            <p className="text-[12px] font-medium text-white/50 tracking-widest uppercase mb-1">
              Total Balance
            </p>
            <p className="text-[40px] font-bold text-white leading-none tracking-tight mb-1">
              $24,810
              <span className="text-[24px] font-medium text-white/40">.52</span>
            </p>
            <div className="flex items-center gap-1.5 mt-3">
              <span className="flex items-center gap-1 text-[13px] font-medium text-emerald-400">
                <TrendingUp size={13} strokeWidth={2.5} />
                +8.4%
              </span>
              <span className="text-[13px] text-white/40">vs last month</span>
            </div>

            {/* Card chip detail */}
            <div className="flex items-center justify-between mt-7 pt-5 border-t border-white/10">
              <span className="text-[13px] text-white/40 font-medium tracking-widest">
                •••• •••• •••• 4291
              </span>
              <span className="text-[13px] text-white/40 font-medium">
                07 / 28
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <ArrowUpRight size={14} className="text-emerald-600" strokeWidth={2.5} />
                </span>
                <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                  Income
                </span>
              </div>
              <p className="text-[22px] font-bold text-foreground leading-none">
                $8,400
              </p>
              <p className="text-[12px] text-muted-foreground mt-1.5">
                This month
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center">
                  <ArrowDownLeft size={14} className="text-rose-500" strokeWidth={2.5} />
                </span>
                <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
                  Spent
                </span>
              </div>
              <p className="text-[22px] font-bold text-foreground leading-none">
                $1,247
              </p>
              <p className="text-[12px] text-muted-foreground mt-1.5">
                This month
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <div className="grid grid-cols-4 gap-2">
              {quickActions.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  className="flex flex-col items-center gap-2.5 group"
                >
                  <span className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center transition-colors group-hover:bg-primary/10">
                    <Icon
                      size={18}
                      className="text-primary"
                      strokeWidth={1.75}
                    />
                  </span>
                  <span className="text-[12px] font-medium text-muted-foreground">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Transactions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-semibold text-foreground">
                Recent activity
              </h2>
              <button className="text-[13px] font-medium text-primary hover:underline underline-offset-2">
                See all
              </button>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {transactions.map((tx, i) => (
                <div
                  key={tx.id}
                  className={`flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors ${
                    i < transactions.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <span className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-[18px] shrink-0">
                    {tx.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-foreground leading-snug truncate">
                      {tx.name}
                    </p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                      {tx.date}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-[14px] font-semibold ${
                        tx.amount > 0 ? "text-emerald-600" : "text-foreground"
                      }`}
                    >
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {tx.category}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom tab bar */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-card border-t border-border px-6 pt-3 pb-7"
          style={{ backdropFilter: "blur(12px)" }}
        >
          <div className="flex items-center justify-around">
            {(
              [
                { id: "home", icon: Home, label: "Home" },
                { id: "cards", icon: CreditCard, label: "Cards" },
                { id: "analytics", icon: PieChart, label: "Analytics" },
                { id: "settings", icon: Settings, label: "Settings" },
              ] as { id: Tab; icon: typeof Home; label: string }[]
            ).map(({ id, icon: Icon, label }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="flex flex-col items-center gap-1.5 px-3 py-1 group"
                >
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.25 : 1.75}
                    className={
                      active ? "text-primary" : "text-muted-foreground"
                    }
                  />
                  <span
                    className={`text-[10px] font-medium tracking-wide ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
