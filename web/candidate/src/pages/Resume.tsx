import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { masterResume, tailoredResumes, jobs } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, RefreshCw, Code, Eye, Sparkles, Plus, Trash2, GripVertical, Shield, Database, X } from "lucide-react";
import { motion } from "framer-motion";

export default function Resume() {
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2000);
  };

  return (
    <AppLayout>
      <div className="page-container">
        <h1 className="text-2xl font-bold mb-1">Resume</h1>
        <p className="text-sm text-muted-foreground mb-6">Manage your master resume and generate tailored versions</p>

        <Tabs defaultValue="master">
          <TabsList className="mb-6">
            <TabsTrigger value="master">Master Resume</TabsTrigger>
            <TabsTrigger value="tailored">Tailored Resumes ({tailoredResumes.length})</TabsTrigger>
            <TabsTrigger value="privacy">Data & Privacy</TabsTrigger>
          </TabsList>

          <TabsContent value="master">
            <div className="space-y-6">
              {/* Summary */}
              <Card className="card-elevated p-5">
                <h3 className="font-semibold text-sm mb-3">Summary</h3>
                <Textarea defaultValue={masterResume.summary} rows={3} className="text-sm" />
              </Card>

              {/* Skills */}
              <Card className="card-elevated p-5">
                <h3 className="font-semibold text-sm mb-3">Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {masterResume.skills.map((s) => (
                    <Badge key={s} variant="secondary" className="gap-1">
                      {s} <X className="h-3 w-3 cursor-pointer" />
                    </Badge>
                  ))}
                  <Badge variant="outline" className="gap-1 cursor-pointer"><Plus className="h-3 w-3" /> Add</Badge>
                </div>
              </Card>

              {/* Education */}
              <Card className="card-elevated p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Education</h3>
                  <Button variant="ghost" size="sm" className="text-xs gap-1"><Plus className="h-3 w-3" /> Add</Button>
                </div>
                <div className="space-y-3">
                  {masterResume.education.map((e, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 cursor-grab" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{e.institution}</p>
                        <p className="text-xs text-muted-foreground">{e.degree} · {e.period}</p>
                        <p className="text-xs text-muted-foreground">{e.grade}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Experience */}
              <Card className="card-elevated p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Experience</h3>
                  <Button variant="ghost" size="sm" className="text-xs gap-1"><Plus className="h-3 w-3" /> Add</Button>
                </div>
                <div className="space-y-3">
                  {masterResume.experience.map((e, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{e.role} — {e.company}</p>
                          <p className="text-xs text-muted-foreground">{e.period}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6"><Trash2 className="h-3 w-3" /></Button>
                      </div>
                      <ul className="mt-2 space-y-1">
                        {e.bullets.map((b, j) => <li key={j} className="text-xs text-muted-foreground">• {b}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Projects */}
              <Card className="card-elevated p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Projects</h3>
                  <Button variant="ghost" size="sm" className="text-xs gap-1"><Plus className="h-3 w-3" /> Add</Button>
                </div>
                <div className="space-y-3">
                  {masterResume.projects.map((p, i) => (
                    <div key={i} className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">Tech: {p.tech}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Achievements */}
              <Card className="card-elevated p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Achievements</h3>
                  <Button variant="ghost" size="sm" className="text-xs gap-1"><Plus className="h-3 w-3" /> Add</Button>
                </div>
                <ul className="space-y-1.5">
                  {masterResume.achievements.map((a, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span> {a}
                    </li>
                  ))}
                </ul>
              </Card>

              <div className="flex gap-2">
                <Button>Save Changes</Button>
                <Button variant="outline" className="gap-1" onClick={() => setGenerateOpen(true)}>
                  <Sparkles className="h-3.5 w-3.5" /> Generate Tailored Resume
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tailored">
            <div className="space-y-3">
              <div className="flex justify-end mb-2">
                <Button size="sm" className="gap-1 text-xs" onClick={() => setGenerateOpen(true)}><Plus className="h-3.5 w-3.5" /> Generate New</Button>
              </div>
              {tailoredResumes.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="card-elevated p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-accent-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{r.role} — {r.company}</p>
                        <p className="text-xs text-muted-foreground">Generated {r.generatedDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={r.status === "Ready" ? "default" : "secondary"} className="text-xs">{r.status}</Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Code className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><RefreshCw className="h-3.5 w-3.5" /></Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="privacy">
            <Card className="card-elevated p-6 space-y-6 max-w-lg">
              <div>
                <h3 className="font-semibold text-sm mb-1 flex items-center gap-2"><Shield className="h-4 w-4" /> Privacy Preferences</h3>
                <p className="text-xs text-muted-foreground">Control how your data is used</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm">Allow resume generation</p><p className="text-xs text-muted-foreground">Use profile data for AI resume tailoring</p></div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div><p className="text-sm">Allow job matching</p><p className="text-xs text-muted-foreground">Use skills and preferences for match scoring</p></div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div><p className="text-sm">Share with TPO</p><p className="text-xs text-muted-foreground">Allow college placement office to view applications</p></div>
                  <Switch />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="gap-1"><Database className="h-3.5 w-3.5" /> Export My Data</Button>
                <Button variant="outline" size="sm" className="gap-1 text-destructive"><Trash2 className="h-3.5 w-3.5" /> Delete My Data</Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Generate Modal */}
        <Dialog open={generateOpen} onOpenChange={(o) => { setGenerateOpen(o); if (!o) setGenerated(false); }}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Generate Tailored Resume</DialogTitle></DialogHeader>
            {!generated ? (
              <div className="space-y-4">
                <div>
                  <Label>Select Job</Label>
                  <Select>
                    <SelectTrigger><SelectValue placeholder="Search and select a job..." /></SelectTrigger>
                    <SelectContent>
                      {jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title} — {j.company}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Card className="p-3 bg-accent/50">
                  <p className="text-xs font-medium mb-1">Key emphasis areas:</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5">
                    <li>• Highlight React & TypeScript proficiency</li>
                    <li>• Emphasize system design experience</li>
                    <li>• Include relevant project: CodeCollab</li>
                  </ul>
                </Card>
                <Button className="w-full gap-1" onClick={handleGenerate} disabled={generating}>
                  {generating ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Generating...</> : <><Sparkles className="h-3.5 w-3.5" /> Generate</>}
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4 py-4">
                <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                  <FileText className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="font-semibold">Resume Generated!</p>
                  <p className="text-sm text-muted-foreground">Your tailored resume is ready for download</p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button size="sm" className="gap-1"><Download className="h-3.5 w-3.5" /> Download PDF</Button>
                  <Button size="sm" variant="outline" className="gap-1"><Eye className="h-3.5 w-3.5" /> Preview</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
