import React, { useState, useEffect } from 'react';
import { AppSidebar } from "@/components/dashboard/layout/app-sidebar";
import { SiteHeader } from "@/components/dashboard/layout/site-header";
import { SidebarInset, SidebarProvider } from "@/components/@/ui/sidebar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/@/ui/card";
import { Button } from "@/components/@/ui/button";
import { Input } from "@/components/@/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/@/ui/label";
import { Badge } from "@/components/@/ui/badge";
import { Progress } from "@/components/@/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/@/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/@/ui/select";
import { Checkbox } from "@/components/@/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { useFiles } from "@/hooks/useFiles";
import { supabase } from "@/lib/supabase";
import { FileItem } from "@/lib/types";
import { v4 as uuidv4 } from 'uuid';
import { 
  Upload, 
  FolderPlus, 
  File, 
  Folder, 
  ChevronRight, 
  Music, 
  Package, 
  Tag, 
  DollarSign, 
  Globe, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  X,
  Plus,
  Disc3,
  Album,
  Headphones,
  ShoppingBag,
  Users,
  Clock,
  Sparkles
} from 'lucide-react';

// Define the steps in the upload process
const STEPS = [
  { id: 'upload', title: 'Upload Files', icon: Upload },
  { id: 'organize', title: 'Organize Content', icon: Package },
  { id: 'pricing', title: 'Set Pricing', icon: DollarSign },
  { id: 'publish', title: 'Publish', icon: Globe },
  { id: 'complete', title: 'Complete', icon: CheckCircle }
];

// Define project types
const PROJECT_TYPES = [
  { id: 'beat_tape', name: 'Beat Tape', icon: Disc3 },
  { id: 'sound_pack', name: 'Sound Pack', icon: Package },
  { id: 'album', name: 'Album', icon: Album },
  { id: 'single', name: 'Single', icon: Music }
];

// Define license types
const LICENSE_TYPES = [
  { id: 'basic', name: 'Basic License', description: 'Non-exclusive rights, limited distribution' },
  { id: 'premium', name: 'Premium License', description: 'Non-exclusive rights, unlimited distribution' },
  { id: 'exclusive', name: 'Exclusive License', description: 'Full exclusive rights transfer' }
];

// Define publish options
const PUBLISH_OPTIONS = [
  { id: 'public', name: 'Public', description: 'Visible to everyone', icon: Globe },
  { id: 'private', name: 'Private', description: 'Only visible to you', icon: Users },
  { id: 'order', name: 'Submit to Order', description: 'Fulfill an existing order', icon: ShoppingBag }
];

interface UploadedFile extends File {
  id: string;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  url?: string;
}

interface ProjectData {
  title: string;
  description: string;
  type: string;
  genre: string;
  bpm?: number;
  key?: string;
  tags: string[];
  coverArt?: File;
  coverArtUrl?: string;
  files: UploadedFile[];
  folders: {
    id: string;
    name: string;
    files: UploadedFile[];
  }[];
  pricing: {
    projectPrice: number;
    individualPrices: Record<string, number>;
    licenses: {
      basic: { enabled: boolean; price: number };
      premium: { enabled: boolean; price: number };
      exclusive: { enabled: boolean; price: number };
    };
  };
  publishOption: string;
  orderId?: string;
}

