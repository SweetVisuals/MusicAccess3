import React from 'react';
import useProfile from '@/hooks/useProfile';
import { useTracks } from '@/hooks/useTracks';
import ProjectCard from '../music/ProjectCard';
import { FileMusic } from 'lucide-react';

interface ProjectsTabProps {
  viewMode?: 'grid' | 'list';
  sortBy?: 'latest' | 'popular' | 'oldest';
  tracks?: any[];
  stats?: any;
}

const ProjectsTab = ({ viewMode = 'grid', sortBy = 'latest', tracks: propTracks, stats }: ProjectsTabProps) => {
  const { profile } = useProfile();
  const userId = profile?.id;
  const { tracks: hookTracks, loading, error } = useTracks(userId || '');
  
  // Use provided tracks prop if available, otherwise use tracks from hook
  const tracks = propTracks || hookTracks;

  if (!userId) return <div className="p-4">Please log in to view your projects.</div>;
  if (loading) return <div className="p-4 animate-pulse">Loading projects...</div>;
  if (error) return <div className="p-4 text-destructive">Error: {error}</div>;
  
  // Optionally sort tracks (implement sort logic as needed)
  let sortedTracks = [...tracks];
  if (sortBy === 'latest') sortedTracks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  if (sortBy === 'oldest') sortedTracks.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  // Add 'popular' sorting if you have a metric

  if (!sortedTracks.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-muted/50 p-6 rounded-full mb-4">
          <FileMusic className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-medium mb-2">No projects found</h3>
        <p className="text-muted-foreground max-w-md">
          You haven't uploaded any projects yet. Start creating and sharing your music with the world.
        </p>
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
            artworkUrl: track.cover_art_url || 'https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg',
            tracks: [],
            totalTracks: 1,
            isPopular: false,
          }}
          variant={viewMode}
          id={track.id}
        />
      ))}
    </div>
  );
};

export default ProjectsTab;