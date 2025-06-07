import { Play, Heart, Download, MoreVertical, ListMusic, Plus, User, Tag, MessageSquare, ShoppingCart, Gem } from 'lucide-react';
import { Button } from '@/components/@/ui/button';
import { Badge } from '@/components/@/ui/badge';
import { useAudioPlayer, type Track } from '@/contexts/audio-player-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/@/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/@/ui/avatar';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

interface ProjectCardProps {
  project: {
    id: string;
    title: string;
    artworkUrl: string;
    tracks?: Array<any>;
    totalTracks?: number;
    isPopular?: boolean;
    creator?: {
      name: string;
      avatar?: string;
      tag?: string;
    };
  };
  variant?: 'grid' | 'list';
  id: string;
}

const ProjectCard = ({ project, variant, id }: ProjectCardProps) => {
  const { currentTrack, playTrack } = useAudioPlayer();
  const { user } = useAuth();
  const [trackGems, setTrackGems] = useState<Record<string, number>>({});
  
  if (variant === 'list') {
    return null; // Projects only shown in grid view
  }

  // Default creator info if not provided
  const creator = project.creator || {
    name: 'Artist Name',
    avatar: 'https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg',
    tag: 'Producer'
  };

  // Default tracks if not provided
  const tracks = project.tracks || [
    {
      id: `${project.id}-track-1`,
      title: project.title,
      duration: "3:45"
    }
  ];

  const handleGiveGem = async (trackId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error("Please sign in to give gems");
      return;
    }
    
    try {
      // First check if user has gems available
      const { data: statsData, error: statsError } = await supabase
        .from('user_stats')
        .select('gems')
        .eq('user_id', user.id)
        .single();
      
      if (statsError) throw statsError;
      
      if (!statsData || statsData.gems <= 0) {
        toast.error("You don't have any gems to give");
        return;
      }
      
      // Deduct gem from user
      const { error: updateError } = await supabase
        .from('user_stats')
        .update({ gems: statsData.gems - 1 })
        .eq('user_id', user.id);
      
      if (updateError) throw updateError;
      
      // Record the gem in analytics
      const { error: analyticsError } = await supabase
        .from('analytics')
        .insert([{
          event_type: 'gem_given',
          user_id: user.id,
          track_id: trackId,
          data: { project_id: project.id }
        }]);
      
      if (analyticsError) throw analyticsError;
      
      // Update local state
      setTrackGems(prev => ({
        ...prev,
        [trackId]: (prev[trackId] || 0) + 1
      }));
      
      // Trigger a custom event to update the gem count in the header
      window.dispatchEvent(new CustomEvent('gem-balance-update'));
      
      toast.success("Gem given successfully!");
    } catch (error) {
      console.error('Error giving gem:', error);
      toast.error("Failed to give gem");
    }
  };

  return (
    <div id={id} className="group relative rounded-lg overflow-hidden bg-muted/50 hover:bg-muted transition-all duration-300 shadow-sm hover:shadow-md">
      <div className="p-4 space-y-3">
        {/* Project Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-medium">{project.title}</h3>
            <div className="text-xs text-muted-foreground">
              {project.totalTracks || tracks.length} track{(project.totalTracks || tracks.length) !== 1 ? 's' : ''}
            </div>
          </div>
          {project.isPopular && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              Popular
            </Badge>
          )}
        </div>

        {/* Tracks List */}
        <div className="border-t pt-3">
          <div className="max-h-40 overflow-y-auto space-y-0.5 bg-background/50 rounded-lg p-1">
            {tracks.map((track) => (
              <div key={track.id} className="flex items-center">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    playTrack({
                      ...track,
                      projectTitle: project.title,
                      artworkUrl: project.artworkUrl
                    });
                    // Scroll to bottom to ensure player is visible
                    setTimeout(() => {
                      window.scrollTo({
                        top: document.body.scrollHeight,
                        behavior: 'smooth'
                      });
                    }, 100);
                  }}
                  onPointerDown={(e) => {
                    // Prevent drag events from interfering with clicks
                    if (e.pointerType === 'mouse') {
                      e.preventDefault();
                    }
                  }}
                  draggable={false}
                  onDragStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className={`flex-1 flex items-center gap-3 px-2.5 py-2 rounded-md transition-all duration-200 ease-in-out group/track text-left ${
                    currentTrack?.id === track.id 
                      ? 'bg-black text-white font-medium shadow-lg' 
                      : 'hover:bg-black/90 hover:text-white hover:shadow-sm text-foreground/90'
                  }`}
                >
                  <span className={`text-xs tabular-nums w-8 ${currentTrack?.id === track.id ? 'text-white/90' : 'text-muted-foreground/75 group-hover/track:text-white/90'}`}>{track.duration}</span>
                  <span className="truncate text-sm group-hover/track:text-white transition-colors">
                    {track.title}
                  </span>
                </button>
                
                {/* Gem button */}
                <button
                  onClick={(e) => handleGiveGem(track.id, e)}
                  className="ml-1 p-1.5 rounded-full hover:bg-primary/10 transition-colors"
                  title="Give a gem"
                >
                  <Gem 
                    className={`h-4 w-4 transition-colors ${
                      (trackGems[track.id] || 0) > 0 
                        ? 'text-violet-500' 
                        : 'text-gray-400 hover:text-violet-500'
                    }`} 
                  />
                  {(trackGems[track.id] || 0) > 0 && (
                    <span className="absolute -top-1 -right-1 bg-violet-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                      {trackGems[track.id]}
                    </span>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Creator Info and Action Icons */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={creator.avatar} alt={creator.name} />
              <AvatarFallback>{creator.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{creator.name}</p>
              <div className="flex items-center gap-1">
                <Tag className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground truncate">{creator.tag}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <MessageSquare 
              className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary hover:scale-110 transition-all" 
              title="Contact Creator"
            />
            <ShoppingCart 
              className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary hover:scale-110 transition-all" 
              title="Buy Now"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;