export default function UploadWizard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    files: userFiles, 
    folders: userFolders, 
    createFolder, 
    uploadFile 
  } = useFiles(user?.id || '');
  
  const [currentStep, setCurrentStep] = useState(0);
  const [projectData, setProjectData] = useState<ProjectData>({
    title: '',
    description: '',
    type: '',
    genre: '',
    tags: [],
    files: [],
    folders: [],
    pricing: {
      projectPrice: 0,
      individualPrices: {},
      licenses: {
        basic: { enabled: true, price: 19.99 },
        premium: { enabled: true, price: 49.99 },
        exclusive: { enabled: true, price: 299.99 }
      }
    },
    publishOption: 'public'
  });
  const [isUploading, setIsUploading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [orders, setOrders] = useState<{id: string, title: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch user's orders for the publish step
  useEffect(() => {
    if (user?.id && currentStep === 3) {
      // In a real app, fetch actual orders from the database
      // For demo purposes, we'll use sample data
      setOrders([
        { id: 'ORD-001', title: 'Custom Beat Production' },
        { id: 'ORD-002', title: 'Sound Pack Request' },
        { id: 'ORD-003', title: 'Mix & Master Service' }
      ]);
    }
  }, [user?.id, currentStep]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFiles = Array.from(e.target.files).map(file => ({
      ...file,
      id: uuidv4(),
      progress: 0,
      status: 'uploading' as const
    }));
    
    if (selectedFolder) {
      // Add to selected folder
      setProjectData(prev => ({
        ...prev,
        folders: prev.folders.map(folder => 
          folder.id === selectedFolder 
            ? { ...folder, files: [...folder.files, ...selectedFiles] }
            : folder
        )
      }));
    } else {
      // Add to root level
      setProjectData(prev => ({
        ...prev,
        files: [...prev.files, ...selectedFiles]
      }));
    }
    
    // Reset the input
    e.target.value = '';
  };

  // Handle cover art selection
  const handleCoverArtSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    // Create a preview URL
    const url = URL.createObjectURL(file);
    
    setProjectData(prev => ({
      ...prev,
      coverArt: file,
      coverArtUrl: url
    }));
    
    // Reset the input
    e.target.value = '';
  };

  // Handle creating a new folder
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a folder name",
        variant: "destructive"
      });
      return;
    }
    
    const folderId = uuidv4();
    
    setProjectData(prev => ({
      ...prev,
      folders: [...prev.folders, { id: folderId, name: newFolderName, files: [] }]
    }));
    
    setNewFolderName('');
    setSelectedFolder(folderId);
    
    toast({
      title: "Folder created",
      description: `Folder "${newFolderName}" created successfully`
    });
  };

  // Handle adding a new tag
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    if (!projectData.tags.includes(newTag.trim())) {
      setProjectData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
    }
    
    setNewTag('');
  };

  // Handle removing a tag
  const handleRemoveTag = (tag: string) => {
    setProjectData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Handle removing a file
  const handleRemoveFile = (fileId: string, folderId?: string) => {
    if (folderId) {
      // Remove from folder
      setProjectData(prev => ({
        ...prev,
        folders: prev.folders.map(folder => 
          folder.id === folderId 
            ? { ...folder, files: folder.files.filter(file => file.id !== fileId) }
            : folder
        )
      }));
    } else {
      // Remove from root level
      setProjectData(prev => ({
        ...prev,
        files: prev.files.filter(file => file.id !== fileId)
      }));
    }
  };

  // Handle removing a folder
  const handleRemoveFolder = (folderId: string) => {
    setProjectData(prev => ({
      ...prev,
      folders: prev.folders.filter(folder => folder.id !== folderId)
    }));
    
    if (selectedFolder === folderId) {
      setSelectedFolder(null);
    }
  };

  // Handle updating individual file price
  const handleUpdateFilePrice = (fileId: string, price: number) => {
    setProjectData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        individualPrices: {
          ...prev.pricing.individualPrices,
          [fileId]: price
        }
      }
    }));
  };

  // Navigate to the next step
  const handleNextStep = () => {
    // Validate current step
    if (currentStep === 0 && projectData.files.length === 0 && projectData.folders.every(f => f.files.length === 0)) {
      toast({
        title: "No files selected",
        description: "Please upload at least one file to continue",
        variant: "destructive"
      });
      return;
    }
    
    if (currentStep === 1 && !projectData.title) {
      toast({
        title: "Missing information",
        description: "Please enter a title for your project",
        variant: "destructive"
      });
      return;
    }
    
    if (currentStep === 3 && projectData.publishOption === 'order' && !projectData.orderId) {
      toast({
        title: "Missing information",
        description: "Please select an order to submit to",
        variant: "destructive"
      });
      return;
    }
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Navigate to the previous step
  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Handle final submission
  const handleSubmit = async () => {
    if (!user?.id) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to publish content",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real app, this would upload files to storage and create database records
      // For demo purposes, we'll simulate the process
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Success!",
        description: `Your ${projectData.type || 'project'} has been published successfully`,
      });
      
      // Move to the final step
      setCurrentStep(4);
    } catch (error) {
      console.error('Error submitting project:', error);
      toast({
        title: "Error",
        description: "Failed to publish your content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render the current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Upload Files
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Upload Files</h2>
                <p className="text-muted-foreground">Upload your audio files and organize them into folders</p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => document.getElementById('folder-input')?.click()}
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
                <Button onClick={() => document.getElementById('file-input')?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
                <input
                  id="file-input"
                  type="file"
                  multiple
                  accept="audio/*,.mp3,.wav,.aiff,.flac,.ogg,.aac"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <input
                  id="folder-input"
                  type="text"
                  className="hidden"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onBlur={handleCreateFolder}
                />
              </div>
            </div>
            
            {/* New Folder Input */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="New folder name..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
              <Button onClick={handleCreateFolder}>
                <FolderPlus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </div>
            
            {/* Folder Navigation */}
            <div className="flex items-center gap-2 mb-4">
              <Button 
                variant={selectedFolder === null ? "secondary" : "outline"}
                size="sm"
                onClick={() => setSelectedFolder(null)}
              >
                All Files
              </Button>
              {projectData.folders.map(folder => (
                <Button
                  key={folder.id}
                  variant={selectedFolder === folder.id ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFolder(folder.id)}
                >
                  <Folder className="h-4 w-4 mr-2" />
                  {folder.name}
                </Button>
              ))}
            </div>
            
            {/* Files Display */}
            <div className="border rounded-lg p-4">
              {selectedFolder === null ? (
                <>
                  {/* Folders */}
                  {projectData.folders.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium mb-2">Folders</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {projectData.folders.map(folder => (
                          <Card key={folder.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <CardContent className="p-4 flex items-center justify-between">
                              <div className="flex items-center gap-2" onClick={() => setSelectedFolder(folder.id)}>
                                <Folder className="h-5 w-5 text-blue-500" />
                                <div>
                                  <p className="font-medium">{folder.name}</p>
                                  <p className="text-xs text-muted-foreground">{folder.files.length} files</p>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleRemoveFolder(folder.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Root Files */}
                  <div>
                    <h3 className="text-sm font-medium mb-2">Files</h3>
                    {projectData.files.length === 0 ? (
                      <div className="text-center py-8 border border-dashed rounded-lg">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No files uploaded yet</p>
                        <Button 
                          variant="link" 
                          onClick={() => document.getElementById('file-input')?.click()}
                        >
                          Upload files
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {projectData.files.map(file => (
                          <Card key={file.id} className="overflow-hidden">
                            <CardContent className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-primary/10 rounded-md flex items-center justify-center">
                                  <Music className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{file.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleRemoveFile(file.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </CardContent>
                            {file.status === 'uploading' && (
                              <div className="px-3 pb-3">
                                <Progress value={file.progress} className="h-1" />
                                <p className="text-xs text-right mt-1 text-muted-foreground">
                                  {file.progress}%
                                </p>
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // Selected Folder Content
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setSelectedFolder(null)}
                      >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                      </Button>
                      <h3 className="text-lg font-medium">
                        {projectData.folders.find(f => f.id === selectedFolder)?.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => document.getElementById('file-input')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload to Folder
                      </Button>
                    </div>
                  </div>
                  
                  {/* Folder Files */}
                  {projectData.folders.find(f => f.id === selectedFolder)?.files.length === 0 ? (
                    <div className="text-center py-8 border border-dashed rounded-lg">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No files in this folder</p>
                      <Button 
                        variant="link" 
                        onClick={() => document.getElementById('file-input')?.click()}
                      >
                        Upload files
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {projectData.folders
                        .find(f => f.id === selectedFolder)
                        ?.files.map(file => (
                          <Card key={file.id} className="overflow-hidden">
                            <CardContent className="p-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-primary/10 rounded-md flex items-center justify-center">
                                  <Music className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{file.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => handleRemoveFile(file.id, selectedFolder)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </CardContent>
                            {file.status === 'uploading' && (
                              <div className="px-3 pb-3">
                                <Progress value={file.progress} className="h-1" />
                                <p className="text-xs text-right mt-1 text-muted-foreground">
                                  {file.progress}%
                                </p>
                              </div>
                            )}
                          </Card>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Upload Drop Area */}
            <div 
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                Drag and drop audio files here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supported formats: MP3, WAV, AIFF, FLAC, OGG, AAC
              </p>
            </div>
          </div>
        );
      
      case 1: // Organize Content
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Organize Your Content</h2>
              <p className="text-muted-foreground">Organize your files into a project and add details</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-title">Project Title</Label>
                  <Input 
                    id="project-title" 
                    placeholder="Enter a title for your project"
                    value={projectData.title}
                    onChange={(e) => setProjectData(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="project-description">Description</Label>
                  <Textarea 
                    id="project-description" 
                    placeholder="Describe your project..."
                    className="min-h-[120px]"
                    value={projectData.description}
                    onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Project Type</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {PROJECT_TYPES.map(type => (
                      <Card 
                        key={type.id}
                        className={`cursor-pointer transition-colors ${
                          projectData.type === type.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setProjectData(prev => ({ ...prev, type: type.id }))}
                      >
                        <CardContent className="p-4 flex flex-col items-center text-center">
                          <type.icon className={`h-8 w-8 mb-2 ${
                            projectData.type === type.id ? 'text-primary' : 'text-muted-foreground'
                          }`} />
                          <p className="font-medium">{type.name}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-genre">Genre</Label>
                    <Select 
                      value={projectData.genre} 
                      onValueChange={(value) => setProjectData(prev => ({ ...prev, genre: value }))}
                    >
                      <SelectTrigger id="project-genre">
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hip_hop">Hip Hop</SelectItem>
                        <SelectItem value="rnb">R&B</SelectItem>
                        <SelectItem value="pop">Pop</SelectItem>
                        <SelectItem value="electronic">Electronic</SelectItem>
                        <SelectItem value="rock">Rock</SelectItem>
                        <SelectItem value="jazz">Jazz</SelectItem>
                        <SelectItem value="classical">Classical</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="project-bpm">BPM (Optional)</Label>
                    <Input 
                      id="project-bpm" 
                      type="number" 
                      placeholder="e.g. 120"
                      value={projectData.bpm || ''}
                      onChange={(e) => setProjectData(prev => ({ 
                        ...prev, 
                        bpm: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="project-key">Key (Optional)</Label>
                  <Select 
                    value={projectData.key} 
                    onValueChange={(value) => setProjectData(prev => ({ ...prev, key: value }))}
                  >
                    <SelectTrigger id="project-key">
                      <SelectValue placeholder="Select key" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="C#">C#</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                      <SelectItem value="D#">D#</SelectItem>
                      <SelectItem value="E">E</SelectItem>
                      <SelectItem value="F">F</SelectItem>
                      <SelectItem value="F#">F#</SelectItem>
                      <SelectItem value="G">G</SelectItem>
                      <SelectItem value="G#">G#</SelectItem>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="A#">A#</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {projectData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button onClick={handleAddTag}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Cover Art</Label>
                  <div 
                    className="border-2 border-dashed rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                    onClick={() => document.getElementById('cover-art-input')?.click()}
                  >
                    {projectData.coverArtUrl ? (
                      <img 
                        src={projectData.coverArtUrl} 
                        alt="Cover Art Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">Click to upload cover art</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Recommended size: 1400 x 1400 pixels
                        </p>
                      </>
                    )}
                    <input
                      id="cover-art-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverArtSelect}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Files Overview</Label>
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <File className="h-5 w-5 text-primary" />
                            <span className="font-medium">Total Files</span>
                          </div>
                          <span className="font-medium">
                            {projectData.files.length + projectData.folders.reduce((acc, folder) => acc + folder.files.length, 0)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Folder className="h-5 w-5 text-primary" />
                            <span className="font-medium">Folders</span>
                          </div>
                          <span className="font-medium">{projectData.folders.length}</span>
                        </div>
                        
                        {projectData.folders.map(folder => (
                          <div key={folder.id} className="flex items-center justify-between pl-6">
                            <div className="flex items-center gap-2">
                              <Folder className="h-4 w-4 text-muted-foreground" />
                              <span>{folder.name}</span>
                            </div>
                            <span className="text-muted-foreground">{folder.files.length} files</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 2: // Set Pricing
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Set Pricing</h2>
              <p className="text-muted-foreground">Set prices for your project and individual files</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Pricing</CardTitle>
                    <CardDescription>Set a price for the entire project</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="project-price">Project Price (USD)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="project-price" 
                          type="number" 
                          className="pl-9"
                          placeholder="0.00"
                          value={projectData.pricing.projectPrice || ''}
                          onChange={(e) => setProjectData(prev => ({ 
                            ...prev, 
                            pricing: {
                              ...prev.pricing,
                              projectPrice: e.target.value ? parseFloat(e.target.value) : 0
                            }
                          }))}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setProjectData(prev => ({ 
                          ...prev, 
                          pricing: {
                            ...prev.pricing,
                            projectPrice: 9.99
                          }
                        }))}
                      >
                        $9.99
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setProjectData(prev => ({ 
                          ...prev, 
                          pricing: {
                            ...prev.pricing,
                            projectPrice: 19.99
                          }
                        }))}
                      >
                        $19.99
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => setProjectData(prev => ({ 
                          ...prev, 
                          pricing: {
                            ...prev.pricing,
                            projectPrice: 29.99
                          }
                        }))}
                      >
                        $29.99
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>License Options</CardTitle>
                    <CardDescription>Configure different license tiers for your content</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {LICENSE_TYPES.map(license => (
                      <div key={license.id} className="space-y-2 pb-4 border-b last:border-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Checkbox 
                              id={`license-${license.id}`}
                              checked={projectData.pricing.licenses[license.id as keyof typeof projectData.pricing.licenses].enabled}
                              onCheckedChange={(checked) => setProjectData(prev => ({
                                ...prev,
                                pricing: {
                                  ...prev.pricing,
                                  licenses: {
                                    ...prev.pricing.licenses,
                                    [license.id]: {
                                      ...prev.pricing.licenses[license.id as keyof typeof prev.pricing.licenses],
                                      enabled: !!checked
                                    }
                                  }
                                }
                              }))}
                            />
                            <Label htmlFor={`license-${license.id}`} className="font-medium">
                              {license.name}
                            </Label>
                          </div>
                          <Badge variant="outline">{license.id === 'exclusive' ? 'Premium' : 'Standard'}</Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground pl-6">{license.description}</p>
                        
                        <div className="pl-6">
                          <Label htmlFor={`license-${license.id}-price`}>Price (USD)</Label>
                          <div className="relative mt-1">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id={`license-${license.id}-price`} 
                              type="number" 
                              className="pl-9"
                              placeholder="0.00"
                              disabled={!projectData.pricing.licenses[license.id as keyof typeof projectData.pricing.licenses].enabled}
                              value={projectData.pricing.licenses[license.id as keyof typeof projectData.pricing.licenses].price || ''}
                              onChange={(e) => setProjectData(prev => ({
                                ...prev,
                                pricing: {
                                  ...prev.pricing,
                                  licenses: {
                                    ...prev.pricing.licenses,
                                    [license.id]: {
                                      ...prev.pricing.licenses[license.id as keyof typeof prev.pricing.licenses],
                                      price: e.target.value ? parseFloat(e.target.value) : 0
                                    }
                                  }
                                }
                              }))}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Individual File Pricing</CardTitle>
                    <CardDescription>Set prices for individual files (optional)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
                    {/* Root files */}
                    {projectData.files.map(file => (
                      <div key={file.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <div className="flex items-center gap-2">
                          <Music className="h-4 w-4 text-primary" />
                          <span className="truncate max-w-[200px]">{file.name}</span>
                        </div>
                        <div className="relative w-32">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="number" 
                            className="pl-9"
                            placeholder="0.00"
                            value={projectData.pricing.individualPrices[file.id] || ''}
                            onChange={(e) => handleUpdateFilePrice(
                              file.id, 
                              e.target.value ? parseFloat(e.target.value) : 0
                            )}
                          />
                        </div>
                      </div>
                    ))}
                    
                    {/* Folder files */}
                    {projectData.folders.map(folder => (
                      <div key={folder.id} className="space-y-2">
                        <div className="font-medium flex items-center gap-2">
                          <Folder className="h-4 w-4" />
                          {folder.name}
                        </div>
                        <div className="pl-6 space-y-2">
                          {folder.files.map(file => (
                            <div key={file.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                              <div className="flex items-center gap-2">
                                <Music className="h-4 w-4 text-primary" />
                                <span className="truncate max-w-[200px]">{file.name}</span>
                              </div>
                              <div className="relative w-32">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  type="number" 
                                  className="pl-9"
                                  placeholder="0.00"
                                  value={projectData.pricing.individualPrices[file.id] || ''}
                                  onChange={(e) => handleUpdateFilePrice(
                                    file.id, 
                                    e.target.value ? parseFloat(e.target.value) : 0
                                  )}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Pricing Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="font-medium">Project Price</span>
                      <span className="font-bold">${projectData.pricing.projectPrice.toFixed(2)}</span>
                    </div>
                    
                    <div className="space-y-1">
                      <span className="font-medium">License Options</span>
                      {Object.entries(projectData.pricing.licenses).map(([key, license]) => (
                        license.enabled && (
                          <div key={key} className="flex justify-between items-center text-sm pl-4">
                            <span>{LICENSE_TYPES.find(l => l.id === key)?.name}</span>
                            <span>${license.price.toFixed(2)}</span>
                          </div>
                        )
                      ))}
                    </div>
                    
                    <div className="space-y-1">
                      <span className="font-medium">Individual Files</span>
                      <div className="flex justify-between items-center text-sm pl-4">
                        <span>Files with custom pricing</span>
                        <span>{Object.keys(projectData.pricing.individualPrices).length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );
      
      case 3: // Publish
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Publish Your Content</h2>
              <p className="text-muted-foreground">Choose how you want to publish your content</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PUBLISH_OPTIONS.map(option => (
                <Card 
                  key={option.id}
                  className={`cursor-pointer transition-colors ${
                    projectData.publishOption === option.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setProjectData(prev => ({ ...prev, publishOption: option.id }))}
                >
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <option.icon className={`h-12 w-12 mb-4 ${
                      projectData.publishOption === option.id ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <h3 className="font-medium text-lg mb-2">{option.name}</h3>
                    <p className="text-muted-foreground">{option.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Order selection (if "Submit to Order" is selected) */}
            {projectData.publishOption === 'order' && (
              <Card>
                <CardHeader>
                  <CardTitle>Select Order</CardTitle>
                  <CardDescription>Choose which order to submit this content to</CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No active orders found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {orders.map(order => (
                        <div 
                          key={order.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            projectData.orderId === order.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setProjectData(prev => ({ ...prev, orderId: order.id }))}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <ShoppingBag className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{order.title}</p>
                                <p className="text-sm text-muted-foreground">{order.id}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>Pending</span>
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle>Review Your Submission</CardTitle>
                <CardDescription>Review your content before publishing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="font-medium">Project Details</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Title:</span>
                        <span className="font-medium">{projectData.title || 'Untitled'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium">
                          {PROJECT_TYPES.find(t => t.id === projectData.type)?.name || 'Not specified'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Genre:</span>
                        <span className="font-medium">{projectData.genre || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Files:</span>
                        <span className="font-medium">
                          {projectData.files.length + projectData.folders.reduce((acc, folder) => acc + folder.files.length, 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Project Price:</span>
                        <span className="font-medium">${projectData.pricing.projectPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Publish Option:</span>
                        <span className="font-medium">
                          {PUBLISH_OPTIONS.find(o => o.id === projectData.publishOption)?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="font-medium">Cover Art</p>
                    <div className="aspect-square rounded-md overflow-hidden bg-muted flex items-center justify-center">
                      {projectData.coverArtUrl ? (
                        <img 
                          src={projectData.coverArtUrl} 
                          alt="Cover Art" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 4: // Complete
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-6">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Upload Complete!</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              Your content has been successfully uploaded and published.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
              <Card>
                <CardContent className="p-6 flex flex-col items-center">
                  <Globe className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-medium text-lg mb-1">View Online</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    See how your content looks online
                  </p>
                  <Button className="w-full">View Content</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 flex flex-col items-center">
                  <Sparkles className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-medium text-lg mb-1">Promote</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Share and promote your content
                  </p>
                  <Button variant="outline" className="w-full">Promote</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 flex flex-col items-center">
                  <Upload className="h-8 w-8 text-primary mb-4" />
                  <h3 className="font-medium text-lg mb-1">Upload More</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload more content to your profile
                  </p>
                  <Button variant="outline" className="w-full">New Upload</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 animate-fade-in p-8">
            {/* Progress Indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                {STEPS.map((step, index) => (
                  <div 
                    key={step.id}
                    className={`flex flex-col items-center ${
                      index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      index < currentStep 
                        ? 'bg-primary text-primary-foreground' 
                        : index === currentStep 
                          ? 'bg-primary/20 text-primary border-2 border-primary' 
                          : 'bg-muted text-muted-foreground'
                    }`}>
                      {index < currentStep ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className={`text-sm font-medium ${
                      index <= currentStep ? '' : 'hidden sm:block'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-primary transition-all duration-300"
                  style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                />
              </div>
            </div>
            
            {/* Step Content */}
            <div className="flex-1">
              {renderStepContent()}
            </div>
            
            {/* Navigation Buttons */}
            {currentStep < 4 && (
              <div className="flex justify-between pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={handlePreviousStep}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                
                {currentStep < 3 ? (
                  <Button onClick={handleNextStep}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        Publish
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function ImageIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  )
}