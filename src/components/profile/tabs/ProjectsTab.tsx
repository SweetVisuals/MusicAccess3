import React from 'react';
import useProfile from '@/hooks/useProfile';
import { useTracks } from '@/hooks/useTracks';
import ProjectCard from '../music/ProjectCard';
import { FileMusic, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/@/ui/button';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  
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
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Projects</h2>
          <Button onClick={() => navigate('/upload')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>
        
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <FileMusic className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No projects found</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            Upload your first project to showcase your music
          </p>
          <Button onClick={() => navigate('/upload')}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Project
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Projects</h2>
        <Button onClick={() => navigate('/upload')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>
      
      <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'gap-4'}`}>
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
    </div>
  );
};

export default ProjectsTab;