import { useState, useEffect } from 'react';
import useProfile from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';
import { Service } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/@/ui/card';
import { Badge } from '@/components/@/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, Clock, DollarSign, Star, CheckCircle, MessageSquare, Calendar, ArrowRight, ShoppingCart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/@/ui/avatar';
import { Separator } from '@/components/@/ui/separator';

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
          Create Your First Service
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      {services.map((service) => (
        <Card key={service.id} className="overflow-hidden border-2 hover:border-primary/20 transition-all duration-300 hover:shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatarUrl} />
                  <AvatarFallback>{profile?.full_name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={service.is_active ? "default" : "secondary"} className="text-xs">
                      {service.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                      <Briefcase className="h-3 w-3" />
                      {service.type}
                    </Badge>
                    {service.is_featured && (
                      <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                        <Star className="h-3 w-3 text-yellow-500" />
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {service.price && (
                <div className="text-right">
                  <div className="text-xl font-bold text-primary">${service.price}</div>
                  <div className="text-xs text-muted-foreground">Starting price</div>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="pb-3">
            <p className="text-sm text-muted-foreground mb-4">
              {service.description.length > 150 
                ? `${service.description.substring(0, 150)}...` 
                : service.description}
            </p>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              {service.delivery_time && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="p-1.5 rounded-full bg-primary/10">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span>{service.delivery_time} delivery</span>
                </div>
              )}
              
              {service.revisions !== null && service.revisions !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="p-1.5 rounded-full bg-primary/10">
                    <CheckCircle className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span>{service.revisions} revision{service.revisions !== 1 ? 's' : ''}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <div className="p-1.5 rounded-full bg-primary/10">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                </div>
                <span>Since {new Date(service.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <div className="p-1.5 rounded-full bg-primary/10">
                  <Star className="h-3.5 w-3.5 text-primary" />
                </div>
                <span>5.0 (12 reviews)</span>
              </div>
            </div>
          </CardContent>
          
          <Separator />
          
          <CardFooter className="flex justify-between pt-3">
            <Button variant="outline" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Contact
            </Button>
            <Button className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Book Now
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default AlbumsTab;