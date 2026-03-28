import { cn } from "@/lib/utils";

const COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-red-500",
  "bg-purple-500", "bg-pink-500", "bg-cyan-500", "bg-indigo-500",
  "bg-teal-500", "bg-orange-500",
];

function getInitials(firstName?: string | null, lastName?: string | null, name?: string | null): string {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }
  return "??";
}

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

interface UserAvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function UserAvatar({ firstName, lastName, name, size = "md", className }: UserAvatarProps) {
  const initials = getInitials(firstName, lastName, name);
  const color = getColor(firstName || lastName || name || "user");
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-16 w-16 text-xl" };

  return (
    <div className={cn("flex items-center justify-center rounded-full text-white font-bold", color, sizes[size], className)}>
      {initials}
    </div>
  );
}
