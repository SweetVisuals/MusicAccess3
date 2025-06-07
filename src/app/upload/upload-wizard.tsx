import React, { useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import { 
  Upload, 
  Folder, 
  File, 
  Music, 
  Package, 
  Tag, 
  DollarSign, 
  Globe, 
  Lock, 
  CheckCircle, 
  X, 
  ArrowRight, 
  ArrowLeft,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/@/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/@/ui/tabs";
import { Progress } from "@/components/@/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

interface UploadFile extends File {
  id: string;
  preview?: string;
  progress: number;
  error?: string;
  uploaded?: boolean;
  url?: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  type: string;
  genre: string;
  bpm?: number;
  key?: string;
  tags: string[];
  coverArtUrl?: string;
  isPublic: boolean;
  files: UploadFile[];
  pricing: {
    projectPrice?: number;
    individualPrices: Record<string, number>;
    licenseType: string;
  };
}

const UploadWizard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [project, setProject] = useState<Project>({
    id: uuidv4(),
    title: "",
    description: "",
    type: "beat_tape",
    genre: "",
    tags: [],
    isPublic: false,
    files: [],
    pricing: {
      licenseType: "standard",
      individualPrices: {}
    }
  });
  const [newTag, setNewTag] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverArtInputRef = useRef<HTMLInputElement>(null);

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'audio/*': ['.mp3', '.wav', '.aiff', '.flac', '.ogg', '.aac']
    },
    onDrop: (acceptedFiles) => {
      const newFiles = acceptedFiles.map(file => ({
        ...file,
        id: uuidv4(),
        progress: 0
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  });

  // Handle file removal
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  // Handle cover art upload
  const handleCoverArtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProject(prev => ({
            ...prev,
            coverArtUrl: event.target?.result as string
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle adding a tag
  const handleAddTag = () => {
    if (newTag.trim() && !project.tags.includes(newTag.trim())) {
      setProject(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tag: string) => {
    setProject(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Handle individual file price change
  const handleFilePriceChange = (fileId: string, price: string) => {
    const numPrice = parseFloat(price);
    if (!isNaN(numPrice)) {
      setProject(prev => ({
        ...prev,
        pricing: {
          ...prev.pricing,
          individualPrices: {
            ...prev.pricing.individualPrices,
            [fileId]: numPrice
          }
        }
      }));
    }
  };

  // Handle project price change
  const handleProjectPriceChange = (price: string) => {
    const numPrice = parseFloat(price);
    if (!isNaN(numPrice)) {
      setProject(prev => ({
        ...prev,
        pricing: {
          ...prev.pricing,
          projectPrice: numPrice
        }
      }));
    } else {
      setProject(prev => ({
        ...prev,
        pricing: {
          ...prev.pricing,
          projectPrice: undefined
        }
      }));
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Move to next step
  const nextStep = () => {
    // Validate current step
    if (currentStep === 1 && files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one file to continue",
        variant: "destructive"
      });
      return;
    }

    if (currentStep === 2 && !project.title) {
      toast({
        title: "Title required",
        description: "Please enter a title for your project",
        variant: "destructive"
      });
      return;
    }

    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Move to previous step
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Submit the project
  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload files",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // 1. Upload files to storage
      const uploadedFiles = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${project.id}/${file.id}.${fileExt}`;
        
        // Update progress
        const progressPerFile = 100 / files.length;
        const baseProgress = i * progressPerFile;
        
        // Upload file
        const { error: uploadError } = await supabase.storage
          .from('audio_files')
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('audio_files')
          .getPublicUrl(filePath);
        
        // Add file record to database
        const { data: fileData, error: fileError } = await supabase
          .from('files')
          .insert([{
            id: file.id,
            name: file.name,
            file_url: publicUrl,
            file_path: filePath,
            size: file.size,
            file_type: 'audio',
            user_id: user.id
          }])
          .select()
          .single();
        
        if (fileError) throw fileError;
        
        uploadedFiles.push(fileData);
        
        // Update progress
        setUploadProgress(baseProgress + progressPerFile);
      }

      // 2. Create project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert([{
          id: project.id,
          title: project.title,
          description: project.description,
          type: project.type,
          genre: project.genre,
          bpm: project.bpm,
          key: project.key,
          tags: project.tags,
          cover_art_url: project.coverArtUrl,
          is_public: project.isPublic,
          user_id: user.id
        }])
        .select()
        .single();
      
      if (projectError) throw projectError;

      // 3. Link files to project
      const projectFiles = files.map((file, index) => ({
        project_id: project.id,
        file_id: file.id,
        position: index
      }));
      
      const { error: linkError } = await supabase
        .from('project_files')
        .insert(projectFiles);
      
      if (linkError) throw linkError;

      // 4. Set pricing
      const pricingRecords = [];
      
      // Project price if set
      if (project.pricing.projectPrice) {
        pricingRecords.push({
          project_id: project.id,
          price: project.pricing.projectPrice,
          license_type: project.pricing.licenseType
        });
      }
      
      // Individual file prices if set
      for (const [fileId, price] of Object.entries(project.pricing.individualPrices)) {
        if (price > 0) {
          pricingRecords.push({
            project_id: project.id,
            file_id: fileId,
            price,
            license_type: project.pricing.licenseType
          });
        }
      }
      
      if (pricingRecords.length > 0) {
        const { error: pricingError } = await supabase
          .from('project_pricing')
          .insert(pricingRecords);
        
        if (pricingError) throw pricingError;
      }

      // Success!
      toast({
        title: "Upload complete",
        description: "Your project has been successfully uploaded",
      });
      
      // Navigate to the project page or dashboard
      setTimeout(() => {
        navigate("/dashboard/projects");
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Drag & drop audio files here</h3>
              <p className="text-muted-foreground mb-4">or click to browse your files</p>
              <Button type="button" onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}>
                Select Files
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="audio/*"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    const newFiles = Array.from(e.target.files).map(file => ({
                      ...file,
                      id: uuidv4(),
                      progress: 0
                    }));
                    setFiles(prev => [...prev, ...newFiles]);
                  }
                }}
              />
            </div>

            {files.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 p-3 border-b">
                  <h3 className="font-medium">Selected Files ({files.length})</h3>
                </div>
                <div className="divide-y max-h-[300px] overflow-y-auto">
                  {files.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-md">
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
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title *</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    value={project.title} 
                    onChange={handleInputChange} 
                    placeholder="Enter project title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Project Type</Label>
                  <select
                    id="type"
                    name="type"
                    value={project.type}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="beat_tape">Beat Tape</option>
                    <option value="sound_pack">Sound Pack</option>
                    <option value="album">Album</option>
                    <option value="single">Single</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    value={project.description} 
                    onChange={handleInputChange} 
                    placeholder="Describe your project"
                    rows={4}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Cover Art</Label>
                  <div 
                    className="border-2 border-dashed rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                    onClick={() => coverArtInputRef.current?.click()}
                  >
                    {project.coverArtUrl ? (
                      <img 
                        src={project.coverArtUrl} 
                        alt="Cover Art" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload cover art</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={coverArtInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleCoverArtUpload}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="genre">Genre</Label>
                    <Input 
                      id="genre" 
                      name="genre" 
                      value={project.genre} 
                      onChange={handleInputChange} 
                      placeholder="e.g. Hip Hop"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bpm">BPM</Label>
                    <Input 
                      id="bpm" 
                      name="bpm" 
                      type="number" 
                      value={project.bpm || ''} 
                      onChange={handleInputChange} 
                      placeholder="e.g. 120"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="key">Key</Label>
                  <Input 
                    id="key" 
                    name="key" 
                    value={project.key || ''} 
                    onChange={handleInputChange} 
                    placeholder="e.g. C Minor"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {project.tags.map(tag => (
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
                  value={newTag} 
                  onChange={(e) => setNewTag(e.target.value)} 
                  placeholder="Add a tag"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag}>Add</Button>
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectPrice">Set a price for the entire project</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="projectPrice" 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        className="pl-9"
                        value={project.pricing.projectPrice || ''} 
                        onChange={(e) => handleProjectPriceChange(e.target.value)} 
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="licenseType">License Type</Label>
                    <select
                      id="licenseType"
                      value={project.pricing.licenseType}
                      onChange={(e) => setProject(prev => ({
                        ...prev,
                        pricing: {
                          ...prev.pricing,
                          licenseType: e.target.value
                        }
                      }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="standard">Standard License</option>
                      <option value="premium">Premium License</option>
                      <option value="exclusive">Exclusive License</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Individual File Pricing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto">
                    {files.map(file => (
                      <div key={file.id} className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-md">
                          <Music className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.name}</p>
                        </div>
                        <div className="w-32 relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            className="pl-9"
                            value={project.pricing.individualPrices[file.id] || ''} 
                            onChange={(e) => handleFilePriceChange(file.id, e.target.value)} 
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Publishing Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        project.isPublic ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                      onClick={() => setProject(prev => ({ ...prev, isPublic: true }))}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Globe className="h-5 w-5 text-primary" />
                        <h3 className="font-medium">Public</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Your project will be visible to everyone on your profile
                      </p>
                    </div>
                    
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        !project.isPublic ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                      onClick={() => setProject(prev => ({ ...prev, isPublic: false }))}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Lock className="h-5 w-5 text-primary" />
                        <h3 className="font-medium">Private</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Only you can see this project
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Destination</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <Globe className="h-5 w-5 text-primary" />
                        <h3 className="font-medium">Profile</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Publish to your public profile
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <Package className="h-5 w-5 text-primary" />
                        <h3 className="font-medium">Order</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Submit to an existing order
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <Folder className="h-5 w-5 text-primary" />
                        <h3 className="font-medium">Files</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Save to your private files
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 5:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review & Submit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2">Project Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Title:</span>
                        <span className="font-medium">{project.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span>{project.type.replace('_', ' ')}</span>
                      </div>
                      {project.genre && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Genre:</span>
                          <span>{project.genre}</span>
                        </div>
                      )}
                      {project.bpm && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">BPM:</span>
                          <span>{project.bpm}</span>
                        </div>
                      )}
                      {project.key && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Key:</span>
                          <span>{project.key}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Visibility:</span>
                        <span>{project.isPublic ? 'Public' : 'Private'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Pricing</h3>
                    <div className="space-y-2">
                      {project.pricing.projectPrice && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Project Price:</span>
                          <span className="font-medium">${project.pricing.projectPrice}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">License Type:</span>
                        <span>{project.pricing.licenseType}</span>
                      </div>
                      {Object.keys(project.pricing.individualPrices).length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Individual Prices:</span>
                          <span>{Object.keys(project.pricing.individualPrices).length} files priced</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Files ({files.length})</h3>
                  <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
                    {files.map(file => (
                      <div key={file.id} className="flex items-center gap-3 p-3">
                        <Music className="h-5 w-5 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        {project.pricing.individualPrices[file.id] && (
                          <Badge variant="outline">
                            ${project.pricing.individualPrices[file.id]}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {project.tags.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {project.description && (
                  <div>
                    <h3 className="font-medium mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Upload
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Upload Progress</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="container max-w-5xl mx-auto py-6 px-4 md:px-6">
      {/* Step Indicator */}
      <div className="mb-8">
        <Tabs value={currentStep.toString()} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger 
              value="1" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              onClick={() => currentStep > 1 && setCurrentStep(1)}
            >
              1. Upload
            </TabsTrigger>
            <TabsTrigger 
              value="2" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              onClick={() => currentStep > 2 && setCurrentStep(2)}
              disabled={currentStep < 2}
            >
              2. Organize
            </TabsTrigger>
            <TabsTrigger 
              value="3" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              onClick={() => currentStep > 3 && setCurrentStep(3)}
              disabled={currentStep < 3}
            >
              3. Price
            </TabsTrigger>
            <TabsTrigger 
              value="4" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              onClick={() => currentStep > 4 && setCurrentStep(4)}
              disabled={currentStep < 4}
            >
              4. Publish
            </TabsTrigger>
            <TabsTrigger 
              value="5" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              disabled={currentStep < 5}
            >
              5. Complete
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      {currentStep < 5 && (
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={nextStep}>
            {currentStep === 4 ? (
              <>
                Review
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default UploadWizard;