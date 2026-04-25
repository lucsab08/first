import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCents(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0 ? `$${dollars.toFixed(0)}` : `$${dollars.toFixed(2)}`;
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase()
    .replace(" ", "");
}

export function formatDay(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export function countdownTo(target: Date | string): string {
  const t = typeof target === "string" ? new Date(target) : target;
  const diffMs = t.getTime() - Date.now();
  if (diffMs <= 0) return "now";
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `in ${minutes}m`;
  return `in ${hours}h ${minutes.toString().padStart(2, "0")}m`;
}

export function neighborhoodLabel(slug: string): string {
  return slug
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function firstName(fullName: string | null | undefined): string {
  if (!fullName) return "there";
  return fullName.split(" ")[0] ?? "there";
}

export function timeAwareGreeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
