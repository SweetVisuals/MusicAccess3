import { Play, Heart, Download, MoreVertical, ListMusic, Plus, User, Tag, MessageSquare } from 'lucide-react';
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
    price?: number;
  };
  variant?: 'grid' | 'list';
  id: string;
}

const ProjectCard = ({ project, variant, id }: ProjectCardProps) => {
  const { currentTrack, playTrack } = useAudioPlayer();
  if (variant === 'list') {
    return null; // Projects only shown in grid view
  }

  // Default creator info if not provided
  const creator = project.creator || {
    name: 'Artist Name',
    avatar: 'https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg',
    tag: 'Producer'
  };

  // Default price if not provided
  const price = project.price || 29.99;

  return (
    <div id={id} className="group relative rounded-lg overflow-hidden bg-muted/50 hover:bg-muted transition-all duration-300 shadow-sm hover:shadow-md">
      <div className="p-4 space-y-3">
        {/* Project Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-medium">{project.title}</h3>
            <div className="text-xs text-muted-foreground">
              {project.totalTracks} track{project.totalTracks !== 1 ? 's' : ''}
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
            {project.tracks?.slice(0, 10).map((track) => (
              <button
                key={track.id}
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
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-md transition-all duration-200 ease-in-out group/track text-left ${
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
            ))}
          </div>
        </div>

        {/* Creator Info */}
        <div className="flex items-center gap-3 pt-2 border-t">
          <Avatar className="h-8 w-8">
            <AvatarImage src={creator.avatar} alt={creator.name} />
            <AvatarFallback>{creator.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{creator.name}</p>
            <div className="flex items-center gap-1">
              <Tag className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{creator.tag}</span>
            </div>
          </div>
        </div>

        {/* Purchase Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button className="flex-1 h-9" size="sm">
            Buy Now ${price}
          </Button>
          <Button variant="outline" size="sm" className="h-9">
            <MessageSquare className="h-4 w-4 mr-2" />
            Contact
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;