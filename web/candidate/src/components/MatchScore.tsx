import { getMatchScoreClass } from "@/lib/mock-data";

export function MatchScore({ score, size = "default" }: { score: number; size?: "default" | "lg" }) {
  return (
    <span className={`${getMatchScoreClass(score)} ${size === "lg" ? "text-base min-w-[3rem] h-10 px-3" : ""}`}>
      {score}%
    </span>
  );
}
