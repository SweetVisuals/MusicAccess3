import { useState, useEffect } from 'react';
import useProfile from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';
import { Service } from '@/lib/types';
import { Card, CardContent } from '@/components/@/ui/card';
import { Badge } from '@/components/@/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, Clock, DollarSign, Star, CheckCircle, MessageSquare } from 'lucide-react';

const AlbumsTab = () => {
  const { profile } = useProfile();
  const userId = profile?.id;
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      if (!userId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setServices(data || []);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError(err instanceof Error ? err.message : 'Unknown error fetching services');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [userId]);

  if (!userId) return <div className="p-4">Please log in to view services.</div>;
  if (loading) return <div className="p-4 animate-pulse">Loading services...</div>;
  if (error) return <div className="p-4 text-destructive">Error: {error}</div>;
  
  if (!services.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted/50 p-6 rounded-full mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-12 w-12 text-muted-foreground"
          >
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
        </div>
        <h3 className="text-xl font-medium mb-2">No Services Found</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Create your first service to showcase your skills and offerings.
        </p>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Service
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
      {services.map((service) => (
        <Card key={service.id} className="overflow-hidden border hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            <div className="flex flex-col h-full">
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-lg">{service.title}</h3>
                  <Badge variant={service.is_active ? "default" : "secondary"} className="text-xs">
                    {service.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {service.description}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {service.type}
                </Badge>
                
                {service.price && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    ${service.price}
                  </Badge>
                )}
                
                {service.delivery_time && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {service.delivery_time}
                  </Badge>
                )}
                
                {service.revisions && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {service.revisions} revision{service.revisions !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              
              <div className="mt-auto flex gap-2">
                <Button size="sm" className="flex-1">
                  Book Now
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

function Plus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}

export default AlbumsTab;