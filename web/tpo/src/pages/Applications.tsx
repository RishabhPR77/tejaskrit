import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Download,
  Megaphone,
  X,
  FileText,
  Paperclip,
  Loader2,
  Plus,
  Save,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { applicationStatuses } from "@/lib/mock-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

import { useAuth } from "@/auth/AuthProvider";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  Timestamp,
} from "firebase/firestore";

import { downloadCSV } from "@/lib/download";

type StudentDoc = {
  instituteId: string;
  name: string;
  branch: string;
  batch: string;
  cgpa: number;
  status: string;
};
type Student = StudentDoc & { id: string };

type DriveDoc = {
  instituteId: string;
  title: string;
  company: string;
  deadlineAt?: Timestamp;
  status: string;
  verified?: boolean;
};
type Drive = DriveDoc & { id: string };

type AppDoc = {
  instituteId: string;
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;

  studentId: string;
  studentName: string;

  company: string;
  role: string;

  status: string;
  appliedAt?: Timestamp | null;

  nextEventLabel?: string | null;
  nextEventAt?: Timestamp | null;

  outcome?: string | null;
  notes?: string | null;

  resumeName?: string | null;
  resumeUrl?: string | null;

  driveId?: string | null;
  driveTitle?: string | null;
};
type Application = AppDoc & { id: string };

const NONE_VALUE = "__none__";

function toDate(ts?: Timestamp | null) {
  if (!ts) return null;
  return ts.toDate();
}

