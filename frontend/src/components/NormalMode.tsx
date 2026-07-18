import React from "react"
import { motion } from "framer-motion"
import {
  FileText, FolderOpen, Users, Clock, Star, MoreHorizontal,
  ArrowUpRight, MessageSquare, GitBranch, CheckCircle2, Plus,
  TrendingUp, Activity
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

const projects = [
  {
    id: 1,
    name: "Q4 Market Analysis",
    description: "Comprehensive market research and competitor analysis for product expansion",
    members: ["AL", "KM", "TS"],
    lastEdited: "2 hours ago",
    status: "active",
    progress: 68,
    color: "from-violet-500/20 to-purple-600/10",
    borderColor: "border-violet-500/20",
    icon: "📊",
    comments: 12,
  },
  {
    id: 2,
    name: "Product Roadmap 2025",
    description: "Strategic roadmap planning with stakeholder alignment and milestone tracking",
    members: ["JD", "RK"],
    lastEdited: "5 hours ago",
    status: "review",
    progress: 91,
    color: "from-cyan-500/20 to-blue-600/10",
    borderColor: "border-cyan-500/20",
    icon: "🗺️",
    comments: 8,
  },
  {
    id: 3,
    name: "Brand Guidelines v3",
    description: "Updated visual identity system with new color palette and typography rules",
    members: ["SM", "JD", "AL", "PL"],
    lastEdited: "1 day ago",
    status: "active",
    progress: 45,
    color: "from-emerald-500/20 to-green-600/10",
    borderColor: "border-emerald-500/20",
    icon: "🎨",
    comments: 24,
  },
  {
    id: 4,
    name: "Technical Architecture",
    description: "System design documentation for microservices migration and infrastructure",
    members: ["TS", "KM"],
    lastEdited: "2 days ago",
    status: "draft",
    progress: 23,
    color: "from-orange-500/20 to-amber-600/10",
    borderColor: "border-orange-500/20",
    icon: "⚙️",
    comments: 5,
  },
  {
    id: 5,
    name: "User Research Report",
    description: "Synthesis of 50+ user interviews with actionable insights and recommendations",
    members: ["PL", "SM", "RK"],
    lastEdited: "3 days ago",
    status: "complete",
    progress: 100,
    color: "from-pink-500/20 to-rose-600/10",
    borderColor: "border-pink-500/20",
    icon: "👥",
    comments: 31,
  },
  {
    id: 6,
    name: "API Integration Spec",
    description: "Technical specification document for third-party API integrations and webhooks",
    members: ["TS"],
    lastEdited: "4 days ago",
    status: "active",
    progress: 56,
    color: "from-indigo-500/20 to-blue-600/10",
    borderColor: "border-indigo-500/20",
    icon: "🔌",
    comments: 3,
  },
]

const activities = [
  { user: "AL", action: "commented on", target: "Q4 Market Analysis", time: "2m ago", type: "comment", color: "from-violet-500 to-purple-600" },
  { user: "KM", action: "completed task in", target: "Product Roadmap", time: "18m ago", type: "complete", color: "from-cyan-500 to-blue-600" },
  { user: "JD", action: "pushed changes to", target: "Brand Guidelines", time: "45m ago", type: "git", color: "from-emerald-500 to-green-600" },
  { user: "TS", action: "created a review for", target: "Tech Architecture", time: "1h ago", type: "review", color: "from-orange-500 to-amber-600" },
  { user: "PL", action: "shared", target: "User Research Report", time: "2h ago", type: "share", color: "from-pink-500 to-rose-600" },
  { user: "SM", action: "updated analytics in", target: "Market Analysis", time: "3h ago", type: "activity", color: "from-indigo-500 to-blue-600" },
  { user: "RK", action: "mentioned you in", target: "Product Roadmap", time: "4h ago", type: "mention", color: "from-violet-500 to-purple-600" },
]

const statsData = [
  { label: "Active Docs", value: "24", change: "+3", icon: FileText, color: "text-violet-400" },
  { label: "Team Members", value: "12", change: "+1", icon: Users, color: "text-cyan-400" },
  { label: "This Week", value: "89", change: "+12%", icon: TrendingUp, color: "text-emerald-400" },
  { label: "Uptime", value: "99.9%", change: "stable", icon: Activity, color: "text-orange-400" },
]

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  review: { label: "In Review", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  draft: { label: "Draft", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  complete: { label: "Complete", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
}

const activityIcons: Record<string, React.ReactNode> = {
  comment: <MessageSquare className="w-3 h-3" />,
  complete: <CheckCircle2 className="w-3 h-3" />,
  git: <GitBranch className="w-3 h-3" />,
  review: <Star className="w-3 h-3" />,
  share: <ArrowUpRight className="w-3 h-3" />,
  activity: <Activity className="w-3 h-3" />,
  mention: <MessageSquare className="w-3 h-3" />,
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } }
}

export function NormalMode() {
  return (
    <motion.div
      key="normal-mode"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto px-4 py-8 max-w-7xl"
    >
      {/* Stats Row */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {statsData.map((stat) => (
          <motion.div key={stat.label} variants={itemVariants}>
            <Card className="glass hover:border-border hover:shadow-lg transition-all duration-200 group cursor-default">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <span className="text-xs text-emerald-400 font-medium">{stat.change}</span>
                </div>
                <div className="text-2xl font-display font-bold mb-0.5">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Projects Grid - 2/3 width */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-semibold text-lg">Recent Projects</h2>
              <p className="text-sm text-muted-foreground">Your shared workspace documents</p>
            </div>
            <Button variant="secondary" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              New Project
            </Button>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid sm:grid-cols-2 gap-4"
          >
            {projects.map((project) => (
              <motion.div key={project.id} variants={itemVariants}>
                <Card className={`border ${project.borderColor} bg-gradient-to-br ${project.color} hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20 transition-all duration-200 cursor-pointer group`}>
                  <CardHeader className="pb-3 pt-5 px-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{project.icon}</span>
                        <div>
                          <CardTitle className="text-sm leading-tight group-hover:text-primary transition-colors">
                            {project.name}
                          </CardTitle>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusConfig[project.status].className}`}>
                          {statusConfig[project.status].label}
                        </span>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10">
                          <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
                        <span>Progress</span>
                        <span className="font-medium text-foreground">{project.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-violet-400 rounded-full transition-all duration-500"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {project.members.map((initials, i) => (
                          <Avatar key={i} className="h-6 w-6 border-2 border-background ring-0">
                            <AvatarFallback className="text-[9px] font-bold bg-gradient-to-br from-violet-500 to-purple-700 text-white">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {project.comments}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {project.lastEdited}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Activity Feed - 1/3 width */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-semibold text-lg">Activity</h2>
              <p className="text-sm text-muted-foreground">Recent team actions</p>
            </div>
            <button className="text-xs text-primary hover:opacity-80 transition-opacity">
              View all
            </button>
          </div>

          <Card className="glass border-border/50">
            <ScrollArea className="h-[520px]">
              <div className="p-4 space-y-1">
                {activities.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.06, duration: 0.3 }}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group"
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={`text-xs font-bold bg-gradient-to-br ${activity.color} text-white`}>
                          {activity.user}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
                        {activityIcons[activity.type]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        <span className="font-semibold text-foreground">{activity.user}</span>
                        {" "}{activity.action}{" "}
                        <span className="text-primary">{activity.target}</span>
                      </p>
                      <span className="text-[10px] text-muted-foreground/60 mt-0.5 block">{activity.time}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </Card>

          {/* Quick Actions */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Card className="glass border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 cursor-pointer group p-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <FolderOpen className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-xs font-medium">Browse Files</span>
              </div>
            </Card>
            <Card className="glass border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 cursor-pointer group p-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <Users className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-xs font-medium">Invite Team</span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
