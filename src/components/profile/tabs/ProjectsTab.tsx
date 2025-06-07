import React, { useState } from 'react';
import useProfile from '@/hooks/useProfile';
import { useTracks } from '@/hooks/useTracks';
import ProjectCard from '../music/ProjectCard';
import { Button } from '@/components/ui/button';
import { Plus, Music, X, Check, Upload } from 'lucide-react';
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

const ProjectsTab = ({ viewMode = 'grid', sortBy = 'latest', tracks: propTracks, stats }: ProjectsTabProps) => {
  const { profile } = useProfile();
  const userId = profile?.id;
  const { tracks: fetchedTracks, loading, error, fetchTracks } = useTracks(userId || '');
  const { files, loading: filesLoading, fetchFiles } = useFiles(userId || '');
  
  // Use provided tracks prop if available, otherwise use fetched tracks
  const tracks = propTracks || fetchedTracks;

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPublic: false,
    genre: '',
    bpm: '',
    key: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [availableFiles, setAvailableFiles] = useState<FileItem[]>([]);

  // Filter audio files only
  React.useEffect(() => {
    if (files) {
      setAvailableFiles(files.filter(file => file.type === 'audio'));
    }
  }, [files]);

  // Fetch files when component mounts
  React.useEffect(() => {
    if (userId) {
      fetchFiles();
    }
  }, [userId]);

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
          is_public: formData.isPublic,
          genre: formData.genre || null,
          bpm: formData.bpm ? parseInt(formData.bpm) : null,
          key: formData.key || null,
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
        isPublic: false,
        genre: '',
        bpm: '',
        key: ''
      });
      setSelectedFiles([]);
      fetchTracks();
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error("Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userId) return <div className="p-4">Please log in to view your projects.</div>;
  if (loading) return <div className="p-4 animate-pulse">Loading projects...</div>;
  if (error) return <div className="p-4 text-destructive">Error: {error}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Projects</h2>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>
      
      {tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-muted/50 p-6 rounded-full mb-4">
            <Music className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium mb-2">No Projects Found</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Create your first project to showcase your music and audio work.
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>
      ) : (
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'gap-4'}`}>
          {tracks.map((track) => (
            <ProjectCard
              key={track.id}
              project={{
                id: track.id,
                title: track.title || 'Untitled Project',
                artworkUrl: track.cover_art_url || 'https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg',
                tracks: [{
                  id: track.id,
                  title: track.title || 'Untitled Track',
                  duration: '3:45',
                  file_url: track.file_url || track.file_path
                }],
                totalTracks: 1,
                isPopular: false,
              }}
              variant="grid"
              id={track.id}
              onDelete={fetchTracks}
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
                    value={formData.bpm}
                    onChange={(e) => setFormData({...formData, bpm: e.target.value})}
                    placeholder="e.g. 120"
                    type="number"
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
                  isPublic: false,
                  genre: '',
                  bpm: '',
                  key: ''
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