import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from "@/components/dashboard/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/@/ui/sidebar";
import { SiteHeader } from "@/components/dashboard/layout/site-header";
import { 
  Music, 
  Image, 
  FileText, 
  Video, 
  Upload, 
  ChevronRight, 
  ChevronLeft,
  Check
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/@/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/@/ui/tabs";
import { Card, CardContent } from "@/components/@/ui/card";
import { useDropzone } from 'react-dropzone';
import { Progress } from "@/components/@/ui/progress";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from 'uuid';

export default function UploadWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('audio');
  const [step, setStep] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    genre: '',
    bpm: '',
    key: '',
    isPublic: false,
    tags: [] as string[],
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: acceptedFiles => {
      setFiles(acceptedFiles);
    },
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.aac', '.ogg'],
      'image/*': activeTab === 'image' ? ['.jpg', '.jpeg', '.png', '.gif'] : [],
      'video/*': activeTab === 'video' ? ['.mp4', '.mov', '.avi'] : [],
      'application/pdf': activeTab === 'document' ? ['.pdf'] : [],
      'text/plain': activeTab === 'document' ? ['.txt'] : [],
      'application/msword': activeTab === 'document' ? ['.doc', '.docx'] : [],
    },
    maxFiles: 10,
    multiple: true
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setFiles([]);
    setStep(1);
  };

  const handleNext = () => {
    if (step === 1 && files.length === 0) {
      toast.error('Please select at least one file to upload');
      return;
    }
    
    if (step === 2 && !metadata.title) {
      toast.error('Please enter a title');
      return;
    }
    
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleUpload();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleUpload = async () => {
    if (!user) {
      toast.error('You must be logged in to upload files');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = uuidv4();
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${fileId}.${fileExt}`;
        
        // Update progress
        const currentProgress = Math.round((i / files.length) * 100);
        setUploadProgress(currentProgress);
        
        // Upload to Supabase Storage
        const { error: storageError } = await supabase.storage
          .from('audio_files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (storageError) throw storageError;
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('audio_files')
          .getPublicUrl(filePath);
        
        // Add to database
        const { error: dbError } = await supabase
          .from('audio_tracks')
          .insert([{
            title: metadata.title || file.name,
            description: metadata.description,
            file_path: filePath,
            duration: 0, // This would need to be calculated
            user_id: user.id,
            genre: metadata.genre,
            bpm: metadata.bpm ? parseInt(metadata.bpm) : null,
            key: metadata.key,
            is_public: metadata.isPublic
          }]);
        
        if (dbError) throw dbError;
      }
      
      // Set final progress
      setUploadProgress(100);
      
      // Show success message
      toast.success('Files uploaded successfully');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/files');
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/30 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Drag & drop files here</h3>
              <p className="text-muted-foreground mb-2">or click to browse your files</p>
              <p className="text-sm text-muted-foreground">
                {activeTab === 'audio' && 'Supported formats: MP3, WAV, FLAC, AAC, OGG'}
                {activeTab === 'image' && 'Supported formats: JPG, PNG, GIF'}
                {activeTab === 'video' && 'Supported formats: MP4, MOV, AVI'}
                {activeTab === 'document' && 'Supported formats: PDF, TXT, DOC, DOCX'}
              </p>
            </div>
            
            {files.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Selected Files ({files.length})</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div className="flex items-center gap-2">
                        {activeTab === 'audio' && <Music className="h-4 w-4 text-primary" />}
                        {activeTab === 'image' && <Image className="h-4 w-4 text-primary" />}
                        {activeTab === 'video' && <Video className="h-4 w-4 text-primary" />}
                        {activeTab === 'document' && <FileText className="h-4 w-4 text-primary" />}
                        <span className="text-sm truncate max-w-md">{file.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
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
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    value={metadata.title} 
                    onChange={(e) => setMetadata({...metadata, title: e.target.value})}
                    placeholder="Enter title"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={metadata.description} 
                    onChange={(e) => setMetadata({...metadata, description: e.target.value})}
                    placeholder="Enter description"
                    rows={4}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="genre">Genre</Label>
                  <Input 
                    id="genre" 
                    value={metadata.genre} 
                    onChange={(e) => setMetadata({...metadata, genre: e.target.value})}
                    placeholder="e.g. Hip Hop, Electronic"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bpm">BPM</Label>
                    <Input 
                      id="bpm" 
                      type="number" 
                      value={metadata.bpm} 
                      onChange={(e) => setMetadata({...metadata, bpm: e.target.value})}
                      placeholder="e.g. 120"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="key">Key</Label>
                    <Input 
                      id="key" 
                      value={metadata.key} 
                      onChange={(e) => setMetadata({...metadata, key: e.target.value})}
                      placeholder="e.g. C Minor"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 pt-4">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={metadata.isPublic}
                    onChange={(e) => setMetadata({...metadata, isPublic: e.target.checked})}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="isPublic">Make this upload public</Label>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="border rounded-lg p-6">
              <h3 className="font-medium text-lg mb-4">Review Your Upload</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Files</h4>
                    <p className="font-medium">{files.length} file(s) selected</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Title</h4>
                    <p className="font-medium">{metadata.title || 'Untitled'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                    <p className="font-medium">{metadata.description || 'No description'}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Genre</h4>
                    <p className="font-medium">{metadata.genre || 'Not specified'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">BPM</h4>
                      <p className="font-medium">{metadata.bpm || 'Not specified'}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">Key</h4>
                      <p className="font-medium">{metadata.key || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Visibility</h4>
                    <Badge variant={metadata.isPublic ? "default" : "secondary"}>
                      {metadata.isPublic ? 'Public' : 'Private'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {isUploading && (
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
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
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Upload Files</h1>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList>
                <TabsTrigger value="audio" className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  Audio
                </TabsTrigger>
                <TabsTrigger value="image" className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Images
                </TabsTrigger>
                <TabsTrigger value="video" className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Videos
                </TabsTrigger>
                <TabsTrigger value="document" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents
                </TabsTrigger>
              </TabsList>

              <Card className="mt-6">
                <CardContent className="pt-6">
                  {/* Step Indicator */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {step > 1 ? <Check className="h-4 w-4" /> : 1}
                        </div>
                        <div className={`h-1 w-12 ${step > 1 ? 'bg-primary' : 'bg-muted'}`}></div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {step > 2 ? <Check className="h-4 w-4" /> : 2}
                        </div>
                        <div className={`h-1 w-12 ${step > 2 ? 'bg-primary' : 'bg-muted'}`}></div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          3
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-2 text-sm">
                      <span className={step >= 1 ? 'text-primary font-medium' : 'text-muted-foreground'}>
                        Select Files
                      </span>
                      <span className={step >= 2 ? 'text-primary font-medium' : 'text-muted-foreground'}>
                        Add Details
                      </span>
                      <span className={step >= 3 ? 'text-primary font-medium' : 'text-muted-foreground'}>
                        Review & Upload
                      </span>
                    </div>
                  </div>

                  <TabsContent value="audio" className="mt-0">
                    {renderStepContent()}
                  </TabsContent>
                  
                  <TabsContent value="image" className="mt-0">
                    {renderStepContent()}
                  </TabsContent>
                  
                  <TabsContent value="video" className="mt-0">
                    {renderStepContent()}
                  </TabsContent>
                  
                  <TabsContent value="document" className="mt-0">
                    {renderStepContent()}
                  </TabsContent>

                  <div className="flex justify-between mt-8">
                    <Button 
                      variant="outline" 
                      onClick={handleBack}
                      disabled={step === 1 || isUploading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    
                    <Button 
                      onClick={handleNext}
                      disabled={isUploading}
                    >
                      {step < 3 ? (
                        <>
                          Next
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </>
                      ) : isUploading ? (
                        'Uploading...'
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Files
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}