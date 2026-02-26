import { AppLayout } from "@/components/layout/AppLayout";
import { currentUser, jobs, applications, recentActivity, upcomingEvents } from "@/lib/mock-data";
import { SourceBadge } from "@/components/SourceBadge";
import { MatchScore } from "@/components/MatchScore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Briefcase, CalendarDays, Trophy, ExternalLink, FileText, ArrowRight, Clock, CheckCircle2, Star, Video, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const kpis = [
  { label: "New Matches Today", value: "3", icon: Sparkles, color: "text-primary" },
  { label: "Active Applications", value: "5", icon: Briefcase, color: "text-info" },
  { label: "Upcoming Events", value: "2", icon: CalendarDays, color: "text-warning" },
  { label: "Offers", value: "1", icon: Trophy, color: "text-success" },
];

const activityIcons: Record<string, React.ReactNode> = {
  file: <FileText className="h-4 w-4" />,
  check: <CheckCircle2 className="h-4 w-4" />,
  calendar: <Calendar className="h-4 w-4" />,
  star: <Star className="h-4 w-4" />,
  video: <Video className="h-4 w-4" />,
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.3 } }),
};

export default function Dashboard() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const priorityJobs = jobs.slice(0, 6);
  const instituteJobs = jobs.filter((j) => j.source === "Institute Verified");

  return (
    <AppLayout>
      <div className="page-container space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="text-2xl font-bold">{greeting}, {currentUser.name.split(" ")[0]}</h1>
          <p className="text-muted-foreground text-sm mt-1">Your placement journey at a glance</p>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <motion.div key={kpi.label} custom={i} initial="hidden" animate="visible" variants={fadeUp}>
              <Card className="card-elevated p-5 flex items-start gap-4">
                <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0 ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Priority Opportunities */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Priority Opportunities</h2>
            <Link to="/jobs">
              <Button variant="ghost" size="sm" className="text-xs gap-1">View All <ArrowRight className="h-3 w-3" /></Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {priorityJobs.map((job, i) => (
              <motion.div key={job.id} custom={i} initial="hidden" animate="visible" variants={fadeUp}>
                <Card className="card-elevated p-5 flex flex-col gap-3 h-full">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{job.title}</h3>
                      <p className="text-xs text-muted-foreground">{job.company} · {job.location}</p>
                    </div>
                    <MatchScore score={job.matchScore} size="lg" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <SourceBadge source={job.source} />
                    {job.matchReasons.slice(0, 2).map((r) => (
                      <span key={r} className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{r}</span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {job.lastSeen}</p>
                  <div className="flex gap-2 mt-auto pt-2">
                    <Button size="sm" variant="outline" className="text-xs flex-1">View</Button>
                    <Button size="sm" variant="outline" className="text-xs flex-1 gap-1"><FileText className="h-3 w-3" /> Resume</Button>
                    <Button size="sm" className="text-xs flex-1 gap-1"><ExternalLink className="h-3 w-3" /> Apply</Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Institute Verified */}
        {instituteJobs.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4">Institute Verified Drives</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {instituteJobs.map((job) => (
                <Card key={job.id} className="card-elevated p-5 border-l-4 border-l-primary space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{job.title}</h3>
                      <p className="text-xs text-muted-foreground">{job.company} · {job.location}</p>
                    </div>
                    <MatchScore score={job.matchScore} />
                  </div>
                  <SourceBadge source="Institute Verified" />
                  <Button size="sm" className="text-xs w-full mt-2">View & Apply</Button>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Bottom Grid: Upcoming + Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upcoming Timeline */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>
            <Card className="card-elevated divide-y divide-border">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
                      <CalendarDays className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.date} · {event.time}</p>
                    </div>
                  </div>
                  <Link to="/tracker">
                    <Button variant="ghost" size="sm" className="text-xs shrink-0">Open</Button>
                  </Link>
                </div>
              ))}
            </Card>
          </section>

          {/* Recent Activity */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <Card className="card-elevated divide-y divide-border">
              {recentActivity.map((item) => (
                <div key={item.id} className="p-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                    {activityIcons[item.icon] || <CheckCircle2 className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{item.text}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
            </Card>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
