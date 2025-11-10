import { Calendar, Bookmark, Sparkles, TrendingUp, DollarSign, Bell } from "lucide-react"

export const NOTIFICATION_TYPE_ICONS = {
  deadline_reminder: Calendar,
  watchlist_update: Bookmark,
  new_program: Sparkles,
  cutoff_update: TrendingUp,
  fee_update: DollarSign,
  general: Bell,
} as const

export const NOTIFICATION_TYPE_COLORS = {
  deadline_reminder: "text-orange-500",
  watchlist_update: "text-blue-500",
  new_program: "text-green-500",
  cutoff_update: "text-purple-500",
  fee_update: "text-yellow-500",
  general: "text-gray-500",
} as const

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  email: true,
  push: false,
  deadlineReminders: true,
  watchlistUpdates: true,
  newPrograms: true,
  cutoffUpdates: true,
  feeUpdates: true,
  general: true,
} as const

