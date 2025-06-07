import { useState, useEffect } from 'react';
import useProfile from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';
import { Service } from '@/lib/types';
import { Card, CardContent } from '@/components/@/ui/card';
import { Badge } from '@/components/@/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, Clock, CheckCircle, MessageSquare, Star, ShoppingCart, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/@/ui/avatar';

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
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="bg-muted/50 p-6 rounded-full mb-4">
          <Briefcase className="h-12 w-12 text-muted-foreground/70" />
        </div>
        <h3 className="text-xl font-medium mb-2">No Services Found</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          You haven't created any services yet. Services allow you to offer your skills to potential clients.
        </p>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Your First Service
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
      {services.map((service) => (
        <Card key={service.id} className="overflow-hidden border hover:border-primary/20 transition-all duration-300 hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatarUrl} />
                <AvatarFallback>{profile?.full_name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-base truncate">{service.title}</h3>
                <div className="flex items-center gap-1">
                  <Badge variant={service.is_active ? "default" : "secondary"} className="text-[10px] px-1 h-4">
                    {service.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{service.type}</span>
                </div>
              </div>
              {service.is_featured && (
                <Badge variant="secondary" className="h-5 flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-500" />
                  <span className="text-[10px]">Featured</span>
                </Badge>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {service.description}
            </p>
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {service.delivery_time && (
                  <div className="flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3 text-primary" />
                    <span>{service.delivery_time}</span>
                  </div>
                )}
                
                {service.revisions !== null && service.revisions !== undefined && (
                  <div className="flex items-center gap-1 text-xs">
                    <CheckCircle className="h-3 w-3 text-primary" />
                    <span>{service.revisions} rev.</span>
                  </div>
                )}
              </div>
              
              {service.price && (
                <div className="text-right">
                  <div className="text-sm font-bold text-primary">${service.price}</div>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1 flex-1">
                <MessageSquare className="h-3 w-3" />
                Contact
              </Button>
              <Button size="sm" className="h-8 text-xs gap-1 flex-1">
                <ShoppingCart className="h-3 w-3" />
                Book Now
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AlbumsTab;