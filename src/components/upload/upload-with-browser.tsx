import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/contexts/auth-context';
import { 
  Search,
  Upload,
  FolderPlus,
  Folder,
  ChevronRight,
  ChevronDown,
  FileIcon
} from 'lucide-react';
import { Button } from '../@/ui/button';
import { Input } from '../@/ui/input';
import { Separator } from '../@/ui/separator';
import { cn } from '../@/lib/utils';
import { useToast } from '../../hooks/use-toast';
import { useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../@/ui/dialog';
import { FileItem } from '@/lib/types';

interface UnifiedFileBrowserProps {
  files: FileItem[];
  folders: FileItem[];
  onUpload: () => void;
  onCreateFolder: () => void;
  uploadFile: (
    file: File, 
    folderId?: string, 
    onProgress?: (progress: number) => void
  ) => Promise<{ success: boolean }>;
}

const demoFolders: FileItem[] = [
  {
    id: 'f1',
    name: 'My Projects',
    type: 'folder',
    modified: '2025-06-01',
    children: [
      {
        id: 'f1-1',
        name: 'Album 2025',
        type: 'folder',
        modified: '2025-06-01',
        children: [
          {
            id: '1',
            name: 'Track1.wav',
            type: 'audio',
            size: '24.5 MB',
            modified: '2025-05-05'
          },
          {
            id: '2',
            name: 'Track2.wav',
            type: 'audio',
            size: '25.1 MB',
            modified: '2025-05-05'
          }
        ]
      },
      {
        id: 'f1-2',
        name: 'Singles',
        type: 'folder',
        modified: '2025-05-20',
        children: [
          {
            id: '3',
            name: 'Mix1.mp3',
            type: 'audio',
            size: '8.2 MB',
            modified: '2025-05-04'
          }
        ]
      }
    ]
  },
  {
    id: 'f2',
    name: 'Sample Library',
    type: 'folder',
    modified: '2025-05-15',
    children: [
      {
        id: 'f2-1',
        name: 'Drums',
        type: 'folder',
        modified: '2025-05-02',
        children: [
          {
            id: '5',
            name: 'Kick.wav',
            type: 'audio',
            size: '1.8 MB',
            modified: '2025-05-02'
          },
          {
            id: '6',
            name: 'Snare.wav',
            type: 'audio',
            size: '2.1 MB',
            modified: '2025-05-02'
          }
        ]
      },
      {
        id: 'f2-2',
        name: 'Vocals',
        type: 'folder',
        modified: '2025-05-01',
        children: [
          {
            id: '7',
            name: 'Chorus.aiff',
            type: 'audio',
            size: '18.3 MB',
            modified: '2025-05-01'
          },
          {
            id: '8',
            name: 'Verse.ogg',
            type: 'audio',
            size: '12.4 MB',
            modified: '2025-05-01'
          }
        ]
      }
    ]
  },
  {
    id: 'f3',
    name: 'Collaborations',
    type: 'folder',
    modified: '2025-04-28'
  },
  {
    id: 'f4',
    name: 'Archived Projects',
    type: 'folder',
    modified: '2025-03-15'
  }
];

const demoFiles: FileItem[] = [
  {
    id: '1',
    name: 'Track1.wav',
    type: 'audio',
    size: '24.5 MB',
    modified: '2025-05-05'
  },
  {
    id: '2',
    name: 'Track2.wav',
    type: 'audio',
    size: '25.1 MB',
    modified: '2025-05-05'
  },
  {
    id: '3',
    name: 'Mix1.mp3',
    type: 'audio',
    size: '8.2 MB',
    modified: '2025-05-04'
  },
  {
    id: '4',
    name: 'Master1.flac',
    type: 'audio',
    size: '56.7 MB',
    modified: '2025-05-03'
  },
  {
    id: '5',
    name: 'Kick.wav',
    type: 'audio',
    size: '1.8 MB',
    modified: '2025-05-02'
  },
  {
    id: '6',
    name: 'Snare.wav',
    type: 'audio',
    size: '2.1 MB',
    modified: '2025-05-02'
  },
  {
    id: '7',
    name: 'Chorus.aiff',
    type: 'audio',
    size: '18.3 MB',
    modified: '2025-05-01'
  },
  {
    id: '8',
    name: 'Verse.ogg',
    type: 'audio',
    size: '12.4 MB',
    modified: '2025-05-01'
  }
];

export function UnifiedFileBrowser({ 
  files,
  folders: initialFolders,
  onUpload,
  onCreateFolder,
  uploadFile
}: UnifiedFileBrowserProps) {
  const { user } = useAuth();
  const [folders, setFolders] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load folders from database on mount
  useEffect(() => {
    if (!user?.id) return;
    
    const loadFolders = async () => {
      try {
        const { data, error } = await supabase
          .from('folders')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        setFolders(data || []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load folders",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadFolders();
  }, []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const { toast } = useToast();

  const handleNewFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newFolderName.trim()) {
      toast({
        title: "Error",
        description: "Folder name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Create new folder object for database
      const newFolder = {
        id: uuidv4(),
        name: newFolderName.trim(),
        user_id: user?.id,
        parent_id: selectedFolder || null
      };
      
      // Save to database
      const { data, error } = await supabase
        .from('folders')
        .insert(newFolder)
        .select()
        .single();
      
      if (error) throw error;
      
      // Create UI folder object
      const uiFolder: FileItem = {
        id: data.id,
        name: newFolderName.trim(),
        type: 'folder',
        modified: new Date().toISOString().split('T')[0],
        children: []
      };
      
      if (error) throw error;
      
      // Update local folders state
      setFolders(prev => [...prev, uiFolder]);
      setNewFolderName('');
      setShowNewFolderDialog(false);
      
      toast({
        title: "Folder created",
        description: `Folder "${newFolderName.trim()}" was created successfully`,
      });
    } catch (error) {
      console.error('Folder creation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create folder",
        variant: "destructive"
      });
    }
  };
  
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };
  
  const selectFolder = (folderId: string | null) => {
    setSelectedFolder(folderId);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

      const handleFileUpload = async () => {
        setIsUploading(true);
        setUploadProgress(0);
        
        const files = fileInputRef.current?.files;
        if (!files || files.length === 0) return;

        try {
          // Get the uploadFile function from props
          for (const file of Array.from(files)) {
            await uploadFile(file, selectedFolder || undefined, (progress: number) => {
              setUploadProgress(progress);
            });
          }

          toast({
            title: "Upload complete",
            description: "Your files have been uploaded successfully!",
          });
          
          // Refresh the file list
          if (typeof onUpload === 'function') {
            onUpload();
          }
        } catch (error) {
          toast({
            title: "Upload failed",
            description: error instanceof Error ? error.message : "Failed to upload files",
            variant: "destructive"
          });
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
        }
      };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileUpload();
  };

  // Function to get files for the selected folder
  const getFilesForSelectedFolder = () => {
    if (!selectedFolder) return files;
    
    // Find the selected folder
    const findFolder = (folders: FileItem[], id: string): FileItem | undefined => {
      for (const folder of folders) {
        if (folder.id === id) return folder;
        if (folder.children?.length) {
          const found = folder.children.find(child => child.id === id);
          if (found) return found;
          
          // Search deeper in subfolders
          const foundInChildren = findFolder(
            folder.children.filter(child => child.type === 'folder'),
            id
          );
          if (foundInChildren) return foundInChildren;
        }
      }
      return undefined;
    };
    
    const folder = findFolder(folders, selectedFolder);
    return folder?.children?.filter(item => item.type === 'audio') || [];
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-1 h-full">
        {/* Sidebar with filters */}
        <div className="w-64 space-y-4 p-4 border-r">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search files..."
              className="pl-8"
            />
          </div>

          <div>
            <Button
              className="w-full justify-start gap-2"
              onClick={handleUploadClick}
            >
              <Upload className="h-4 w-4" />
              <span>Upload Files</span>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
                multiple
                accept="audio/*,.mp3,.wav,.aiff,.flac,.ogg,.aac"
              />
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start gap-2 mt-2"
              onClick={() => setShowNewFolderDialog(true)}
            >
              <FolderPlus className="h-4 w-4" />
              <span>New Folder</span>
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <Button 
              variant={selectedFolder === null ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-2 py-1.5 h-auto text-sm rounded-md mb-2",
                "transition-all duration-200 hover:bg-primary/10",
                selectedFolder === null && "bg-primary/15 hover:bg-primary/20"
              )}
              onClick={() => selectFolder(null)}
            >
              <FileIcon className="h-4 w-4 text-primary" />
              <span>All Files</span>
            </Button>

            <h3 className="text-sm font-medium mb-2 px-2 flex items-center">
              <Folder className="h-4 w-4 mr-2 text-primary" />
              <span>Folders</span>
            </h3>
            <div className="space-y-0.5 max-h-[300px] overflow-y-auto pr-1">
              {folders.map((folder) => (
                <div key={folder.id} className="space-y-0.5 transition-all duration-200">
                  <Button 
                    variant={selectedFolder === folder.id ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-2 py-1.5 h-auto text-sm rounded-md",
                      "transition-all duration-200 hover:bg-primary/10",
                      selectedFolder === folder.id && "bg-primary/15 hover:bg-primary/20"
                    )}
                    onClick={() => {
                      selectFolder(folder.id);
                      if (folder.children?.length) {
                        toggleFolder(folder.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-1.5 min-w-[24px]">
                      {folder.children?.length ? (
                        <div className="transition-transform duration-200" 
                             style={{ transform: expandedFolders[folder.id] ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                          <ChevronRight className="h-4 w-4 flex-shrink-0" />
                        </div>
                      ) : (
                        <div className="w-4" />
                      )}
                      <Folder className={cn(
                        "h-4 w-4 flex-shrink-0",
                        selectedFolder === folder.id ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <span className="truncate">{folder.name}</span>
                    {folder.children?.length && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {folder.children.filter(c => c.type === 'audio').length}
                      </span>
                    )}
                  </Button>
                  
                  {/* Render subfolders if expanded */}
                  <div className={cn(
                    "space-y-0.5 overflow-hidden transition-all duration-200",
                    expandedFolders[folder.id] ? "max-h-96" : "max-h-0"
                  )}>
                    {folder.children?.filter(item => item.type === 'folder').map((subfolder) => (
                      <Button 
                        key={subfolder.id}
                        variant={selectedFolder === subfolder.id ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-2 py-1.5 h-auto text-sm pl-8 rounded-md",
                          "transition-all duration-200 hover:bg-primary/10",
                          selectedFolder === subfolder.id && "bg-primary/15 hover:bg-primary/20"
                        )}
                        onClick={() => {
                          selectFolder(subfolder.id);
                          if (subfolder.children?.length) {
                            toggleFolder(subfolder.id);
                          }
                        }}
                      >
                        <div className="flex items-center gap-1.5 min-w-[24px]">
                          {subfolder.children?.length ? (
                            <div className="transition-transform duration-200" 
                                 style={{ transform: expandedFolders[subfolder.id] ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                              <ChevronRight className="h-4 w-4 flex-shrink-0" />
                            </div>
                          ) : (
                            <div className="w-4" />
                          )}
                          <Folder className={cn(
                            "h-4 w-4 flex-shrink-0",
                            selectedFolder === subfolder.id ? "text-primary" : "text-muted-foreground"
                          )} />
                        </div>
                        <span className="truncate">{subfolder.name}</span>
                        {subfolder.children?.length && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {subfolder.children.filter(c => c.type === 'audio').length}
                          </span>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Separator />
        </div>

        {/* Main file browser area */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b">
            <h1 className="text-2xl font-bold">
              {selectedFolder ? 
                folders.find(f => f.id === selectedFolder)?.name || 'Files' : 
                'All Files'
              }
            </h1>
          </div>

          <div
            className={cn(
              "border-2 border-dashed rounded-lg m-4 p-4 text-center",
              "transition-all hover:border-primary/50"
            )}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">Uploading...</p>
                <div className="relative h-2 max-w-md mx-auto rounded-full bg-gray-200 overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full rounded-full" 
                    style={{ width: `${uploadProgress}%`, backgroundColor: '#3b82f6' }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag and drop audio files here or{" "}
                <Button variant="link" className="p-0 h-auto" onClick={handleUploadClick}>
                  browse
                </Button>
              </p>
              </div>
            )}
          </div>

          <div className="flex-1 p-4">
            {/* Display files for selected folder */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFilesForSelectedFolder().map((file) => (
                <div 
                  key={file.id} 
                  className="p-3 border rounded-lg hover:shadow-md transition-all duration-200 flex items-center gap-3 cursor-pointer hover:bg-primary/5"
                >
                  <div className="p-2 bg-primary/10 rounded-md">
                    <FileIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{file.size}</span>
                      <span>•</span>
                      <span>{file.modified}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Folder creation dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Input
                id="folderName"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="col-span-4"
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline"
              onClick={() => setShowNewFolderDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleNewFolder}>
              Create Folder
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DndProvider>
  );
}
