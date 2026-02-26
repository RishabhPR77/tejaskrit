import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { notifications, type Notification } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Bell, Megaphone, RefreshCw, Star, CalendarDays, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const typeIcons: Record<string, React.ReactNode> = {
  match: <Star className="h-4 w-4" />,
  reminder: <CalendarDays className="h-4 w-4" />,
  announcement: <Megaphone className="h-4 w-4" />,
  update: <RefreshCw className="h-4 w-4" />,
};

const typeColors: Record<string, string> = {
  match: "bg-primary/10 text-primary",
  reminder: "bg-warning/10 text-warning",
  announcement: "bg-accent text-accent-foreground",
  update: "bg-info/10 text-info",
};

export default function Notifications() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filtered = notifications.filter((n) => {
    if (filter === "unread" && n.read) return false;
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    return true;
  });

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <AppLayout>
      <div className="page-container max-w-3xl">
        <h1 className="text-2xl font-bold mb-1">Notifications</h1>
        <p className="text-sm text-muted-foreground mb-6">{unread} unread notifications</p>

        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread ({unread})</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-1.5 ml-auto">
            {["all", "match", "reminder", "announcement", "update"].map((t) => (
              <Button key={t} variant={typeFilter === t ? "default" : "outline"} size="sm" className="text-xs capitalize h-7 px-2.5"
                onClick={() => setTypeFilter(t)}>
                {t === "all" ? "All Types" : t}
              </Button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <Card className="card-elevated p-12 text-center">
            <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No notifications to show</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((n, i) => (
              <motion.div key={n.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className={`card-elevated p-4 flex items-start gap-3 ${!n.read ? "border-l-2 border-l-primary" : ""}`}>
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${typeColors[n.type]}`}>
                    {typeIcons[n.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm ${!n.read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                      </div>
                      {!n.read && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(n.timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {n.actionLabel && n.actionUrl && (
                        <Link to={n.actionUrl}>
                          <Button variant="ghost" size="sm" className="text-xs h-6 px-2 gap-1">
                            {n.actionLabel} <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
