import { useState, useEffect } from 'react';
import useProfile from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';
import { Service } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/@/ui/card';
import { Badge } from '@/components/@/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, Clock, DollarSign, Star, CheckCircle } from 'lucide-react';

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
  if (!services.length) return <div className="p-4">No services found.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      {services.map((service) => (
        <Card key={service.id} className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{service.title}</CardTitle>
                <CardDescription className="mt-2">
                  {service.description.length > 100 
                    ? `${service.description.substring(0, 100)}...` 
                    : service.description}
                </CardDescription>
              </div>
              <Badge variant={service.is_active ? "default" : "secondary"}>
                {service.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-4">
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
              
              {service.is_featured && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Featured
                </Badge>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              Created {new Date(service.created_at).toLocaleDateString()}
            </div>
            <Button size="sm">Contact</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default AlbumsTab;