function fmtShort(d: Date | null) {
  if (!d) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function toDatetimeLocal(d: Date | null) {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function msAny(ts: any) {
  try {
    if (!ts) return 0;
    if (typeof ts.toMillis === "function") return ts.toMillis();
    if (typeof ts.toDate === "function") return ts.toDate().getTime();
    return 0;
  } catch {
    return 0;
  }
}

export default function Applications() {
  const { toast } = useToast();
  const { profile, user } = useAuth();
  const instituteId = profile?.instituteId ?? null;

  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<Application[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [drives, setDrives] = useState<Drive[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    studentId: "",
    driveId: "", // "" means none linked
    company: "",
    role: "",
    status: "Applied",
    appliedLocal: "",
    nextEventLabel: "",
    nextEventLocal: "",
    outcome: "Pending",
    notes: "",
    resumeName: "",
    resumeUrl: "",
  });

  // Announcement dialog
  const [announceOpen, setAnnounceOpen] = useState(false);
  const [announceSending, setAnnounceSending] = useState(false);
  const [announceTitle, setAnnounceTitle] = useState(
    "Update for selected applicants",
  );
  const [announceMessage, setAnnounceMessage] = useState("");

  // Detail edit
  const detail = useMemo(
    () => (detailId ? (apps.find((a) => a.id === detailId) ?? null) : null),
    [detailId, apps],
  );
  const [detailDraft, setDetailDraft] = useState({
    status: "Applied",
    nextEventLabel: "",
    nextEventLocal: "",
    outcome: "",
    notes: "",
    resumeName: "",
    resumeUrl: "",
  });
  const [detailSaving, setDetailSaving] = useState(false);

  // realtime applications
  useEffect(() => {
    if (!instituteId) return;

    setLoading(true);
    const q = query(
      collection(db, "applications"),
      where("instituteId", "==", instituteId),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Application[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as AppDoc),
        }));

        // client sort (no Firestore orderBy)
        list.sort((a, b) => {
          const ams =
            msAny(a.updatedAt) ||
            msAny(a.createdAt) ||
            (toDate(a.appliedAt ?? null)?.getTime() ?? 0);
          const bms =
            msAny(b.updatedAt) ||
            msAny(b.createdAt) ||
            (toDate(b.appliedAt ?? null)?.getTime() ?? 0);
          return bms - ams;
        });

        setApps(list);
        setSelected((prev) =>
          prev.filter((id) => list.some((x) => x.id === id)),
        );
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
        toast({
          title: "Failed to load applications",
          description: err?.message ?? "Check Firestore setup.",
          variant: "destructive",
        });
      },
    );

    return () => unsub();
  }, [instituteId, toast]);

  // realtime students
  useEffect(() => {
    if (!instituteId) return;
    const q = query(
      collection(db, "students"),
      where("instituteId", "==", instituteId),
    );
    const unsub = onSnapshot(q, (snap) => {
      const list: Student[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as StudentDoc),
      }));
      list.sort((a, b) => a.name.localeCompare(b.name));
      setStudents(list);
    });
    return () => unsub();
  }, [instituteId]);

  // realtime drives
  useEffect(() => {
    if (!instituteId) return;
    const q = query(
      collection(db, "drives"),
      where("instituteId", "==", instituteId),
    );
    const unsub = onSnapshot(q, (snap) => {
      const list: Drive[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as DriveDoc),
      }));
      list.sort((a, b) => {
        const ams = toDate(a.deadlineAt ?? null)?.getTime?.() ?? 0;
        const bms = toDate(b.deadlineAt ?? null)?.getTime?.() ?? 0;
        return bms - ams;
      });
      setDrives(list);
    });
    return () => unsub();
  }, [instituteId]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return apps.filter((a) => {
      const matchSearch =
        !s ||
        a.studentName.toLowerCase().includes(s) ||
        a.company.toLowerCase().includes(s) ||
        (a.role ?? "").toLowerCase().includes(s);
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [apps, search, statusFilter]);

  const toggleSelect = (id: string) =>
    setSelected((p) =>
      p.includes(id) ? p.filter((i) => i !== id) : [...p, id],
    );

  const selectAll = () => {
    if (filtered.length === 0) return;
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map((a) => a.id));
  };

  // hydrate detail draft when opening
  useEffect(() => {
    if (!detail) return;
    setDetailDraft({
      status: detail.status ?? "Applied",
      nextEventLabel: detail.nextEventLabel ?? "",
      nextEventLocal: toDatetimeLocal(toDate(detail.nextEventAt ?? null)),
      outcome: detail.outcome ?? "",
      notes: detail.notes ?? "",
      resumeName: detail.resumeName ?? "",
      resumeUrl: detail.resumeUrl ?? "",
    });
  }, [detail?.id]);

  const resetCreate = () => {
    setCreateForm({
      studentId: "",
      driveId: "",
      company: "",
      role: "",
      status: "Applied",
      appliedLocal: "",
      nextEventLabel: "",
      nextEventLocal: "",
      outcome: "Pending",
      notes: "",
      resumeName: "",
      resumeUrl: "",
    });
  };

  const openCreate = () => {
    resetCreate();
    setCreateOpen(true);
  };

  // IMPORTANT: no SelectItem can have value="".
  // We map "None" to a safe string and handle it here.
  const onDriveChange = (value: string) => {
    if (value === NONE_VALUE) {
      setCreateForm((p) => ({ ...p, driveId: "" }));
      return;
    }

    const d = drives.find((x) => x.id === value);
    setCreateForm((p) => ({
      ...p,
      driveId: value,
      company: d?.company ?? p.company,
      role: d?.title ?? p.role,
    }));
  };

  const createApplication = async () => {
    if (!instituteId || !user) return;

    if (!createForm.studentId) {
      toast({ title: "Select a student", variant: "destructive" });
      return;
    }

    const st = students.find((s) => s.id === createForm.studentId);
    if (!st) {
      toast({ title: "Invalid student", variant: "destructive" });
      return;
    }

    const company = createForm.company.trim();
    const role = createForm.role.trim();
    if (!company || !role) {
      toast({ title: "Company and role required", variant: "destructive" });
      return;
    }

    const appliedAt = createForm.appliedLocal
      ? Timestamp.fromDate(new Date(createForm.appliedLocal))
      : Timestamp.fromDate(new Date());

    const nextEventAt = createForm.nextEventLocal
      ? Timestamp.fromDate(new Date(createForm.nextEventLocal))
      : null;

    const drive =
      createForm.driveId && createForm.driveId.trim()
        ? drives.find((d) => d.id === createForm.driveId)
        : null;

    setCreating(true);
    try {
      const payload: AppDoc = {
        instituteId,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),

        studentId: st.id,
        studentName: st.name,

        company,
        role,

        status: createForm.status,
        appliedAt,

        nextEventLabel: createForm.nextEventLabel.trim() || null,
        nextEventAt,

        outcome: createForm.outcome.trim() || null,
        notes: createForm.notes.trim() || null,

        resumeName: createForm.resumeName.trim() || null,
        resumeUrl: createForm.resumeUrl.trim() || null,

        driveId: drive ? drive.id : null,
        driveTitle: drive ? drive.title : null,
      };

      await addDoc(collection(db, "applications"), payload);

      toast({ title: "Application added", description: "Saved to Firestore." });
      setCreateOpen(false);
      resetCreate();
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Failed to add application",
        description: e?.message ?? "Check Firestore setup.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const saveDetail = async () => {
    if (!detail) return;

    setDetailSaving(true);
    try {
      const nextEventAt = detailDraft.nextEventLocal
        ? Timestamp.fromDate(new Date(detailDraft.nextEventLocal))
        : null;

      await updateDoc(doc(db, "applications", detail.id), {
        status: detailDraft.status,
        nextEventLabel: detailDraft.nextEventLabel.trim() || null,
        nextEventAt,
        outcome: detailDraft.outcome.trim() || null,
        notes: detailDraft.notes.trim() || null,
        resumeName: detailDraft.resumeName.trim() || null,
        resumeUrl: detailDraft.resumeUrl.trim() || null,
        updatedAt: serverTimestamp(),
      });

      toast({ title: "Application updated" });
    } catch (e: any) {
      toast({
        title: "Failed to update",
        description: e?.message ?? "Try again.",
        variant: "destructive",
      });
    } finally {
      setDetailSaving(false);
    }
  };

  const exportSelectedCSV = () => {
    const rows = (
      selected.length ? apps.filter((a) => selected.includes(a.id)) : filtered
    ).map((a) => ({
      student: a.studentName,
      company: a.company,
      role: a.role,
      status: a.status,
      appliedOn: toDate(a.appliedAt ?? null)?.toISOString?.() ?? "",
      nextEvent: a.nextEventLabel ?? "",
      nextEventAt: toDate(a.nextEventAt ?? null)?.toISOString?.() ?? "",
      outcome: a.outcome ?? "",
      drive: a.driveTitle ?? "",
    }));

    downloadCSV(`applications_${Date.now()}.csv`, rows);
    toast({ title: "CSV downloaded" });
  };

  const openAnnounce = () => {
    if (selected.length === 0) return;

    const chosen = apps.filter((a) => selected.includes(a.id));
    const lines = chosen.map((a) => {
      const next = a.nextEventLabel ? ` | Next: ${a.nextEventLabel}` : "";
      return `• ${a.studentName} — ${a.company} (${a.role}) — ${a.status}${next}`;
    });

    setAnnounceTitle("Update for selected applicants");
    setAnnounceMessage(lines.join("\n"));
    setAnnounceOpen(true);
  };

  const sendAnnouncement = async () => {
    if (!instituteId || !user) return;
    if (!announceTitle.trim() || !announceMessage.trim()) {
      toast({ title: "Title and message required", variant: "destructive" });
      return;
    }

    setAnnounceSending(true);
    try {
      await addDoc(collection(db, "announcements"), {
        instituteId,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        title: announceTitle.trim(),
        message: announceMessage.trim(),
        targetType: "custom",
        targetLabel: `Selected applicants (${selected.length})`,
        pinned: false,
        delivered: selected.length,
        opened: 0,
        scheduledAt: null,
      });

      toast({ title: "Announcement sent", description: "Saved to Firestore." });
      setAnnounceOpen(false);
    } catch (e: any) {
      toast({
        title: "Failed to send",
        description: e?.message ?? "Check Firestore.",
        variant: "destructive",
      });
    } finally {
      setAnnounceSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Applications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Central application tracking across all drives (Firestore)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Application
          </Button>

          {selected.length > 0 && (
            <>
              <span className="text-sm text-muted-foreground">
                {selected.length} selected
              </span>
              <Button variant="outline" size="sm" onClick={openAnnounce}>
                <Megaphone className="w-4 h-4 mr-1.5" /> Announce
              </Button>
              <Button variant="outline" size="sm" onClick={exportSelectedCSV}>
                <Download className="w-4 h-4 mr-1.5" /> Export CSV
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by student, company, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {applicationStatuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {statusFilter !== "all" && (
          <div className="flex items-center gap-2">
            <StatusBadge status={statusFilter} />
            <button
              onClick={() => setStatusFilter("all")}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="px-4 py-3.5 w-10">
                  <Checkbox
                    checked={
                      filtered.length > 0 && selected.length === filtered.length
                    }
                    onCheckedChange={() => selectAll()}
                  />
                </th>
                {[
                  "Company",
                  "Role",
                  "Student",
                  "Status",
                  "Applied On",
                  "Next Event",
                  "Outcome",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold text-muted-foreground px-5 py-3.5"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-5 py-10">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading applications…</span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10">
                    <div className="text-center text-sm text-muted-foreground">
                      No applications yet. Add your first application.
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer"
                    onClick={() => setDetailId(a.id)}
                  >
                    <td
                      className="px-4 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selected.includes(a.id)}
                        onCheckedChange={() => toggleSelect(a.id)}
                      />
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-foreground">
                      {a.company}
                      {a.driveTitle ? (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          <Badge variant="secondary" className="text-[10px]">
                            Drive: {a.driveTitle}
                          </Badge>
                        </div>
                      ) : null}
                    </td>

                    <td className="px-5 py-4 text-sm text-foreground">
                      {a.role}
                    </td>

                    <td className="px-5 py-4 text-sm text-foreground">
                      {a.studentName}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={a.status} />
                    </td>

                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {fmtShort(toDate(a.appliedAt ?? null))}
                    </td>

                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {a.nextEventLabel ?? "—"}
                    </td>

                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {a.outcome ?? "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Application Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Application</DialogTitle>
            <DialogDescription>
              Create a new application entry for tracking (stored in Firestore).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Student</Label>
                <Select
                  value={createForm.studentId}
                  onValueChange={(v) =>
                    setCreateForm((p) => ({ ...p, studentId: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.branch}-{s.batch})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {students.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Add students first from the Students page.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Drive (optional)</Label>
                <Select
                  value={createForm.driveId ? createForm.driveId : NONE_VALUE}
                  onValueChange={onDriveChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Link to drive" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                    {drives.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.company} — {d.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={createForm.company}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, company: e.target.value }))
                  }
                  placeholder="e.g. Google"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input
                  value={createForm.role}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, role: e.target.value }))
                  }
                  placeholder="e.g. SDE Intern"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={createForm.status}
                  onValueChange={(v) =>
                    setCreateForm((p) => ({ ...p, status: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {applicationStatuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Applied On</Label>
                <Input
                  type="datetime-local"
                  value={createForm.appliedLocal}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      appliedLocal: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Next Event Label (optional)</Label>
                <Input
                  value={createForm.nextEventLabel}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      nextEventLabel: e.target.value,
                    }))
                  }
                  placeholder="e.g. OA / Interview Round 1"
                />
              </div>
              <div className="space-y-2">
                <Label>Next Event Date (optional)</Label>
                <Input
                  type="datetime-local"
                  value={createForm.nextEventLocal}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      nextEventLocal: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Outcome</Label>
                <Input
                  value={createForm.outcome}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, outcome: e.target.value }))
                  }
                  placeholder="Pending / Selected / Not Selected"
                />
              </div>
              <div className="space-y-2">
                <Label>Resume Name (optional)</Label>
                <Input
                  value={createForm.resumeName}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      resumeName: e.target.value,
                    }))
                  }
                  placeholder="resume_student.pdf"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Resume URL (optional)</Label>
              <Input
                value={createForm.resumeUrl}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, resumeUrl: e.target.value }))
                }
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={createForm.notes}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, notes: e.target.value }))
                }
                className="min-h-[90px]"
                placeholder="Any notes…"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={createApplication} disabled={creating}>
                {creating ? "Saving…" : "Add Application"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Announce Dialog */}
      <Dialog open={announceOpen} onOpenChange={setAnnounceOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Send Announcement</DialogTitle>
            <DialogDescription>
              This will create an announcement in Firestore for your institute.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={announceTitle}
                onChange={(e) => setAnnounceTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={announceMessage}
                onChange={(e) => setAnnounceMessage(e.target.value)}
                className="min-h-[160px]"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={sendAnnouncement} disabled={announceSending}>
                {announceSending ? "Sending…" : "Send Now"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Panel */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-foreground/20"
            onClick={() => setDetailId(null)}
          />
          <div className="relative w-full max-w-md bg-card border-l border-border overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {detail.studentName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {detail.company} — {detail.role}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDetailId(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={detailDraft.status}
                  onValueChange={(v) =>
                    setDetailDraft((p) => ({ ...p, status: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {applicationStatuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Next Event Label</Label>
                  <Input
                    value={detailDraft.nextEventLabel}
                    onChange={(e) =>
                      setDetailDraft((p) => ({
                        ...p,
                        nextEventLabel: e.target.value,
                      }))
                    }
                    placeholder="e.g. OA / Interview"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Next Event Date</Label>
                  <Input
                    type="datetime-local"
                    value={detailDraft.nextEventLocal}
                    onChange={(e) =>
                      setDetailDraft((p) => ({
                        ...p,
                        nextEventLocal: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Outcome</Label>
                <Input
                  value={detailDraft.outcome}
                  onChange={(e) =>
                    setDetailDraft((p) => ({ ...p, outcome: e.target.value }))
                  }
                  placeholder="Pending / Selected / Not Selected"
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Resume
                </h3>
                <div className="space-y-2">
                  <Input
                    value={detailDraft.resumeName}
                    onChange={(e) =>
                      setDetailDraft((p) => ({
                        ...p,
                        resumeName: e.target.value,
                      }))
                    }
                    placeholder="resume.pdf"
                  />
                  <Input
                    value={detailDraft.resumeUrl}
                    onChange={(e) =>
                      setDetailDraft((p) => ({
                        ...p,
                        resumeUrl: e.target.value,
                      }))
                    }
                    placeholder="https://resume-link"
                  />
                  {detailDraft.resumeName ? (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/40 text-sm text-muted-foreground">
                      <Paperclip className="w-4 h-4" /> {detailDraft.resumeName}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={detailDraft.notes}
                  onChange={(e) =>
                    setDetailDraft((p) => ({ ...p, notes: e.target.value }))
                  }
                  className="min-h-[90px]"
                  placeholder="Notes…"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={saveDetail}
                  disabled={detailSaving}
                >
                  <Save className="w-4 h-4 mr-1.5" />
                  {detailSaving ? "Saving…" : "Save"}
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                Applied: {fmtShort(toDate(detail.appliedAt ?? null))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
