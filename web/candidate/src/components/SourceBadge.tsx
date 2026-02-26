import { Shield, Globe, MessageCircle, Puzzle, PenLine } from "lucide-react";
import { type JobSource, getSourceBadgeClass } from "@/lib/mock-data";

export function SourceBadge({ source }: { source: JobSource }) {
  const icons: Record<JobSource, React.ReactNode> = {
    "Institute Verified": <Shield className="h-3 w-3" />,
    "Career Page": <Globe className="h-3 w-3" />,
    "Telegram": <MessageCircle className="h-3 w-3" />,
    "Extension": <Puzzle className="h-3 w-3" />,
    "Manual": <PenLine className="h-3 w-3" />,
  };

  return (
    <span className={getSourceBadgeClass(source)}>
      {icons[source]}
      {source}
    </span>
  );
}
