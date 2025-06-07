import React from 'react';
import useProfile from '@/hooks/useProfile';
import { useTracks } from '@/hooks/useTracks';
import ProjectCard from '../music/ProjectCard';
import ProjectListView from '../music/ProjectListView';
import { ProfileStats } from '@/lib/types';

interface ProjectsTabProps {
  viewMode?: 'grid' | 'list';
  sortBy?: 'latest' | 'popular' | 'oldest';
  tracks?: any[];
  stats?: ProfileStats | null;
}

const ProjectsTab = ({ viewMode = 'grid', sortBy = 'latest', tracks: propTracks, stats }: ProjectsTabProps) => {
  const { profile } = useProfile();
  const userId = profile?.id;
  const { tracks: hookTracks, loading, error } = useTracks(userId || '');
  
  // Use provided tracks from props if available, otherwise use tracks from hook
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
      <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
        <h3 className="text-lg font-medium mb-2">No projects found</h3>
        <p className="text-muted-foreground mb-4">
          You haven't created any projects yet. Start by uploading your first project.
        </p>
        <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
          Upload Project
        </button>
      </div>
    );
  }

  return (
    <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in' : 'gap-4'}`}>
      {viewMode === 'grid' ? (
        sortedTracks.map((track) => (
          <ProjectCard
            key={track.id}
            id={track.id}
            project={{
              id: track.id,
              title: track.title || 'Untitled Project',
              artworkUrl: track.cover_art_url || 'https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg',
              tracks: [
                { id: `${track.id}-1`, title: track.title, duration: '3:45' }
              ],
              totalTracks: 1,
              isPopular: false,
              creator: {
                name: profile?.full_name || 'Artist',
                avatar: profile?.avatarUrl || 'https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg',
                tag: profile?.professionalTitle || 'Producer'
              }
            }}
            variant="grid"
          />
        ))
      ) : (
        sortedTracks.map((track) => (
          <ProjectListView
            key={track.id}
            id={track.id}
            project={{
              id: track.id,
              title: track.title || 'Untitled Project',
              artworkUrl: track.cover_art_url || 'https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg',
              tracks: [
                { id: `${track.id}-1`, title: track.title, duration: '3:45' }
              ],
              totalTracks: 1,
              isPopular: false
            }}
          />
        ))
      )}
    </div>
  );
};

export default ProjectsTab;