import { useState, useEffect } from "react"
import { LogInIcon, UserPlusIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import {
  BellIcon,
  CreditCardIcon,
  LogOutIcon,
  MoreVerticalIcon,
  UserCircleIcon,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/@/ui/button"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/@/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/@/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/@/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { Progress } from "@/components/@/ui/progress"

export function NavUser() {
  const { isMobile } = useSidebar()
  const { user: authUser, isLoading: isAuthLoading, signOut } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<{
    username: string | null
    email: string | null
    profile_url: string | null
  } | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  useEffect(() => {
    if (!authUser) {
      setProfile(null)
      setIsProfileLoading(false)
      setProfileError(null)
      return
    }

    const fetchProfile = async () => {
      setIsProfileLoading(true)
      setProfileError(null)
      
      try {
        // Check if Supabase is properly configured
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
          throw new Error('Supabase configuration missing. Please check your environment variables.')
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('username, email, profile_url')
          .eq('id', authUser.id)
          .single()

        if (error) {
          // Handle specific Supabase errors
          if (error.code === 'PGRST116') {
            // No rows returned - profile doesn't exist yet
            console.log('Profile not found, using auth user data')
            setProfile({
              username: null,
              email: authUser.email || null,
              profile_url: null
            })
          } else {
            throw error
          }
        } else {
          setProfile(data)
        }
      } catch (error: any) {
        console.error('Error fetching profile:', error)
        setProfileError(error.message || 'Failed to load profile')
        
        // Fallback to auth user data
        setProfile({
          username: null,
          email: authUser.email || null,
          profile_url: null
        })
      } finally {
        setIsProfileLoading(false)
      }
    }

    fetchProfile()
  }, [authUser])

  if (isAuthLoading || isProfileLoading) return null

  if (!authUser) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="lg\" variant="outline\" className="gap-2">
            <LogInIcon className="h-4 w-4" />
            <span>Login / Signup</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          side={isMobile ? "bottom" : "right"}
          align="end"
          sideOffset={4}
        >
          <DropdownMenuItem asChild>
            <Link to="/auth/login" className="w-full">
              <LogInIcon className="mr-2 h-4 w-4" />
              <span>Login</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/auth/signup" className="w-full">
              <UserPlusIcon className="mr-2 h-4 w-4" />
              <span>Sign Up</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Use profile data or fallback to auth user data
  const displayProfile = profile || {
    username: null,
    email: authUser.email || null,
    profile_url: null
  }

  return (
    <SidebarMenu>
      {/* Storage Progress Bar */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-sidebar-foreground/70">
            Storage
          </span>
          <span className="text-xs font-medium text-sidebar-foreground/70">
            25% used
          </span>
        </div>
        <Progress 
          value={25} 
          className="h-2 bg-sidebar-accent [&>div]:bg-sidebar-primary"
        />
      </div>

      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-full bg-gray-300">
                <AvatarImage src={displayProfile.profile_url || ''} alt={displayProfile.username || ''} />
                <AvatarFallback className="rounded-full bg-gray-300">
                  {displayProfile.username?.charAt(0).toUpperCase() || authUser.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {displayProfile.username || authUser.email?.split('@')[0]}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {displayProfile.email || authUser.email}
                </span>
              </div>
              <MoreVerticalIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-full bg-gray-300">
                  <AvatarImage src={displayProfile.profile_url || ''} alt={displayProfile.username || ''} />
                  <AvatarFallback className="rounded-full bg-gray-300">
                    {displayProfile.username?.charAt(0).toUpperCase() || authUser.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {displayProfile.username || authUser.email?.split('@')[0]}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {displayProfile.email || authUser.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate('/user/user-profile')}>
                <UserCircleIcon className="mr-2 h-4 w-4" />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/billing')}>
                <CreditCardIcon className="mr-2 h-4 w-4" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <BellIcon className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOutIcon className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}