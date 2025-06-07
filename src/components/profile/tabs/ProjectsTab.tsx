import React from 'react';
import useProfile from '@/hooks/useProfile';
import { useTracks } from '@/hooks/useTracks';
import ProjectCard from '../music/ProjectCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ProjectsTabProps {
  viewMode?: 'grid' | 'list';
  sortBy?: 'latest' | 'popular' | 'oldest';
  tracks?: any[];
  stats?: any;
}

const ProjectsTab = ({ viewMode = 'grid', sortBy = 'latest', tracks: propTracks, stats }: ProjectsTabProps) => {
  const { profile } = useProfile();
  const userId = profile?.id;
  const { tracks: fetchedTracks, loading, error } = useTracks(userId || '');
  
  // Use provided tracks prop if available, otherwise use fetched tracks
  const tracks = propTracks || fetchedTracks;

  if (!userId) return <div className="p-4">Please log in to view your projects.</div>;
  if (loading) return <div className="p-4 animate-pulse">Loading projects...</div>;
  if (error) return <div className="p-4 text-destructive">Error: {error}</div>;
  
  // Optionally sort tracks (implement sort logic as needed)
  let sortedTracks = [...tracks];
  if (sortBy === 'latest') sortedTracks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  if (sortBy === 'oldest') sortedTracks.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  // Add 'popular' sorting if you have a metric

  if (!tracks.length) {
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
            <path d="M21 15V6"></path>
            <path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"></path>
            <path d="M12 12H3"></path>
            <path d="M16 6H3"></path>
            <path d="M12 18H3"></path>
          </svg>
        </div>
        <h3 className="text-xl font-medium mb-2">No Projects Found</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Create your first project to showcase your music and audio work.
        </p>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>
    );
  }

  return (
    <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in' : 'gap-4'}`}>
      {sortedTracks.map((track) => (
        <ProjectCard
          key={track.id}
          project={{
            id: track.id,
            title: track.title || 'Untitled Project',
            artworkUrl: track.cover_art_url || '/default-project.jpg',
            tracks: [],
            totalTracks: 1,
            isPopular: false,
          }}
          variant="grid"
          id={track.id}
        />
      ))}
    </div>
  );
};

export default ProjectsTab;