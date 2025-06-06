import * as React from "react"
import {
  ArrowUpCircleIcon,
  BarChartIcon,
  CameraIcon,
  ClipboardListIcon,
  DatabaseIcon,
  FileCodeIcon,
  FileIcon,
  FileTextIcon,
  FolderIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  ListIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
  ShoppingBag,
  DollarSign,
  HardDriveIcon
} from "lucide-react"

import { NavMain } from "@/components/dashboard/layout/nav-main"
import { NavSecondary } from "@/components/dashboard/layout/nav-secondary"
import { NavUser } from "@/components/dashboard/nav-user"
import { Progress } from "@/components/@/ui/progress"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/@/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const data = {
  navMain: [
    {
      title: "Overview",
      url: "/user/dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Orders",
      url: "/dashboard/orders",
      icon: ShoppingBag,
    },
    {
      title: "Sales",
      url: "/dashboard/sales",
      icon: DollarSign,
    },
    {
      title: "Manage Files",
      url: "/dashboard/projects",
      icon: FolderIcon,
    },
    {
      title: "Post A Service",
      url: "/dashboard/services",
      icon: DatabaseIcon,
    },
    {
      title: "Contracts",
      url: "/dashboard/contracts",
      icon: FileTextIcon,
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: BarChartIcon,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: SettingsIcon,
    },
    {
      title: "Get Help",
      url: "#",
      icon: HelpCircleIcon,
    },
    {
      title: "Search",
      url: "#",
      icon: SearchIcon,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: DatabaseIcon,
    },
    {
      name: "Reports",
      url: "#",
      icon: ClipboardListIcon,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: FileIcon,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const [storageUsed, setStorageUsed] = useState(0) // in bytes
  const [storagePercentage, setStoragePercentage] = useState(0)
  
  // 1GB free storage in bytes
  const STORAGE_LIMIT = 1024 * 1024 * 1024
  
  // Fetch user's files to calculate storage usage
  useEffect(() => {
    if (!user?.id) return
    
    const fetchStorageUsage = async () => {
      try {
        // Get all files for this user
        const { data, error } = await supabase
          .from('files')
          .select('size')
          .eq('user_id', user.id)
        
        if (error) throw error
        
        // Calculate total size
        const totalSize = data?.reduce((sum, file) => sum + (file.size || 0), 0) || 0
        setStorageUsed(totalSize)
        
        // Calculate percentage of storage used
        const percentage = Math.min(100, (totalSize / STORAGE_LIMIT) * 100)
        setStoragePercentage(percentage)
      } catch (error) {
        console.error('Error fetching storage usage:', error)
      }
    }
    
    fetchStorageUsage()
    
    // Set up a subscription to listen for file changes
    const channel = supabase
      .channel('storage-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'files',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchStorageUsage()
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])
  
  // Format storage size for display
  const formatStorageSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    
    const units = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Music Access.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
        
        {/* Storage Progress Bar */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-sidebar-foreground/70 flex items-center gap-1">
              <HardDriveIcon className="h-3 w-3" />
              Storage
            </span>
            <span className="text-xs font-medium text-sidebar-foreground/70">
              {formatStorageSize(storageUsed)} / 1 GB
            </span>
          </div>
          <Progress 
            value={storagePercentage} 
            className="h-2 bg-sidebar-accent [&>div]:bg-sidebar-primary"
          />
          <div className="mt-1 text-xs text-sidebar-foreground/50 text-right">
            {(100 - storagePercentage).toFixed(1)}% free
          </div>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}