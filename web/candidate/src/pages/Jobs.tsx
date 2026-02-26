import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { jobs, type Job, type JobSource } from "@/lib/mock-data";
import { SourceBadge } from "@/components/SourceBadge";
import { MatchScore } from "@/components/MatchScore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ExternalLink, FileText, BookmarkPlus, Clock, Filter, X, Flag, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Jobs() {
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [selectedSources, setSelectedSources] = useState<JobSource[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [consentOpen, setConsentOpen] = useState(false);

  const allSources: JobSource[] = ["Career Page", "Telegram", "Institute Verified", "Extension", "Manual"];

  const toggleSource = (s: JobSource) => {
    setSelectedSources((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const filtered = jobs.filter((j) => {
    if (search && !j.title.toLowerCase().includes(search.toLowerCase()) && !j.company.toLowerCase().includes(search.toLowerCase())) return false;
    if (j.matchScore < minScore) return false;
    if (selectedSources.length > 0 && !selectedSources.includes(j.source)) return false;
    return true;
  });

  const instituteJobs = filtered.filter((j) => j.source === "Institute Verified");
  const allJobs = filtered;

  return (
    <AppLayout>
      <div className="page-container">
        <h1 className="text-2xl font-bold mb-1">Jobs</h1>
        <p className="text-sm text-muted-foreground mb-6">Ranked opportunities tailored to your profile</p>

        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Opportunities ({allJobs.length})</TabsTrigger>
            <TabsTrigger value="institute">Institute Verified ({instituteJobs.length})</TabsTrigger>
          </TabsList>

          <div className="flex gap-6">
            {/* Filters */}
            <aside className={`shrink-0 transition-all ${showFilters ? "w-60" : "w-0 overflow-hidden"} hidden lg:block`}>
              <Card className="card-elevated p-4 space-y-5 sticky top-20">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Filters</h3>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowFilters(false)}><X className="h-3.5 w-3.5" /></Button>
                </div>

                <div>
                  <Label className="text-xs">Search</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Role or company" className="pl-8 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Min Match Score: {minScore}%</Label>
                  <Slider value={[minScore]} onValueChange={([v]) => setMinScore(v)} max={100} step={5} className="mt-2" />
                </div>

                <div>
                  <Label className="text-xs mb-2 block">Source</Label>
                  {allSources.map((s) => (
                    <label key={s} className="flex items-center gap-2 py-1 cursor-pointer">
                      <Checkbox checked={selectedSources.includes(s)} onCheckedChange={() => toggleSource(s)} />
                      <span className="text-xs">{s}</span>
                    </label>
                  ))}
                </div>

                {(search || minScore > 0 || selectedSources.length > 0) && (
                  <Button variant="ghost" size="sm" className="text-xs w-full" onClick={() => { setSearch(""); setMinScore(0); setSelectedSources([]); }}>
                    Clear All
                  </Button>
                )}
              </Card>
            </aside>

            {/* Job List */}
            <div className="flex-1 min-w-0">
              {!showFilters && (
                <Button variant="outline" size="sm" className="mb-4 gap-1 text-xs lg:inline-flex hidden" onClick={() => setShowFilters(true)}>
                  <Filter className="h-3.5 w-3.5" /> Filters
                </Button>
              )}

              {/* Mobile search */}
              <div className="lg:hidden mb-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Search roles or companies..." className="pl-8 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>

              <TabsContent value="all" className="mt-0">
                <JobList jobs={allJobs} onSelect={setSelectedJob} onGenerate={() => setConsentOpen(true)} />
              </TabsContent>
              <TabsContent value="institute" className="mt-0">
                <JobList jobs={instituteJobs} onSelect={setSelectedJob} onGenerate={() => setConsentOpen(true)} />
              </TabsContent>
            </div>
          </div>
        </Tabs>

        {/* Job Detail Modal */}
        <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedJob && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg">{selectedJob.title}</DialogTitle>
                  <p className="text-sm text-muted-foreground">{selectedJob.company} · {selectedJob.location}</p>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="flex items-center gap-3">
                    <MatchScore score={selectedJob.matchScore} size="lg" />
                    <SourceBadge source={selectedJob.source} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{selectedJob.description}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Match Breakdown</h4>
                    <div className="space-y-1">
                      {selectedJob.matchReasons.map((r) => (
                        <div key={r} className="flex items-center gap-2 text-sm">
                          <div className="h-1.5 w-1.5 rounded-full bg-success" />
                          {r}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Skills Required</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedJob.skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="gap-1" onClick={() => { setSelectedJob(null); setConsentOpen(true); }}>
                      <FileText className="h-3.5 w-3.5" /> Generate Resume
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1">Mark as Applied</Button>
                    <Button size="sm" variant="outline" className="gap-1"><ExternalLink className="h-3.5 w-3.5" /> Open Apply Link</Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Consent Modal */}
        <Dialog open={consentOpen} onOpenChange={setConsentOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Data Consent</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">We'll use your profile data (skills, experience, education) to generate a tailored resume. Your data stays private and is not shared externally.</p>
            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <Checkbox />
              <span className="text-xs text-muted-foreground">Don't show this again</span>
            </label>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={() => setConsentOpen(false)}>Continue</Button>
              <Button size="sm" variant="outline" onClick={() => setConsentOpen(false)}>Cancel</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

function JobList({ jobs: list, onSelect, onGenerate }: { jobs: Job[]; onSelect: (j: Job) => void; onGenerate: () => void }) {
  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <p className="text-sm text-muted-foreground">No jobs match your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {list.map((job, i) => (
        <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
          <Card className="card-elevated p-5 hover:cursor-pointer" onClick={() => onSelect(job)}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm">{job.title}</h3>
                  <SourceBadge source={job.source} />
                </div>
                <p className="text-xs text-muted-foreground mb-2">{job.company} · {job.location} · {job.type}</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {job.matchReasons.slice(0, 2).map((r) => (
                    <span key={r} className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{r}</span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {job.lastSeen}</p>
              </div>
              <MatchScore score={job.matchScore} size="lg" />
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
              <Button size="sm" variant="ghost" className="text-xs gap-1"><BookmarkPlus className="h-3 w-3" /> Save</Button>
              <Button size="sm" variant="outline" className="text-xs gap-1" onClick={onGenerate}><FileText className="h-3 w-3" /> Resume</Button>
              <Button size="sm" className="text-xs gap-1"><ExternalLink className="h-3 w-3" /> Apply</Button>
              <Button size="sm" variant="ghost" className="text-xs gap-1 ml-auto text-muted-foreground"><Flag className="h-3 w-3" /> Report</Button>
            </div>
          </Card>
        </motion.div>
      ))}
      <div className="flex justify-center pt-4">
        <Button variant="outline" size="sm" className="text-xs">Load More</Button>
      </div>
    </div>
  );
}
