import { useState, useRef, useEffect, useMemo } from 'react';
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
  FileIcon,
  Trash2,
  Edit,
  Star,
  Download,
  MoreHorizontal,
  AlertCircle,
  Music
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
  DialogFooter
} from '../@/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../@/ui/dropdown-menu';
import { Progress } from '../@/ui/progress';
import { FileItem } from '@/lib/types';

interface UnifiedFileBrowserProps {
  files: FileItem[];
  folders: FileItem[];
  onUpload: () => void;
  onCreateFolder: () => void;
  uploadFile: (
    file: File, 
    folderId?: string | null, 
    onProgress?: (progress: number) => void
  ) => Promise<{ success: boolean }>;
}

export function UnifiedFileBrowser({ 
  files,
  folders,
  onUpload,
  onCreateFolder,
  uploadFile
}: UnifiedFileBrowserProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [itemToRename, setItemToRename] = useState<{id: string, name: string, isFolder: boolean} | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<{name: string, progress: number}[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showAllFiles, setShowAllFiles] = useState(true);
  const MAX_UPLOAD_FILES = 10;
  
  // Filter files based on search query and selected folder
  const filteredFiles = useMemo(() => {
    let result = files;
    
    // Filter by search query if provided
    if (searchQuery.trim()) {
      result = result.filter(file => 
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // If not showing all files, filter by selected folder
    if (!showAllFiles) {
      if (selectedFolder !== null) {
        result = result.filter(file => file.folder_id === selectedFolder);
      } else {
        // In root folder, show only files with no folder_id
        result = result.filter(file => file.folder_id === null);
      }
    }
    
    return result;
  }, [files, searchQuery, selectedFolder, showAllFiles]);

  useEffect(() => {
    // Expand folders that contain the selected folder
    if (selectedFolder) {
      const findParentFolders = (folderId: string, allFolders: FileItem[]): string[] => {
        for (const folder of allFolders) {
          if (folder.id === folderId) {
            return [];
          }
          
          if (folder.children) {
            for (const child of folder.children) {
              if (child.id === folderId) {
                return [folder.id];
              }
              
              if (child.type === 'folder') {
                const parentFolders = findParentFolders(folderId, [child]);
                if (parentFolders.length > 0) {
                  return [folder.id, ...parentFolders];
                }
              }
            }
          }
        }
        
        return [];
      };
      
      const parentFolders = findParentFolders(selectedFolder, folders);
      
      if (parentFolders.length > 0) {
        const newExpandedFolders = { ...expandedFolders };
        parentFolders.forEach(id => {
          newExpandedFolders[id] = true;
        });
        setExpandedFolders(newExpandedFolders);
      }
    }
  }, [selectedFolder, folders]);

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
      // Create new folder
      const { error } = await supabase
        .from('folders')
        .insert([{ 
          id: uuidv4(),
          name: newFolderName.trim(), 
          user_id: user?.id,
          parent_id: selectedFolder || null
        }]);
      
      if (error) throw error;
      
      setNewFolderName('');
      setShowNewFolderDialog(false);
      
      toast({
        title: "Folder created",
        description: `Folder "${newFolderName.trim()}" was created successfully`,
      });
      
      // Refresh folders
      onCreateFolder();
    } catch (error) {
      console.error('Folder creation error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create folder",
        variant: "destructive"
      });
    }
  };

  const handleRenameItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newFileName.trim() || !itemToRename) {
      toast({
        title: "Error",
        description: "Name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (itemToRename.isFolder) {
        // Rename folder in database
        const { error } = await supabase
          .from('folders')
          .update({ name: newFileName.trim() })
          .eq('id', itemToRename.id);
        
        if (error) throw error;
        
        // Refresh folders
        onCreateFolder();
      } else {
        // Rename file in database
        const { error } = await supabase
          .from('files')
          .update({ name: newFileName.trim() })
          .eq('id', itemToRename.id);
        
        if (error) throw error;
        
        // Refresh files
        onUpload();
      }
      
      setShowRenameDialog(false);
      setItemToRename(null);
      setNewFileName('');
      
      toast({
        title: "Renamed successfully",
        description: `Item renamed to "${newFileName.trim()}"`,
      });
    } catch (error) {
      console.error('Rename error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to rename item",
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
    setSelectedItems([]);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event?: React.ChangeEvent<HTMLInputElement>) => {
    const files = event?.target.files || fileInputRef.current?.files;
    if (!files || files.length === 0) return;
    
    // Check if too many files are selected
    if (files.length > MAX_UPLOAD_FILES) {
      toast({
        title: "Too many files",
        description: `You can upload a maximum of ${MAX_UPLOAD_FILES} files at once`,
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // Initialize uploading files array
    const filesArray = Array.from(files).map(file => ({
      name: file.name,
      progress: 0
    }));
    setUploadingFiles(filesArray);

    try {
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Update overall progress
        setUploadProgress(Math.round((i / files.length) * 100));
        
        // Upload the file with progress tracking
        await uploadFile(file, selectedFolder, (progress) => {
          // Update individual file progress
          setUploadingFiles(prev => {
            const newFiles = [...prev];
            if (newFiles[i]) {
              newFiles[i] = { ...newFiles[i], progress };
            }
            return newFiles;
          });
        });
      }

      // Set final progress to 100%
      setUploadProgress(100);
      
      toast({
        title: "Upload complete",
        description: `Successfully uploaded ${files.length} file${files.length > 1 ? 's' : ''}`,
      });
      
      // Refresh the file list
      onUpload();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadingFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 1000); // Keep progress visible briefly after completion
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;
    
    // Check if too many files are dropped
    if (droppedFiles.length > MAX_UPLOAD_FILES) {
      toast({
        title: "Too many files",
        description: `You can upload a maximum of ${MAX_UPLOAD_FILES} files at once`,
        variant: "destructive"
      });
      return;
    }
    
    // Set the files to the file input and trigger upload
    if (fileInputRef.current) {
      // Note: This is a hack as we can't directly set files property
      // Create a DataTransfer object to set files
      const dataTransfer = new DataTransfer();
      for (let i = 0; i < droppedFiles.length; i++) {
        dataTransfer.items.add(droppedFiles[i]);
      }
      fileInputRef.current.files = dataTransfer.files;
      handleFileUpload();
    }
  };

  const handleDeleteItem = async (id: string, isFolder: boolean, filePath?: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete this ${isFolder ? 'folder' : 'file'}?`);
    if (!confirmDelete) return;
    
    try {
      if (isFolder) {
        // Delete folder from database
        const { error } = await supabase
          .from('folders')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        // Refresh folders
        onCreateFolder();
      } else {
        // Delete file from storage if path exists
        if (filePath) {
          const { error: storageError } = await supabase.storage
            .from('audio_files')
            .remove([filePath]);
          
          if (storageError) throw storageError;
        }
        
        // Delete file from database
        const { error } = await supabase
          .from('files')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        // Refresh files
        onUpload();
      }
      
      toast({
        title: "Deleted successfully",
        description: `${isFolder ? 'Folder' : 'File'} has been deleted`,
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete item",
        variant: "destructive"
      });
    }
  };

  const handleToggleStar = async (id: string, isFolder: boolean, currentStarred: boolean) => {
    try {
      if (isFolder) {
        const { error } = await supabase
          .from('folders')
          .update({ starred: !currentStarred })
          .eq('id', id);
        
        if (error) throw error;
        
        // Refresh folders
        onCreateFolder();
      } else {
        const { error } = await supabase
          .from('files')
          .update({ starred: !currentStarred })
          .eq('id', id);
        
        if (error) throw error;
        
        // Refresh files
        onUpload();
      }
      
      toast({
        title: currentStarred ? "Removed from starred" : "Added to starred",
        description: `Item has been ${currentStarred ? 'removed from' : 'added to'} starred items`,
      });
    } catch (error) {
      console.error('Star toggle error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update star status",
        variant: "destructive"
      });
    }
  };

  const handleDownloadFile = (file: FileItem) => {
    if (!file.audio_url) {
      toast({
        title: "Download failed",
        description: "File URL is not available",
        variant: "destructive"
      });
      return;
    }
    
    const link = document.createElement('a');
    link.href = file.audio_url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started",
      description: `Downloading ${file.name}`
    });
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // File drag and drop functionality
  const handleFileDrop = async (fileId: string, targetFolderId: string | null) => {
    try {
      // Move file to target folder
      const { error } = await supabase
        .from('files')
        .update({ folder_id: targetFolderId })
        .eq('id', fileId);
      
      if (error) throw error;
      
      toast({
        title: "File moved",
        description: "File has been moved successfully"
      });
      
      // Refresh files
      onUpload();
    } catch (error) {
      toast({
        title: "Error moving file",
        description: error instanceof Error ? error.message : "Failed to move file",
        variant: "destructive"
      });
    }
  };

  // Draggable File Component
  const DraggableFile = ({ file }: { file: FileItem }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: 'FILE',
      item: { id: file.id, type: 'file' },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging()
      })
    }));

    // Get folder name for the file if it has a folder_id
    const folderName = useMemo(() => {
      if (!file.folder_id) return null;
      
      // Find the folder in the flat list
      const findFolderName = (folderId: string, folderList: FileItem[]): string | null => {
        for (const folder of folderList) {
          if (folder.id === folderId) {
            return folder.name;
          }
          
          if (folder.children) {
            const childResult = findFolderName(folderId, folder.children);
            if (childResult) return childResult;
          }
        }
        
        return null;
      };
      
      return findFolderName(file.folder_id, folders);
    }, [file.folder_id, folders]);

    return (
      <div 
        ref={drag}
        className={cn(
          "p-3 border rounded-lg transition-all duration-200 flex items-center gap-3 cursor-pointer",
          isDragging ? "opacity-50" : "",
          selectedItems.includes(file.id) 
            ? "bg-primary/10 border-primary" 
            : "hover:shadow-md hover:bg-primary/5"
        )}
        onClick={() => toggleItemSelection(file.id)}
      >
        <div className="p-2 bg-primary/10 rounded-md">
          <Music className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="font-medium truncate">{file.name}</p>
            {file.starred && (
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
            )}
          </div>
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>{file.size}</span>
              <span>•</span>
              <span className="truncate">{file.modified}</span>
            </div>
            {folderName && showAllFiles && (
              <div className="flex items-center gap-1">
                <Folder className="h-3 w-3" />
                <span className="truncate">{folderName}</span>
              </div>
            )}
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              handleDownloadFile(file);
            }}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              setItemToRename({
                id: file.id,
                name: file.name,
                isFolder: false
              });
              setNewFileName(file.name);
              setShowRenameDialog(true);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              handleToggleStar(file.id, false, !!file.starred);
            }}>
              <Star className={cn(
                "h-4 w-4 mr-2",
                file.starred && "fill-yellow-400 text-yellow-400"
              )} />
              {file.starred ? 'Unstar' : 'Star'}
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteItem(file.id, false, file.file_path);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  // Droppable Folder Component
  const DroppableFolder = ({ folder, depth = 0 }: { folder: FileItem, depth?: number }) => {
    const [{ isOver }, drop] = useDrop(() => ({
      accept: 'FILE',
      drop: (item: { id: string, type: string }) => {
        if (item.type === 'file') {
          handleFileDrop(item.id, folder.id);
        }
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver()
      })
    }));

    return (
      <div 
        ref={drop}
        className={cn(
          "transition-all duration-200",
          isOver && "bg-primary/10 rounded-md"
        )}
      >
        <div className="flex items-center">
          <Button 
            variant={selectedFolder === folder.id ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-2 py-1.5 h-auto text-sm rounded-md",
              "transition-all duration-200 hover:bg-primary/10",
              selectedFolder === folder.id && "bg-primary/15 hover:bg-primary/20",
              depth > 0 && `pl-${4 + depth * 4}`
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
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 ml-1">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                setItemToRename({
                  id: folder.id,
                  name: folder.name,
                  isFolder: true
                });
                setNewFileName(folder.name);
                setShowRenameDialog(true);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleStar(folder.id, true, !!folder.starred)}>
                <Star className={cn(
                  "h-4 w-4 mr-2",
                  folder.starred && "fill-yellow-400 text-yellow-400"
                )} />
                {folder.starred ? 'Unstar' : 'Star'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-500"
                onClick={() => handleDeleteItem(folder.id, true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Render subfolders if expanded */}
        <div className={cn(
          "space-y-0.5 overflow-hidden transition-all duration-200",
          expandedFolders[folder.id] ? "max-h-96" : "max-h-0"
        )}>
          {folder.children?.filter(item => item.type === 'folder').map((subfolder) => (
            <DroppableFolder key={subfolder.id} folder={subfolder} depth={depth + 1} />
          ))}
        </div>
      </div>
    );
  };

  // Root level droppable area
  const RootDroppable = () => {
    const [{ isOver }, drop] = useDrop(() => ({
      accept: 'FILE',
      drop: (item: { id: string, type: string }) => {
        if (item.type === 'file') {
          handleFileDrop(item.id, null);
        }
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver()
      })
    }));

    return (
      <div 
        ref={drop}
        className={cn(
          "transition-all duration-200",
          isOver && "bg-primary/10 rounded-md"
        )}
      >
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
      </div>
    );
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm"
              className={cn(
                "text-xs",
                showAllFiles ? "text-primary font-medium" : "text-muted-foreground"
              )}
              onClick={() => setShowAllFiles(true)}
            >
              Show All Files
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className={cn(
                "text-xs",
                !showAllFiles ? "text-primary font-medium" : "text-muted-foreground"
              )}
              onClick={() => setShowAllFiles(false)}
            >
              Filter by Folder
            </Button>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="text-sm font-medium mb-2 px-2 flex items-center">
              <Folder className="h-4 w-4 mr-2 text-primary" />
              <span>Folders</span>
            </h3>
            
            <div className="space-y-0.5 max-h-[300px] overflow-y-auto pr-1">
              <RootDroppable />
              
              {folders.map((folder) => (
                <DroppableFolder key={folder.id} folder={folder} />
              ))}
            </div>
          </div>
          
          <Separator />

          {/* Starred Items Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium mb-2 px-2 flex items-center">
              <Star className="h-4 w-4 mr-2 text-yellow-400" />
              <span>Starred</span>
            </h3>
            <div className="space-y-0.5 max-h-[200px] overflow-y-auto pr-1">
              {[...folders, ...files]
                .filter(item => item.starred)
                .map(item => (
                  <Button 
                    key={item.id}
                    variant="ghost"
                    className="w-full justify-start gap-2 py-1.5 h-auto text-sm rounded-md"
                    onClick={() => {
                      if (item.type === 'folder') {
                        selectFolder(item.id);
                      } else {
                        // Handle file selection
                        toggleItemSelection(item.id);
                      }
                    }}
                  >
                    {item.type === 'folder' ? (
                      <Folder className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <FileIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="truncate">{item.name}</span>
                  </Button>
                ))}
            </div>
          </div>
        </div>

        {/* Main file browser area */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              {showAllFiles ? 'All Files' : (
                selectedFolder ? 
                  folders.find(f => f.id === selectedFolder)?.name || 'Files' : 
                  'Root Files'
              )}
            </h1>
            {showAllFiles && selectedFolder && (
              <div className="text-sm text-muted-foreground">
                Showing all files. Selected folder: {folders.find(f => f.id === selectedFolder)?.name}
              </div>
            )}
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
                <div className="relative max-w-md mx-auto">
                  <Progress 
                    value={uploadProgress} 
                    className="h-2" 
                  />
                </div>
                <p className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</p>
                
                {/* Individual file progress */}
                {uploadingFiles.length > 1 && (
                  <div className="mt-4 max-w-md mx-auto">
                    <h4 className="text-sm font-medium text-left mb-2">Files ({uploadingFiles.length})</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {uploadingFiles.map((file, index) => (
                        <div key={index} className="text-left">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="truncate max-w-[80%]">{file.name}</span>
                            <span>{Math.round(file.progress)}%</span>
                          </div>
                          <Progress 
                            value={file.progress} 
                            className="h-1" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                <p className="text-xs text-muted-foreground">
                  Maximum {MAX_UPLOAD_FILES} files at once
                </p>
              </div>
            )}
          </div>

          <div className="flex-1 p-4">
            {filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <FileIcon className="h-12 w-12 mb-4 opacity-30" />
                <p>No files found</p>
                <p className="text-sm">Upload files or select a different folder</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFiles.map((file) => (
                  <DraggableFile key={file.id} file={file} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Folder dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleNewFolder}>
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
            <DialogFooter>
              <Button 
                type="button"
                variant="outline"
                onClick={() => setShowNewFolderDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Create Folder
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename {itemToRename?.isFolder ? 'Folder' : 'File'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRenameItem}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Input
                  id="newName"
                  placeholder="New name"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="col-span-4"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button"
                variant="outline"
                onClick={() => {
                  setShowRenameDialog(false);
                  setItemToRename(null);
                  setNewFileName('');
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                Rename
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DndProvider>
  );
}