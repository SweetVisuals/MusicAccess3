import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/dashboard/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/@/ui/sidebar"
import { SiteHeader } from "@/components/dashboard/layout/site-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartAreaInteractive } from "@/components/dashboard/layout/chart-area-interactive"
import { DataTable } from "@/components/dashboard/data-table"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Users, DollarSign, Music, PlayCircle, ChevronLeft, ChevronRight, Calendar, Filter, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/@/ui/select"

const chartMetrics = [
  { id: 'revenue', label: 'Revenue' },
  { id: 'plays', label: 'Total Plays' },
  { id: 'orders', label: 'Service Orders' },
  { id: 'clients', label: 'Active Clients' }
];

interface DashboardMetrics {
  totalRevenue: number;
  totalPlays: number;
  activeServices: number;
  activeClients: number;
  revenueChange: number;
  playsChange: number;
  servicesChange: number;
  clientsChange: number;
}

interface ChartData {
  date: string;
  revenue?: number;
  plays?: number;
  orders?: number;
  clients?: number;
}

export default function Page() {
  const { user } = useAuth()
  const [currentMetric, setCurrentMetric] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    totalPlays: 0,
    activeServices: 0,
    activeClients: 0,
    revenueChange: 0,
    playsChange: 0,
    servicesChange: 0,
    clientsChange: 0
  })
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [serviceOrders, setServiceOrders] = useState([])

  const nextMetric = () => {
    setCurrentMetric((prev) => (prev + 1) % chartMetrics.length);
  };

  const previousMetric = () => {
    setCurrentMetric((prev) => (prev - 1 + chartMetrics.length) % chartMetrics.length);
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user, timeRange])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      // Fetch dashboard metrics
      await Promise.all([
        fetchMetrics(),
        fetchChartData(),
        fetchServiceOrders()
      ])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMetrics = async () => {
    try {
      // Fetch revenue data
      const { data: revenueData, error: revenueError } = await supabase
        .from('analytics_events')
        .select('event_value')
        .eq('user_id', user?.id)
        .eq('event_category', 'revenue')
        .gte('created_at', getDateFromRange(timeRange))
      
      if (revenueError) throw revenueError
      
      const totalRevenue = revenueData?.reduce((sum, item) => sum + (item.event_value || 0), 0) || 0
      
      // Fetch previous period revenue for comparison
      const { data: prevRevenueData, error: prevRevenueError } = await supabase
        .from('analytics_events')
        .select('event_value')
        .eq('user_id', user?.id)
        .eq('event_category', 'revenue')
        .gte('created_at', getDateFromRange(timeRange, true))
        .lt('created_at', getDateFromRange(timeRange))
      
      if (prevRevenueError) throw prevRevenueError
      
      const prevTotalRevenue = prevRevenueData?.reduce((sum, item) => sum + (item.event_value || 0), 0) || 0
      const revenueChange = prevTotalRevenue === 0 ? 100 : ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100
      
      // Fetch play count
      const { data: playsData, error: playsError } = await supabase
        .from('analytics_events')
        .select('count')
        .eq('user_id', user?.id)
        .eq('event_name', 'track_play')
        .gte('created_at', getDateFromRange(timeRange))
      
      if (playsError) throw playsError
      
      const totalPlays = playsData?.length || 0
      
      // Fetch previous period plays for comparison
      const { data: prevPlaysData, error: prevPlaysError } = await supabase
        .from('analytics_events')
        .select('count')
        .eq('user_id', user?.id)
        .eq('event_name', 'track_play')
        .gte('created_at', getDateFromRange(timeRange, true))
        .lt('created_at', getDateFromRange(timeRange))
      
      if (prevPlaysError) throw prevPlaysError
      
      const prevTotalPlays = prevPlaysData?.length || 0
      const playsChange = prevTotalPlays === 0 ? 100 : ((totalPlays - prevTotalPlays) / prevTotalPlays) * 100
      
      // Fetch active services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('count')
        .eq('user_id', user?.id)
        .eq('is_active', true)
      
      if (servicesError) throw servicesError
      
      const activeServices = servicesData?.length || 0
      
      // For demo purposes, we'll simulate some client data
      const activeClients = Math.floor(Math.random() * 100) + 50
      const clientsChange = Math.floor(Math.random() * 40) - 20
      const servicesChange = Math.floor(Math.random() * 30) - 10
      
      setMetrics({
        totalRevenue,
        totalPlays,
        activeServices,
        activeClients,
        revenueChange,
        playsChange,
        servicesChange,
        clientsChange
      })
    } catch (error) {
      console.error('Error fetching metrics:', error)
    }
  }

  const fetchChartData = async () => {
    try {
      // Generate dates for the selected time range
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
      const dates = Array.from({ length: days }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (days - 1 - i))
        return date.toISOString().split('T')[0]
      })
      
      // For demo purposes, we'll generate some realistic data
      // In a real app, this would come from the database
      const data = dates.map(date => {
        const baseRevenue = Math.floor(Math.random() * 500) + 100
        const basePlays = Math.floor(Math.random() * 200) + 50
        const baseOrders = Math.floor(Math.random() * 10) + 1
        const baseClients = Math.floor(Math.random() * 5) + 1
        
        // Add some trends and patterns
        const dayOfWeek = new Date(date).getDay()
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
        const weekendMultiplier = isWeekend ? 1.5 : 1
        
        return {
          date,
          revenue: Math.round(baseRevenue * weekendMultiplier),
          plays: Math.round(basePlays * weekendMultiplier),
          orders: Math.round(baseOrders * (isWeekend ? 1.2 : 1)),
          clients: Math.round(baseClients * (isWeekend ? 1.3 : 1))
        }
      })
      
      setChartData(data)
    } catch (error) {
      console.error('Error fetching chart data:', error)
    }
  }

  const fetchServiceOrders = async () => {
    try {
      // In a real app, this would fetch from a service_orders table
      // For demo purposes, we'll use the existing data
      const { data, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('user_id', user?.id)
        .eq('event_category', 'order')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (error) throw error
      
      // Transform the data for the table
      const orders = data?.map(event => {
        const metadata = event.metadata || {}
        return {
          id: event.id,
          client: metadata.client_name || 'Anonymous',
          service: metadata.service_name || 'Unknown Service',
          price: metadata.price || 0,
          status: metadata.status || 'pending',
          date: new Date(event.created_at).toISOString().split('T')[0]
        }
      }) || []
      
      // If we don't have enough real data, add some demo data
      if (orders.length < 4) {
        const demoOrders = [
          {
            id: "1",
            client: "John Doe",
            service: "Mix & Master",
            price: 299.99,
            status: "pending",
            date: "2024-03-15"
          },
          {
            id: "2", 
            client: "Jane Smith",
            service: "Vocal Recording",
            price: 149.99,
            status: "accepted",
            date: "2024-03-14"
          },
          {
            id: "3",
            client: "Mike Johnson",
            service: "Music Production",
            price: 499.99,
            status: "completed",
            date: "2024-03-13"
          },
          {
            id: "4",
            client: "Sarah Williams",
            service: "Sound Design",
            price: 199.99,
            status: "rejected",
            date: "2024-03-12"
          }
        ]
        
        // Add only as many demo orders as needed
        const neededDemoOrders = 4 - orders.length
        setServiceOrders([...orders, ...demoOrders.slice(0, neededDemoOrders)])
      } else {
        setServiceOrders(orders)
      }
    } catch (error) {
      console.error('Error fetching service orders:', error)
    }
  }

  // Helper function to get date from range
  const getDateFromRange = (range: string, previous = false) => {
    const now = new Date()
    let days = 0
    
    switch (range) {
      case '7d':
        days = 7
        break
      case '30d':
        days = 30
        break
      case '90d':
        days = 90
        break
      default:
        days = 30
    }
    
    if (previous) {
      // For previous period, go back 2x the days
      now.setDate(now.getDate() - (days * 2))
    } else {
      now.setDate(now.getDate() - days)
    }
    
    return now.toISOString()
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 animate-fade-in p-8">
            {/* Time Range Selector */}
            <div className="flex justify-end">
              <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d') => setTimeRange(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-9 flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-muted-foreground">Loading...</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">${metrics.totalRevenue.toFixed(2)}</div>
                      <p className="text-xs text-muted-foreground flex items-center">
                        {metrics.revenueChange >= 0 ? (
                          <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                        ) : (
                          <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                        )}
                        {Math.abs(metrics.revenueChange).toFixed(1)}% from last period
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Services</CardTitle>
                  <Music className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-9 flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-muted-foreground">Loading...</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{metrics.activeServices}</div>
                      <p className="text-xs text-muted-foreground flex items-center">
                        {metrics.servicesChange >= 0 ? (
                          <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                        ) : (
                          <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                        )}
                        {Math.abs(metrics.servicesChange).toFixed(1)}% from last period
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
                  <PlayCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-9 flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-muted-foreground">Loading...</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{metrics.totalPlays.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground flex items-center">
                        {metrics.playsChange >= 0 ? (
                          <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                        ) : (
                          <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                        )}
                        {Math.abs(metrics.playsChange).toFixed(1)}% from last period
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-9 flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-muted-foreground">Loading...</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">{metrics.activeClients}</div>
                      <p className="text-xs text-muted-foreground flex items-center">
                        {metrics.clientsChange >= 0 ? (
                          <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                        ) : (
                          <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                        )}
                        {Math.abs(metrics.clientsChange).toFixed(1)}% from last period
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Chart */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{chartMetrics[currentMetric].label}</CardTitle>
                  <CardDescription>
                    Analytics over time
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={previousMetric}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextMetric}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pl-2">
                {isLoading ? (
                  <div className="h-[250px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <ChartAreaInteractive data={chartData} activeMetric={chartMetrics[currentMetric].id} />
                )}
              </CardContent>
            </Card>

            {/* Service Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Service Orders</CardTitle>
                <CardDescription>
                  Manage your incoming service requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[200px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <DataTable data={serviceOrders} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}