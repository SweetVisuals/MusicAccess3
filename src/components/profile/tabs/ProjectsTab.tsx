import React from 'react';
import useProfile from '@/hooks/useProfile';
import { useTracks } from '@/hooks/useTracks';
import ProjectCard from '../music/ProjectCard';

interface ProjectsTabProps {
  viewMode?: 'grid' | 'list';
  sortBy?: 'latest' | 'popular' | 'oldest';
}

const ProjectsTab = ({ viewMode = 'grid', sortBy = 'latest' }: ProjectsTabProps) => {
  const { profile } = useProfile();
  const userId = profile?.id;
  const { tracks, loading, error } = useTracks(userId || '');

  if (!userId) return <div className="p-4">Please log in to view your projects.</div>;
  if (loading) return <div className="p-4 animate-pulse">Loading projects...</div>;
  if (error) return <div className="p-4 text-destructive">Error: {error}</div>;
  if (!tracks.length) return <div className="p-4">No projects found.</div>;

  // Optionally sort tracks (implement sort logic as needed)
  let sortedTracks = [...tracks];
  if (sortBy === 'latest') sortedTracks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  if (sortBy === 'oldest') sortedTracks.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  // Add 'popular' sorting if you have a metric

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
        />
      ))}
    </div>
  );
};

export default ProjectsTab;
