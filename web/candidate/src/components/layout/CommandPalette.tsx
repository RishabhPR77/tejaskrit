import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, FileText, LayoutDashboard, Search, Settings } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { jobs } from "@/lib/mock-data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const go = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search jobs, companies, pages..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          <CommandItem onSelect={() => go("/")}><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</CommandItem>
          <CommandItem onSelect={() => go("/jobs")}><Briefcase className="mr-2 h-4 w-4" /> Jobs</CommandItem>
          <CommandItem onSelect={() => go("/tracker")}><Search className="mr-2 h-4 w-4" /> Tracker</CommandItem>
          <CommandItem onSelect={() => go("/resume")}><FileText className="mr-2 h-4 w-4" /> Resume</CommandItem>
          <CommandItem onSelect={() => go("/notifications")}><Settings className="mr-2 h-4 w-4" /> Notifications</CommandItem>
        </CommandGroup>
        <CommandGroup heading="Top Jobs">
          {jobs.slice(0, 5).map((job) => (
            <CommandItem key={job.id} onSelect={() => go("/jobs")}>
              <Briefcase className="mr-2 h-4 w-4" />
              {job.title} — {job.company}
              <span className="ml-auto text-xs text-muted-foreground">{job.matchScore}%</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
