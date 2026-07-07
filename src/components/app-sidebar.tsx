"use client"

import * as React from "react"
import {
  LayoutDashboard,
  PenTool,
  TrendingUp,
  Target,
  Settings
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar({ activeTab, setActiveTab, ...props }: React.ComponentProps<typeof Sidebar> & { activeTab: string, setActiveTab: (tab: any) => void }) {
  const navItems = [
    { id: "dashboard", label: "Konten Kreasi", icon: LayoutDashboard },
    { id: "script-writer", label: "AI Script Writer", icon: PenTool },
    { id: "fyp-analyzer", label: "Bedah FYP Video", icon: TrendingUp },
    { id: "hook-trainer", label: "Latih Hook AI", icon: Target },
    { id: "settings", label: "Pengaturan", icon: Settings },
  ]

  return (
    <Sidebar {...props}>
      <SidebarHeader className="p-4 border-b">
         <div className="font-bold text-lg">Salim Mas Mirza</div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="mt-4 px-2 space-y-1">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton 
                isActive={activeTab === item.id} 
                onClick={() => setActiveTab(item.id as any)}
                tooltip={item.label}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
