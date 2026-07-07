"use client"

import * as React from "react"
import {
  LayoutDashboard,
  PenTool,
  TrendingUp,
  Target,
  Settings,
  Store,
  Briefcase
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar({ activeTab, setActiveTab, ...props }: React.ComponentProps<typeof Sidebar> & { activeTab: string, setActiveTab: (tab: any) => void }) {
  
  const data = {
    user: {
      name: "Salim Mas Mirza",
      email: "salim@babarafi.com",
      avatar: "/avatars/salim.jpg", // placeholder, Shadcn's avatar will handle fallback
    },
    teams: [
      {
        name: "Baba Rafi",
        logo: <Store className="size-4" />,
        plan: "Enterprise",
      },
      {
        name: "Personal Brand",
        logo: <Briefcase className="size-4" />,
        plan: "Creator",
      }
    ],
    navMain: [
      {
        title: "Workspace",
        url: "#",
        icon: <LayoutDashboard />,
        isActive: true,
        items: [
          {
            title: "Konten Kreasi",
            url: "#",
            onClick: () => setActiveTab("dashboard")
          },
          {
            title: "AI Script Writer",
            url: "#",
            onClick: () => setActiveTab("script-writer")
          },
          {
            title: "Bedah FYP Video",
            url: "#",
            onClick: () => setActiveTab("fyp-analyzer")
          },
          {
            title: "Latih Hook AI",
            url: "#",
            onClick: () => setActiveTab("hook-trainer")
          }
        ],
      },
      {
        title: "Sistem",
        url: "#",
        icon: <Settings />,
        isActive: false,
        items: [
          {
            title: "Pengaturan",
            url: "#",
            onClick: () => setActiveTab("settings")
          }
        ],
      }
    ],
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
