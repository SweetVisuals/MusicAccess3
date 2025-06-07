import React, { useState, useEffect } from 'react';
import useProfile from '@/hooks/useProfile';
import { useTracks } from '@/hooks/useTracks';
import ProjectCard from '../music/ProjectCard';
import { Button } from '@/components/@/ui/button';
import { Plus, Music, Upload, X, Check } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/@/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useFiles } from '@/hooks/useFiles';
import { FileItem } from '@/lib/types';
import { Checkbox } from '@/components/@/ui/checkbox';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

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
  const { files, loading: filesLoading, fetchFiles } = useFiles(userId || '');
  
  const [projects, setProjects] = useState<any[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    bpm: '',
    key: '',
    isPublic: false
  });
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [availableFiles, setAvailableFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter audio files only
  useEffect(() => {
    if (files) {
      setAvailableFiles(files.filter(file => file.type === 'audio'));
    }
  }, [files]);

  // Fetch files when component mounts
  useEffect(() => {
    if (userId) {
      fetchFiles();
      fetchProjects();
    }
  }, [userId]);

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
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (file: FileItem) => {
    if (selectedFiles.length >= 10 && !selectedFiles.some(f => f.id === file.id)) {
      toast.error("You can select up to 10 files for a project");
      return;
    }
    
    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.id === file.id);
      if (isSelected) {
        return prev.filter(f => f.id !== file.id);
      } else {
        return [...prev, file];
      }
    });
  };

  const handleCreateProject = async () => {
    if (!userId) {
      toast.error("You must be logged in to create a project");
      return;
    }
    
    if (!formData.title.trim()) {
      toast.error("Please enter a title for your project");
      return;
    }
    
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file for your project");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create a new project
      const projectId = uuidv4();
      const { error: projectError } = await supabase
        .from('projects')
        .insert({
          id: projectId,
          user_id: userId,
          title: formData.title,
          description: formData.description,
          type: 'audio',
          genre: formData.genre,
          bpm: formData.bpm ? parseInt(formData.bpm) : null,
          key: formData.key,
          is_public: formData.isPublic,
          cover_art_url: selectedFiles[0]?.audio_url || null // Use the first file's image as cover
        });
      
      if (projectError) throw projectError;
      
      // Add files to the project
      const projectFiles = selectedFiles.map((file, index) => ({
        project_id: projectId,
        file_id: file.id,
        position: index
      }));
      
      const { error: filesError } = await supabase
        .from('project_files')
        .insert(projectFiles);
      
      if (filesError) throw filesError;
      
      toast.success("Project created successfully!");
      setShowCreateDialog(false);
      setFormData({ 
        title: '', 
        description: '', 
        genre: '', 
        bpm: '', 
        key: '', 
        isPublic: false 
      });
      setSelectedFiles([]);
      fetchProjects();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error("Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userId) return <div className="p-4">Please log in to view your projects.</div>;
  if (loading && isLoading) return <div className="p-4 animate-pulse">Loading projects...</div>;
  if (error) return <div className="p-4 text-destructive">Error: {error}</div>;

  // Combine fetched projects with any tracks that might have been passed in
  const allProjects = [...projects];
  
  // Optionally sort projects (implement sort logic as needed)
  let sortedProjects = [...allProjects];
  if (sortBy === 'latest') sortedProjects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  if (sortBy === 'oldest') sortedProjects.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  // Add 'popular' sorting if you have a metric

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Projects</h2>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>
      
      {sortedProjects.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No projects found</h3>
          <p className="text-muted-foreground mt-2 mb-4">
            Create your first project to showcase your work
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>
      ) : (
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'gap-4'}`}>
          {sortedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={{
                id: project.id,
                title: project.title || 'Untitled Project',
                artworkUrl: project.cover_art_url || 'https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg',
                tracks: [],
                totalTracks: project.files?.length || 0,
                isPopular: project.is_featured || false,
                creator: {
                  name: profile?.full_name || 'Artist',
                  avatar: profile?.avatarUrl,
                  tag: profile?.professionalTitle || 'Producer'
                }
              }}
              variant={viewMode}
              id={project.id}
            />
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
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
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter a title for your project"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe your project"
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="genre">Genre</Label>
                  <Input 
                    id="genre" 
                    value={formData.genre}
                    onChange={(e) => setFormData({...formData, genre: e.target.value})}
                    placeholder="e.g. Hip Hop, EDM"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bpm">BPM</Label>
                  <Input 
                    id="bpm" 
                    type="number"
                    value={formData.bpm}
                    onChange={(e) => setFormData({...formData, bpm: e.target.value})}
                    placeholder="e.g. 120"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="key">Key</Label>
                <Input 
                  id="key" 
                  value={formData.key}
                  onChange={(e) => setFormData({...formData, key: e.target.value})}
                  placeholder="e.g. C Minor"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isPublic" 
                  checked={formData.isPublic}
                  onCheckedChange={(checked) => 
                    setFormData({...formData, isPublic: checked as boolean})
                  }
                />
                <Label htmlFor="isPublic">Make this project public</Label>
              </div>
              
              <div className="pt-4">
                <h3 className="text-sm font-medium mb-2">Selected Files ({selectedFiles.length}/10)</h3>
                {selectedFiles.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No files selected. Select files from the list on the right.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-md p-2">
                    {selectedFiles.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                        <div className="flex items-center gap-2">
                          <Music className="h-4 w-4 text-primary" />
                          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0"
                          onClick={() => handleFileSelect(file)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Available Audio Files</h3>
                {filesLoading && <span className="text-xs text-muted-foreground">Loading...</span>}
              </div>
              
              {availableFiles.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No audio files found. Upload some files first.
                  </p>
                </div>
              ) : (
                <div className="border rounded-md h-[350px] overflow-y-auto">
                  {availableFiles.map((file) => {
                    const isSelected = selectedFiles.some(f => f.id === file.id);
                    return (
                      <div 
                        key={file.id} 
                        className={`flex items-center justify-between p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                          isSelected ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => handleFileSelect(file)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                            isSelected ? 'bg-primary text-primary-foreground' : 'border'
                          }`}>
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <Music className="h-4 w-4 text-primary" />
                            <span className="text-sm truncate max-w-[250px]">{file.name}</span>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{file.size}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateDialog(false);
                setFormData({ 
                  title: '', 
                  description: '', 
                  genre: '', 
                  bpm: '', 
                  key: '', 
                  isPublic: false 
                });
                setSelectedFiles([]);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProject}
              disabled={isSubmitting || !formData.title || selectedFiles.length === 0}
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