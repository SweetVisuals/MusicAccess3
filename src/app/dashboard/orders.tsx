import { useState } from "react";
import { AppSidebar } from "@/components/dashboard/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/@/ui/sidebar";
import { SiteHeader } from "@/components/dashboard/layout/site-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/@/ui/card";
import { Button } from "@/components/@/ui/button";
import { Badge } from "@/components/@/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/@/ui/tabs";
import { ChevronDown, ChevronUp, CreditCard, Calendar, User, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface Order {
  id: string;
  type: 'beat' | 'service';
  title: string;
  price: number;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: string;
  date: string;
  customer: {
    name: string;
    email: string;
    location: string;
  };
  details?: string;
}

const orders: Order[] = [
  {
    id: "ORD-001",
    type: "beat",
    title: "Summer Vibes Beat",
    price: 299.99,
    status: "completed",
    paymentMethod: "Credit Card",
    date: "2024-03-15",
    customer: {
      name: "John Doe",
      email: "john@example.com",
      location: "New York, USA"
    },
    details: "Exclusive rights purchase"
  },
  {
    id: "ORD-002",
    type: "service",
    title: "Mix & Master",
    price: 499.99,
    status: "pending",
    paymentMethod: "PayPal",
    date: "2024-03-14",
    customer: {
      name: "Jane Smith",
      email: "jane@example.com",
      location: "London, UK"
    },
    details: "Full track mixing and mastering"
  },
  {
    id: "ORD-003",
    type: "beat",
    title: "Trap Beat Pack",
    price: 149.99,
    status: "failed",
    paymentMethod: "Credit Card",
    date: "2024-03-13",
    customer: {
      name: "Mike Wilson",
      email: "mike@example.com",
      location: "Toronto, Canada"
    },
    details: "5-beat pack with basic license"
  }
];

const OrderCard = ({ order }: { order: Order }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'failed':
        return 'bg-red-500/10 text-red-500';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <CardTitle className="text-lg">{order.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <span>{order.id}</span>
                <span>•</span>
                <span>${order.price.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className={`${getStatusColor(order.status)} flex items-center gap-1`}>
              {getStatusIcon(order.status)}
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="px-4 pb-4 pt-0">
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{order.customer.name}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {order.customer.email}
              </div>
              <div className="text-sm text-muted-foreground">
                {order.customer.location}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span>{order.paymentMethod}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(order.date).toLocaleDateString()}</span>
              </div>
              {order.details && (
                <div className="text-sm text-muted-foreground">
                  {order.details}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default function OrdersPage() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 animate-fade-in p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Orders</h1>
                <p className="text-muted-foreground">Manage your beat sales and services</p>
              </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList>
                <TabsTrigger value="all">All Orders</TabsTrigger>
                <TabsTrigger value="beats">Beat Sales</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </TabsContent>

              <TabsContent value="beats" className="mt-6">
                {orders
                  .filter((order) => order.type === 'beat')
                  .map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
              </TabsContent>

              <TabsContent value="services" className="mt-6">
                {orders
                  .filter((order) => order.type === 'service')
                  .map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}