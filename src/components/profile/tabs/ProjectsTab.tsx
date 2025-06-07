import React, { useState, useEffect } from 'react';
import useProfile from '@/hooks/useProfile';
import { useTracks } from '@/hooks/useTracks';
import ProjectCard from '../music/ProjectCard';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { ProfileStats } from '@/lib/types';
import { toast } from 'sonner';

interface ProjectsTabProps {
  viewMode?: 'grid' | 'list';
  sortBy?: 'latest' | 'popular' | 'oldest';
  tracks?: any[];
  stats?: ProfileStats | null;
}

const ProjectsTab = ({ viewMode = 'grid', sortBy = 'latest', tracks: propTracks, stats }: ProjectsTabProps) => {
  const { profile } = useProfile();
  const { user } = useAuth();
  const userId = profile?.id;
  const { tracks: hookTracks, loading, error } = useTracks(userId || '');
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Use tracks from props if provided, otherwise use from hook
  const tracks = propTracks || hookTracks;

  useEffect(() => {
    const fetchProjects = async () => {
      if (!userId) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Format projects with tracks
        const formattedProjects = await Promise.all((data || []).map(async (project) => {
          // Get tracks for this project
          const { data: projectFiles } = await supabase
            .from('project_files')
            .select('file_id')
            .eq('project_id', project.id);
          
          const fileIds = projectFiles?.map(pf => pf.file_id) || [];
          
          // Get file details
          const { data: files } = await supabase
            .from('files')
            .select('*')
            .in('id', fileIds);
          
          // Format tracks
          const projectTracks = files?.map(file => ({
            id: file.id,
            title: file.name,
            duration: '3:45', // Placeholder, would need to extract from file metadata
            file_url: file.file_url
          })) || [];
          
          return {
            id: project.id,
            title: project.title,
            artworkUrl: project.cover_art_url || 'https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg',
            tracks: projectTracks,
            totalTracks: projectTracks.length,
            isPopular: project.is_featured,
            creator: {
              name: profile?.full_name || 'Unknown Artist',
              avatar: profile?.avatarUrl,
              tag: project.type || 'Project'
            }
          };
        }));
        
        setProjects(formattedProjects);
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [userId, profile]);

  const handleDeleteProject = async (projectId: string) => {
    try {
      // Remove the project from the local state
      setProjects(prev => prev.filter(p => p.id !== projectId));
      
      // Show success message
      toast.success("Project deleted successfully");
    } catch (error) {
      console.error('Error handling project deletion:', error);
    }
  };

  if (!userId) return <div className="p-4">Please log in to view your projects.</div>;
  if (loading || isLoading) return <div className="p-4 animate-pulse">Loading projects...</div>;
  if (error) return <div className="p-4 text-destructive">Error: {error}</div>;
  
  // Combine tracks and projects
  const allItems = [
    ...projects,
    ...tracks.map(track => ({
      id: track.id,
      title: track.title || 'Untitled Track',
      artworkUrl: track.cover_art_url || 'https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg',
      tracks: [
        {
          id: track.id,
          title: track.title || 'Untitled Track',
          duration: '3:45', // Placeholder
          file_url: track.file_url
        }
      ],
      totalTracks: 1,
      isPopular: false,
      creator: {
        name: profile?.full_name || 'Unknown Artist',
        avatar: profile?.avatarUrl,
        tag: 'Track'
      }
    }))
  ];

  // Optionally sort items
  let sortedItems = [...allItems];
  if (sortBy === 'latest') sortedItems.sort((a, b) => new Date(b.created_at || Date.now()).getTime() - new Date(a.created_at || Date.now()).getTime());
  if (sortBy === 'oldest') sortedItems.sort((a, b) => new Date(a.created_at || Date.now()).getTime() - new Date(b.created_at || Date.now()).getTime());
  // Add 'popular' sorting if you have a metric

  if (sortedItems.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground mb-4">No projects or tracks found.</p>
        {user && user.id === userId && (
          <p className="text-sm">Start by uploading your first track or creating a project.</p>
        )}
      </div>
    );
  }

  return (
    <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in' : 'gap-4'}`}>
      {sortedItems.map((item) => (
        <ProjectCard
          key={item.id}
          project={item}
          variant="grid"
          id={item.id}
          onDelete={() => handleDeleteProject(item.id)}
        />
      ))}
    </div>
  );
};

export default ProjectsTab;