export type PostStatus = "pending" | "sent" | "approved" | "denied" | "expired" | "posted";

const USER_CONFIG: Record<PostStatus, { label: string; className: string }> = {
  pending:  { label: "รอดำเนินการ", className: "bg-zinc-800 text-zinc-400 border border-zinc-700" },
  sent:     { label: "ส่งแล้ว",     className: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
  approved: { label: "อนุมัติแล้ว", className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
  denied:   { label: "ปฏิเสธ",      className: "bg-red-500/10 text-red-400 border border-red-500/20" },
  expired:  { label: "หมดเวลา",     className: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  posted:   { label: "โพสต์แล้ว",   className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
};

const ADMIN_CONFIG: Record<PostStatus, { label: string; className: string }> = {
  approved: { label: "Approved", className: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" },
  posted:   { label: "Approved", className: "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" },
  denied:   { label: "Denied",   className: "text-red-400 bg-red-500/10 border border-red-500/20" },
  pending:  { label: "Pending",  className: "text-amber-400 bg-amber-500/10 border border-amber-500/20" },
  sent:     { label: "Pending",  className: "text-amber-400 bg-amber-500/10 border border-amber-500/20" },
  expired:  { label: "Expired",  className: "text-orange-400 bg-orange-500/10 border border-orange-500/20" },
};

export default function DraftStatusBadge({
  status,
  variant = "user",
}: {
  status: PostStatus;
  variant?: "user" | "admin";
}) {
  const cfg = (variant === "admin" ? ADMIN_CONFIG : USER_CONFIG)[status];
  return (
    <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
