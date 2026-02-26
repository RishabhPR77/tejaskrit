import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { applications, statusColumns, type Application, type ApplicationStatus } from "@/lib/mock-data";
import { MatchScore } from "@/components/MatchScore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LayoutGrid, List, Plus, CalendarDays, StickyNote, Sparkles, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

const statusColors: Record<string, string> = {
  Saved: "bg-secondary text-secondary-foreground",
  Tailored: "bg-accent text-accent-foreground",
  Applied: "bg-info/10 text-info",
  "OA Scheduled": "bg-warning/10 text-warning",
  "Interview Scheduled": "bg-primary/10 text-primary",
  Offer: "bg-success/10 text-success",
  Joined: "bg-success/15 text-success",
  Rejected: "bg-destructive/10 text-destructive",
  Withdrawn: "bg-muted text-muted-foreground",
};

export default function Tracker() {
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [eventOpen, setEventOpen] = useState(false);
  const [smartOpen, setSmartOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  return (
    <AppLayout>
      <div className="page-container">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Tracker</h1>
            <p className="text-sm text-muted-foreground">Track your application lifecycle</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setSmartOpen(true)}>
              <Sparkles className="h-3.5 w-3.5" /> Smart Assist
            </Button>
            <Button size="sm" className="gap-1 text-xs" onClick={() => setEventOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Event
            </Button>
            <div className="border rounded-md flex">
              <Button variant={view === "kanban" ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setView("kanban")}><LayoutGrid className="h-3.5 w-3.5" /></Button>
              <Button variant={view === "table" ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setView("table")}><List className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        </div>

        {view === "kanban" ? <KanbanView apps={applications} /> : <TableView apps={applications} />}

        {/* Add Event Modal */}
        <Dialog open={eventOpen} onOpenChange={setEventOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add Event</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Event Type</Label>
                <Select><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oa">Online Assessment</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="followup">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Date & Time</Label><Input type="datetime-local" /></div>
              <div><Label>Link (optional)</Label><Input placeholder="https://..." /></div>
              <div><Label>Description</Label><Textarea placeholder="Notes..." rows={2} /></div>
              <Button className="w-full" onClick={() => setEventOpen(false)}>Save Event</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Smart Assist Modal */}
        <Dialog open={smartOpen} onOpenChange={setSmartOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Smart Assist</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">Paste an email or message and we'll extract the date and suggest a status update.</p>
            <Textarea placeholder="Paste email or message here..." rows={4} value={pasteText} onChange={(e) => setPasteText(e.target.value)} />
            {pasteText.length > 10 && (
              <Card className="p-4 bg-accent/50 space-y-2">
                <p className="text-xs font-medium">Extracted Info:</p>
                <p className="text-sm">📅 Date: <strong>March 5, 2025 at 2:00 PM</strong></p>
                <p className="text-sm">📌 Suggested: <Badge className={statusColors["Interview Scheduled"]}>Interview Scheduled</Badge></p>
                <Button size="sm" className="mt-2">Apply Suggestion</Button>
              </Card>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

function KanbanView({ apps }: { apps: Application[] }) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {statusColumns.map((col) => {
          const colApps = apps.filter((a) => a.status === col);
          return (
            <div key={col} className="w-64 shrink-0">
              <div className="flex items-center gap-2 mb-3 px-1">
                <Badge variant="outline" className={`text-xs ${statusColors[col] || ""}`}>{col}</Badge>
                <span className="text-xs text-muted-foreground">({colApps.length})</span>
              </div>
              <div className="space-y-2 min-h-[200px]">
                {colApps.map((app, i) => (
                  <motion.div key={app.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Card className="card-elevated p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{app.company}</p>
                          <p className="text-xs text-muted-foreground">{app.role}</p>
                        </div>
                        <MatchScore score={app.matchScore} />
                      </div>
                      {app.nextEventDate && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" /> {app.nextEvent} — {app.nextEventDate}
                        </p>
                      )}
                      {app.notes && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <StickyNote className="h-3 w-3" /> {app.notes}
                        </p>
                      )}
                    </Card>
                  </motion.div>
                ))}
                {colApps.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-8 border border-dashed border-border rounded-lg">
                    No applications
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TableView({ apps }: { apps: Application[] }) {
  return (
    <Card className="card-elevated overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Applied On</TableHead>
            <TableHead>Next Event</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apps.map((app) => (
            <TableRow key={app.id}>
              <TableCell className="font-medium">{app.company}</TableCell>
              <TableCell className="text-sm">{app.role}</TableCell>
              <TableCell><Badge className={`text-xs ${statusColors[app.status]}`}>{app.status}</Badge></TableCell>
              <TableCell className="text-sm text-muted-foreground">{app.appliedOn || "—"}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{app.nextEvent ? `${app.nextEvent} (${app.nextEventDate})` : "—"}</TableCell>
              <TableCell><MatchScore score={app.matchScore} /></TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{app.notes || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
