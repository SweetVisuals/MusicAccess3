import React, { useState, useEffect } from 'react';
import useProfile from '@/hooks/useProfile';
import { useTracks } from '@/hooks/useTracks';
import { useFiles } from '@/hooks/useFiles';
import ProjectCard from '../music/ProjectCard';
import { Button } from '@/components/ui/button';
import { Plus, Folder, File, Music, X, Check } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/@/ui/checkbox';
import { Badge } from '@/components/@/ui/badge';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { FileItem } from '@/lib/types';

interface ProjectsTabProps {
  viewMode?: 'grid' | 'list';
  sortBy?: 'latest' | 'popular' | 'oldest';
  tracks?: any[];
  stats?: any;
}

const ProjectsTab = ({ viewMode = 'grid', sortBy = 'latest', tracks = [], stats = null }: ProjectsTabProps) => {
  const { profile } = useProfile();
  const userId = profile?.id;
  const { tracks: userTracks, loading, error } = useTracks(userId || '');
  const { files, loading: filesLoading } = useFiles(userId || '');
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectGenre, setProjectGenre] = useState('');
  const [projectBpm, setProjectBpm] = useState('');
  const [projectKey, setProjectKey] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch projects
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
        
        setProjects(data || []);
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjects();
  }, [userId]);

  const handleCreateProject = async () => {
    if (!userId) {
      toast.error('You must be logged in to create a project');
      return;
    }
    
    if (!projectTitle.trim()) {
      toast.error('Project title is required');
      return;
    }
    
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create project
      const projectId = uuidv4();
      const { error: projectError } = await supabase
        .from('projects')
        .insert({
          id: projectId,
          user_id: userId,
          title: projectTitle.trim(),
          description: projectDescription.trim(),
          type: 'audio',
          genre: projectGenre.trim(),
          bpm: projectBpm ? parseInt(projectBpm) : null,
          key: projectKey.trim(),
          is_public: isPublic
        });
      
      if (projectError) throw projectError;
      
      // Add files to project
      const projectFiles = selectedFiles.map((fileId, index) => ({
        project_id: projectId,
        file_id: fileId,
        position: index + 1
      }));
      
      const { error: filesError } = await supabase
        .from('project_files')
        .insert(projectFiles);
      
      if (filesError) throw filesError;
      
      toast.success('Project created successfully');
      
      // Reset form
      setProjectTitle('');
      setProjectDescription('');
      setProjectGenre('');
      setProjectBpm('');
      setProjectKey('');
      setIsPublic(false);
      setSelectedFiles([]);
      setIsCreateDialogOpen(false);
      
      // Refresh projects
      const { data: newProjects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      setProjects(newProjects || []);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        if (prev.length >= 10) {
          toast.error('You can select up to 10 files');
          return prev;
        }
        return [...prev, fileId];
      }
    });
  };

  if (!userId) return <div className="p-4">Please log in to view your projects.</div>;
  if (loading && isLoading) return <div className="p-4 animate-pulse">Loading projects...</div>;
  if (error) return <div className="p-4 text-destructive">Error: {error}</div>;

  // Combine fetched projects with any tracks data
  const allProjects = [...projects];
  
  // Add tracks as projects if they're not already included
  if (tracks && tracks.length > 0) {
    tracks.forEach(track => {
      if (!allProjects.some(project => project.id === track.id)) {
        allProjects.push({
          id: track.id,
          title: track.title || 'Untitled Project',
          cover_art_url: track.cover_art_url,
          created_at: track.created_at
        });
      }
    });
  }

  // Optionally sort projects (implement sort logic as needed)
  let sortedProjects = [...allProjects];
  if (sortBy === 'latest') sortedProjects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  if (sortBy === 'oldest') sortedProjects.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  // Add 'popular' sorting if you have a metric

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Projects</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>

      <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in' : 'gap-4'}`}>
        {sortedProjects.length === 0 ? (
          <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg">
            <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No projects found</h3>
            <p className="text-muted-foreground mt-2 mb-4">
              Create your first project to get started
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>
        ) : (
          sortedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              project={{
                id: project.id,
                title: project.title || 'Untitled Project',
                artworkUrl: project.cover_art_url || 'https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg',
                tracks: [],
                totalTracks: project.track_count || 1,
                isPopular: false,
              }}
              variant={viewMode}
            />
          ))
        )}
      </div>

      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input 
                  id="title" 
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="Enter project title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Describe your project"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="genre">Genre</Label>
                  <Input 
                    id="genre" 
                    value={projectGenre}
                    onChange={(e) => setProjectGenre(e.target.value)}
                    placeholder="e.g. Hip Hop, EDM"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="key">Key</Label>
                  <Input 
                    id="key" 
                    value={projectKey}
                    onChange={(e) => setProjectKey(e.target.value)}
                    placeholder="e.g. C Minor"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bpm">BPM</Label>
                  <Input 
                    id="bpm" 
                    type="number"
                    value={projectBpm}
                    onChange={(e) => setProjectBpm(e.target.value)}
                    placeholder="e.g. 120"
                  />
                </div>
                
                <div className="flex items-end">
                  <div className="flex items-center space-x-2 h-10">
                    <Checkbox 
                      id="isPublic" 
                      checked={isPublic}
                      onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                    />
                    <Label htmlFor="isPublic">Make project public</Label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex justify-between">
                  <span>Select Files ({selectedFiles.length}/10)</span>
                  {selectedFiles.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedFiles([])}
                      className="h-auto py-0 px-2"
                    >
                      Clear
                    </Button>
                  )}
                </Label>
                
                <div className="border rounded-md h-[300px] overflow-y-auto p-2">
                  {filesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <File className="h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No files found</p>
                      <p className="text-sm text-muted-foreground">
                        Upload files first to add them to your project
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {files.map((file) => (
                        <div 
                          key={file.id}
                          className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                            selectedFiles.includes(file.id) 
                              ? 'bg-primary/10 border border-primary' 
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => toggleFileSelection(file.id)}
                        >
                          <div className="flex items-center gap-2">
                            <Music className="h-4 w-4 text-primary" />
                            <span className="truncate max-w-[200px]">{file.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{file.size}</span>
                            {selectedFiles.includes(file.id) ? (
                              <Check className="h-4 w-4 text-primary" />
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {selectedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedFiles.map(fileId => {
                      const file = files.find(f => f.id === fileId);
                      return file ? (
                        <Badge 
                          key={fileId} 
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Music className="h-3 w-3" />
                          <span className="truncate max-w-[150px]">{file.name}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-4 w-4 p-0 ml-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFileSelection(fileId);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProject}
              disabled={isSubmitting || !projectTitle.trim() || selectedFiles.length === 0}
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsTab;