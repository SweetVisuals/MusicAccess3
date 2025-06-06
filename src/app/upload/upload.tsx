import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useFiles } from '@/hooks/useFiles';
import { FileItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { 
  Search, 
  Upload, 
  FolderPlus, 
  File, 
  Folder, 
  ChevronRight, 
  ChevronDown,
  MoreVertical, 
  Star, 
  Heart,
  Tag, 
  Trash2, 
  Pencil, 
  Download,
  Music,
  FileText,
  Image,
  Video,
  Move,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List as ListIcon,
  Info,
  X,
  Plus,
  Share2,
  Clock,
  ArrowUpDown
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '@/components/ui/menubar';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/@/ui/scroll-area';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// File type icons mapping
const FileTypeIcon = ({ type, className }: { type: string, className?: string }) => {
  switch (type) {
    case 'audio':
      return <Music className={cn("text-blue-500", className)} />;
    case 'image':
      return <Image className={cn("text-green-500", className)} />;
    case 'video':
      return <Video className={cn("text-red-500", className)} />;
    case 'document':
      return <FileText className={cn("text-purple-500", className)} />;
    case 'folder':
      return <Folder className={cn("text-amber-500", className)} />;
    default:
      return <File className={cn("text-gray-500", className)} />;
  }
};

// Item types for drag and drop
const ItemTypes = {
  FILE: 'file',
  FOLDER: 'folder'
};

interface DraggableItemProps {
  item: FileItem;
  index: number;
  onSelect: (item: FileItem) => void;
  isSelected: boolean;
  onContextMenu: (e: React.MouseEvent, item: FileItem) => void;
  onDoubleClick: (item: FileItem) => void;
  viewMode: 'grid' | 'list';
}

const DraggableItem = ({ 
  item, 
  index, 
  onSelect, 
  isSelected, 
  onContextMenu,
  onDoubleClick,
  viewMode
}: DraggableItemProps) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: item.type === 'folder' ? ItemTypes.FOLDER : ItemTypes.FILE,
    item: { id: item.id, index, type: item.type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Allow multi-select with Ctrl/Cmd key
      onSelect(item);
    } else {
      onSelect(item);
    }
  };

  if (viewMode === 'grid') {
    return (
      <div
        ref={drag}
        className={cn(
          "group relative p-2 rounded-lg border transition-all duration-200 cursor-pointer",
          isSelected ? "bg-primary/10 border-primary" : "bg-card hover:bg-accent/50 border-transparent hover:border-accent",
          isDragging && "opacity-50"
        )}
        onClick={handleClick}
        onContextMenu={(e) => onContextMenu(e, item)}
        onDoubleClick={() => onDoubleClick(item)}
      >
        <div className="flex flex-col items-center p-2 gap-2">
          <div className="relative">
            {item.type === 'folder' ? (
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/30 rounded-lg flex items-center justify-center">
                <Folder className="h-8 w-8 text-amber-500" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950/30 rounded-lg flex items-center justify-center">
                <FileTypeIcon type={item.type} className="h-8 w-8" />
              </div>
            )}
            {item.starred && (
              <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5">
                <Star className="h-3 w-3 text-white fill-current" />
              </div>
            )}
          </div>
          <div className="text-center w-full">
            <p className="text-sm font-medium truncate max-w-[120px]">{item.name}</p>
            {item.size && (
              <p className="text-xs text-muted-foreground">{item.size}</p>
            )}
          </div>
        </div>
        
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                // Handle rename
              }}>
                <Pencil className="mr-2 h-4 w-4" />
                <span>Rename</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                // Handle star/unstar
              }}>
                <Star className="mr-2 h-4 w-4" />
                <span>{item.starred ? 'Unstar' : 'Star'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                // Handle download
              }}>
                <Download className="mr-2 h-4 w-4" />
                <span>Download</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle delete
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  } else {
    // List view
    return (
      <div
        ref={drag}
        className={cn(
          "group flex items-center justify-between p-2 rounded-lg border transition-all duration-200 cursor-pointer",
          isSelected ? "bg-primary/10 border-primary" : "bg-card hover:bg-accent/50 border-transparent hover:border-accent",
          isDragging && "opacity-50"
        )}
        onClick={handleClick}
        onContextMenu={(e) => onContextMenu(e, item)}
        onDoubleClick={() => onDoubleClick(item)}
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {item.type === 'folder' ? (
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-950/30 rounded-md flex items-center justify-center">
                <Folder className="h-4 w-4 text-amber-500" />
              </div>
            ) : (
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950/30 rounded-md flex items-center justify-center">
                <FileTypeIcon type={item.type} className="h-4 w-4" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{item.name}</p>
            {item.modified && (
              <p className="text-xs text-muted-foreground">Modified {item.modified}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {item.starred && (
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
          )}
          {item.size && (
            <span className="text-xs text-muted-foreground">{item.size}</span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                // Handle rename
              }}>
                <Pencil className="mr-2 h-4 w-4" />
                <span>Rename</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                // Handle star/unstar
              }}>
                <Star className="mr-2 h-4 w-4" />
                <span>{item.starred ? 'Unstar' : 'Star'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                // Handle download
              }}>
                <Download className="mr-2 h-4 w-4" />
                <span>Download</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle delete
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }
};

// Droppable folder component
const DroppableFolder = ({ 
  folder, 
  onDrop, 
  children 
}: { 
  folder: FileItem, 
  onDrop: (itemId: string, targetFolderId: string) => void,
  children: React.ReactNode
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: [ItemTypes.FILE, ItemTypes.FOLDER],
    drop: (item: { id: string }, monitor) => {
      if (!monitor.didDrop()) {
        onDrop(item.id, folder.id);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div 
      ref={drop} 
      className={cn(
        "transition-colors duration-200",
        isOver && "bg-primary/20 rounded-lg"
      )}
    >
      {children}
    </div>
  );
};

// Main file manager component
export default function FileManager() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const {
    files,
    folders,
    loading,
    error,
    createFolder,
    uploadFile,
    fetchFiles,
    fetchFolders,
    deleteFile,
    deleteFolder,
    moveFile,
    moveFolder
  } = useFiles(user?.id || '');

  // State for UI
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<FileItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [breadcrumbPath, setBreadcrumbPath] = useState<{id: string, name: string}[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  
  // Dialogs state
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [itemToRename, setItemToRename] = useState<FileItem | null>(null);
  const [itemsToDelete, setItemsToDelete] = useState<FileItem[]>([]);
  const [itemsToMove, setItemsToMove] = useState<FileItem[]>([]);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [contextMenuPosition, setContextMenuPosition] = useState<{x: number, y: number} | null>(null);
  const [contextMenuTarget, setContextMenuTarget] = useState<FileItem | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showFileInfo, setShowFileInfo] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string | null>(null);
  
  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('file-favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Save favorites to localStorage when changed
  useEffect(() => {
    localStorage.setItem('file-favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Handle folder navigation
  const navigateToFolder = (folderId: string | null, folderName?: string) => {
    setCurrentFolder(folderId);
    setSelectedItems([]);
    
    if (folderId === null) {
      // Going to root
      setBreadcrumbPath([]);
    } else if (folderName) {
      // Direct navigation with known folder name
      if (currentFolder === null) {
        // From root to folder
        setBreadcrumbPath([{ id: folderId, name: folderName }]);
      } else {
        // Add to existing path
        setBreadcrumbPath([...breadcrumbPath, { id: folderId, name: folderName }]);
      }
    }
    
    // Fetch files for the new folder
    fetchFiles(folderId);
  };

  // Navigate up one level
  const navigateUp = () => {
    if (breadcrumbPath.length === 0) {
      return; // Already at root
    }
    
    if (breadcrumbPath.length === 1) {
      // Going back to root
      navigateToFolder(null);
    } else {
      // Going up one level
      const newPath = breadcrumbPath.slice(0, -1);
      const parentFolder = newPath[newPath.length - 1];
      setCurrentFolder(parentFolder.id);
      setBreadcrumbPath(newPath);
      fetchFiles(parentFolder.id);
    }
  };

  // Handle file upload
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      let successCount = 0;
      const totalFiles = files.length;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const result = await uploadFile(file, currentFolder, (progress) => {
          // Calculate overall progress
          const fileProgress = progress / 100;
          const overallProgress = ((i + fileProgress) / totalFiles) * 100;
          setUploadProgress(Math.round(overallProgress));
        });
        
        if (result.success) {
          successCount++;
        }
      }
      
      toast({
        title: "Upload complete",
        description: `Successfully uploaded ${successCount} of ${totalFiles} files`,
      });
      
      // Refresh the file list
      fetchFiles(currentFolder);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle folder creation
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Error",
        description: "Folder name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    const result = await createFolder(newFolderName, currentFolder);
    
    if (result.success) {
      toast({
        title: "Folder created",
        description: `Folder "${newFolderName}" was created successfully`
      });
      setNewFolderName('');
      setShowNewFolderDialog(false);
      fetchFolders();
      fetchFiles(currentFolder);
    } else {
      toast({
        title: "Error creating folder",
        description: result.error as string,
        variant: "destructive"
      });
    }
  };

  // Handle item selection
  const handleSelectItem = (item: FileItem) => {
    if (selectedItems.some(i => i.id === item.id)) {
      // Deselect if already selected
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
      if (selectedFile?.id === item.id) {
        setSelectedFile(null);
      }
    } else {
      // Select the item
      setSelectedItems([...selectedItems, item]);
      setSelectedFile(item);
    }
  };

  // Handle item double click (open folder or preview file)
  const handleItemDoubleClick = (item: FileItem) => {
    if (item.type === 'folder') {
      navigateToFolder(item.id, item.name);
    } else {
      setSelectedFile(item);
      setShowFileInfo(true);
    }
  };

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent, item: FileItem) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuTarget(item);
    setShowContextMenu(true);
  };

  // Handle rename
  const handleRename = async () => {
    if (!itemToRename || !newItemName.trim()) {
      toast({
        title: "Error",
        description: "Name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (itemToRename.type === 'folder') {
        // Rename folder
        const { error } = await supabase
          .from('folders')
          .update({ name: newItemName })
          .eq('id', itemToRename.id);
        
        if (error) throw error;
      } else {
        // Rename file
        const { error } = await supabase
          .from('files')
          .update({ name: newItemName })
          .eq('id', itemToRename.id);
        
        if (error) throw error;
      }
      
      toast({
        title: "Renamed successfully",
        description: `"${itemToRename.name}" renamed to "${newItemName}"`
      });
      
      setShowRenameDialog(false);
      setItemToRename(null);
      setNewItemName('');
      
      // Refresh data
      fetchFolders();
      fetchFiles(currentFolder);
    } catch (error) {
      toast({
        title: "Error renaming item",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (itemsToDelete.length === 0) return;
    
    try {
      let successCount = 0;
      
      for (const item of itemsToDelete) {
        if (item.type === 'folder') {
          const result = await deleteFolder(item.id);
          if (result.success) successCount++;
        } else {
          const result = await deleteFile(item.id, item.file_path || '');
          if (result.success) successCount++;
        }
      }
      
      toast({
        title: "Deleted successfully",
        description: `Deleted ${successCount} of ${itemsToDelete.length} items`
      });
      
      setShowDeleteDialog(false);
      setItemsToDelete([]);
      setSelectedItems([]);
      
      // Refresh data
      fetchFolders();
      fetchFiles(currentFolder);
    } catch (error) {
      toast({
        title: "Error deleting items",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  };

  // Handle move
  const handleMove = async () => {
    if (itemsToMove.length === 0 || targetFolderId === undefined) return;
    
    try {
      let successCount = 0;
      
      for (const item of itemsToMove) {
        if (item.type === 'folder') {
          const result = await moveFolder(item.id, targetFolderId);
          if (result.success) successCount++;
        } else {
          const result = await moveFile(item.id, targetFolderId);
          if (result.success) successCount++;
        }
      }
      
      toast({
        title: "Moved successfully",
        description: `Moved ${successCount} of ${itemsToMove.length} items`
      });
      
      setShowMoveDialog(false);
      setItemsToMove([]);
      setTargetFolderId(null);
      
      // Refresh data
      fetchFolders();
      fetchFiles(currentFolder);
    } catch (error) {
      toast({
        title: "Error moving items",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  };

  // Handle favorite toggle
  const toggleFavorite = (itemId: string) => {
    if (favorites.includes(itemId)) {
      setFavorites(favorites.filter(id => id !== itemId));
    } else {
      setFavorites([...favorites, itemId]);
    }
  };

  // Get current files based on folder and filters
  const getCurrentFiles = useCallback(() => {
    let filteredFiles = [...files];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredFiles = filteredFiles.filter(file => 
        file.name.toLowerCase().includes(query)
      );
    }
    
    // Apply type filter
    if (filterType) {
      filteredFiles = filteredFiles.filter(file => file.type === filterType);
    }
    
    // Apply sorting
    filteredFiles.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(b.modified || '').getTime() - new Date(a.modified || '').getTime();
          break;
        case 'size':
          // Parse size strings like "1.2 MB" to numbers for comparison
          const getSize = (size?: string) => {
            if (!size) return 0;
            const match = size.match(/^([\d.]+)\s*([KMGT]B)$/i);
            if (!match) return 0;
            const num = parseFloat(match[1]);
            const unit = match[2].toUpperCase();
            const multipliers: Record<string, number> = {
              'KB': 1,
              'MB': 1024,
              'GB': 1024 * 1024,
              'TB': 1024 * 1024 * 1024
            };
            return num * (multipliers[unit] || 1);
          };
          comparison = getSize(a.size) - getSize(b.size);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return filteredFiles;
  }, [files, searchQuery, filterType, sortBy, sortDirection]);

  // Render folder tree for navigation
  const renderFolderTree = (folderItems: FileItem[], level = 0) => {
    return folderItems.map(folder => (
      <div key={folder.id} className="transition-all duration-200">
        <DroppableFolder folder={folder} onDrop={(itemId, targetId) => handleItemDrop(itemId, targetId)}>
          <Button 
            variant={currentFolder === folder.id ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start gap-2 py-1.5 h-auto text-sm rounded-md",
              "transition-all duration-200 hover:bg-primary/10",
              currentFolder === folder.id && "bg-primary/15 hover:bg-primary/20",
              level > 0 && `pl-${4 + level * 4}`
            )}
            onClick={() => navigateToFolder(folder.id, folder.name)}
          >
            <div className="flex items-center gap-1.5 min-w-[24px]">
              {folder.children?.length ? (
                <div 
                  className="transition-transform duration-200" 
                  style={{ transform: expandedFolders[folder.id] ? 'rotate(90deg)' : 'rotate(0deg)' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedFolders(prev => ({
                      ...prev,
                      [folder.id]: !prev[folder.id]
                    }));
                  }}
                >
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                </div>
              ) : (
                <div className="w-4" />
              )}
              <Folder className={cn(
                "h-4 w-4 flex-shrink-0",
                currentFolder === folder.id ? "text-primary" : "text-muted-foreground",
                favorites.includes(folder.id) && "text-yellow-500"
              )} />
            </div>
            <span className="truncate">{folder.name}</span>
          </Button>
        </DroppableFolder>
        
        {/* Render subfolders if expanded */}
        {folder.children && expandedFolders[folder.id] && (
          <div className="ml-4">
            {renderFolderTree(folder.children.filter(item => item.type === 'folder'), level + 1)}
          </div>
        )}
      </div>
    ));
  };

  // Handle drag and drop
  const handleItemDrop = async (itemId: string, targetFolderId: string) => {
    // Prevent dropping a folder into itself or its descendants
    if (itemId === targetFolderId) {
      toast({
        title: "Invalid operation",
        description: "Cannot move a folder into itself",
        variant: "destructive"
      });
      return;
    }
    
    // Find the item being moved
    const findItem = (items: FileItem[]): FileItem | null => {
      for (const item of items) {
        if (item.id === itemId) return item;
        if (item.children) {
          const found = findItem(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    const item = findItem([...folders, ...files]);
    if (!item) return;
    
    // Check if target is a descendant of the source (for folders)
    if (item.type === 'folder') {
      const isDescendant = (parentId: string, childId: string): boolean => {
        const parent = folders.find(f => f.id === parentId);
        if (!parent || !parent.children) return false;
        
        for (const child of parent.children) {
          if (child.id === childId) return true;
          if (child.type === 'folder' && isDescendant(child.id, childId)) return true;
        }
        
        return false;
      };
      
      if (isDescendant(itemId, targetFolderId)) {
        toast({
          title: "Invalid operation",
          description: "Cannot move a folder into its descendant",
          variant: "destructive"
        });
        return;
      }
    }
    
    try {
      if (item.type === 'folder') {
        await moveFolder(itemId, targetFolderId);
      } else {
        await moveFile(itemId, targetFolderId);
      }
      
      toast({
        title: "Item moved",
        description: `"${item.name}" moved successfully`
      });
      
      // Refresh data
      fetchFolders();
      fetchFiles(currentFolder);
    } catch (error) {
      toast({
        title: "Error moving item",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  };

  // Handle drag over for upload area
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle drop for upload area
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      let successCount = 0;
      const totalFiles = droppedFiles.length;
      
      for (let i = 0; i < droppedFiles.length; i++) {
        const file = droppedFiles[i];
        const result = await uploadFile(file, currentFolder, (progress) => {
          // Calculate overall progress
          const fileProgress = progress / 100;
          const overallProgress = ((i + fileProgress) / totalFiles) * 100;
          setUploadProgress(Math.round(overallProgress));
        });
        
        if (result.success) {
          successCount++;
        }
      }
      
      toast({
        title: "Upload complete",
        description: `Successfully uploaded ${successCount} of ${totalFiles} files`,
      });
      
      // Refresh the file list
      fetchFiles(currentFolder);
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected items with Delete key
      if (e.key === 'Delete' && selectedItems.length > 0) {
        setItemsToDelete(selectedItems);
        setShowDeleteDialog(true);
      }
      
      // Select all with Ctrl+A
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSelectedItems(files);
      }
      
      // Copy selected items with Ctrl+C
      if (e.key === 'c' && (e.ctrlKey || e.metaKey) && selectedItems.length > 0) {
        // Implement copy functionality
      }
      
      // Cut selected items with Ctrl+X
      if (e.key === 'x' && (e.ctrlKey || e.metaKey) && selectedItems.length > 0) {
        // Implement cut functionality
      }
      
      // Paste items with Ctrl+V
      if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
        // Implement paste functionality
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItems, files]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showContextMenu) {
        setShowContextMenu(false);
      }
    };
    
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [showContextMenu]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full">
        {/* Top Menu Bar */}
        <Menubar className="rounded-none border-b border-t-0 border-x-0 px-2">
          <MenubarMenu>
            <MenubarTrigger className="font-medium">File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={handleUploadClick}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Files
                <MenubarShortcut>⌘U</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={() => setShowNewFolderDialog(true)}>
                <FolderPlus className="mr-2 h-4 w-4" />
                New Folder
                <MenubarShortcut>⌘N</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem disabled={selectedItems.length === 0} onClick={() => {
                if (selectedItems.length > 0) {
                  setItemsToDelete(selectedItems);
                  setShowDeleteDialog(true);
                }
              }}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
                <MenubarShortcut>⌫</MenubarShortcut>
              </MenubarItem>
              <MenubarItem disabled={selectedItems.length !== 1} onClick={() => {
                if (selectedItems.length === 1) {
                  setItemToRename(selectedItems[0]);
                  setNewItemName(selectedItems[0].name);
                  setShowRenameDialog(true);
                }
              }}>
                <Pencil className="mr-2 h-4 w-4" />
                Rename
                <MenubarShortcut>F2</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          
          <MenubarMenu>
            <MenubarTrigger className="font-medium">Edit</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => setSelectedItems(files)}>
                Select All
                <MenubarShortcut>⌘A</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={() => setSelectedItems([])}>
                Deselect All
                <MenubarShortcut>⎋</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem disabled={selectedItems.length === 0}>
                Copy
                <MenubarShortcut>⌘C</MenubarShortcut>
              </MenubarItem>
              <MenubarItem disabled={selectedItems.length === 0}>
                Cut
                <MenubarShortcut>⌘X</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                Paste
                <MenubarShortcut>⌘V</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          
          <MenubarMenu>
            <MenubarTrigger className="font-medium">View</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => setViewMode('grid')}>
                <Grid className="mr-2 h-4 w-4" />
                Grid View
                {viewMode === 'grid' && <Check className="ml-auto h-4 w-4" />}
              </MenubarItem>
              <MenubarItem onClick={() => setViewMode('list')}>
                <ListIcon className="mr-2 h-4 w-4" />
                List View
                {viewMode === 'list' && <Check className="ml-auto h-4 w-4" />}
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                <SortAsc className="mr-2 h-4 w-4" />
                Sort By
                <MenubarContent>
                  <MenubarItem onClick={() => setSortBy('name')}>
                    Name
                    {sortBy === 'name' && <Check className="ml-auto h-4 w-4" />}
                  </MenubarItem>
                  <MenubarItem onClick={() => setSortBy('date')}>
                    Date Modified
                    {sortBy === 'date' && <Check className="ml-auto h-4 w-4" />}
                  </MenubarItem>
                  <MenubarItem onClick={() => setSortBy('size')}>
                    Size
                    {sortBy === 'size' && <Check className="ml-auto h-4 w-4" />}
                  </MenubarItem>
                  <MenubarItem onClick={() => setSortBy('type')}>
                    Type
                    {sortBy === 'type' && <Check className="ml-auto h-4 w-4" />}
                  </MenubarItem>
                </MenubarContent>
              </MenubarItem>
              <MenubarItem onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}>
                {sortDirection === 'asc' ? (
                  <>
                    <SortAsc className="mr-2 h-4 w-4" />
                    Ascending
                  </>
                ) : (
                  <>
                    <SortDesc className="mr-2 h-4 w-4" />
                    Descending
                  </>
                )}
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                <Filter className="mr-2 h-4 w-4" />
                Filter By Type
                <MenubarContent>
                  <MenubarItem onClick={() => setFilterType(null)}>
                    All Files
                    {filterType === null && <Check className="ml-auto h-4 w-4" />}
                  </MenubarItem>
                  <MenubarItem onClick={() => setFilterType('audio')}>
                    Audio
                    {filterType === 'audio' && <Check className="ml-auto h-4 w-4" />}
                  </MenubarItem>
                  <MenubarItem onClick={() => setFilterType('image')}>
                    Images
                    {filterType === 'image' && <Check className="ml-auto h-4 w-4" />}
                  </MenubarItem>
                  <MenubarItem onClick={() => setFilterType('video')}>
                    Videos
                    {filterType === 'video' && <Check className="ml-auto h-4 w-4" />}
                  </MenubarItem>
                  <MenubarItem onClick={() => setFilterType('document')}>
                    Documents
                    {filterType === 'document' && <Check className="ml-auto h-4 w-4" />}
                  </MenubarItem>
                </MenubarContent>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          
          <MenubarMenu>
            <MenubarTrigger className="font-medium">Help</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                Keyboard Shortcuts
              </MenubarItem>
              <MenubarItem>
                About File Manager
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>

        <div className="flex flex-1 h-full overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-64 border-r p-4 flex flex-col h-full">
            <div className="space-y-4">
              {/* Search */}
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
              
              {/* Quick Actions */}
              <div className="space-y-2">
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
                  className="w-full justify-start gap-2"
                  onClick={() => setShowNewFolderDialog(true)}
                >
                  <FolderPlus className="h-4 w-4" />
                  <span>New Folder</span>
                </Button>
              </div>
              
              <Separator />
              
              {/* Navigation */}
              <div className="space-y-2">
                <Button 
                  variant={currentFolder === null ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2 py-1.5 h-auto text-sm rounded-md",
                    "transition-all duration-200 hover:bg-primary/10",
                    currentFolder === null && "bg-primary/15 hover:bg-primary/20"
                  )}
                  onClick={() => navigateToFolder(null)}
                >
                  <Folder className="h-4 w-4 text-primary" />
                  <span>All Files</span>
                </Button>
                
                <Button 
                  variant="ghost"
                  className="w-full justify-start gap-2 py-1.5 h-auto text-sm rounded-md"
                >
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>Recent</span>
                </Button>
                
                <Button 
                  variant="ghost"
                  className="w-full justify-start gap-2 py-1.5 h-auto text-sm rounded-md"
                >
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>Favorites</span>
                </Button>
                
                <Button 
                  variant="ghost"
                  className="w-full justify-start gap-2 py-1.5 h-auto text-sm rounded-md"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                  <span>Trash</span>
                </Button>
              </div>
              
              <Separator />
              
              {/* Folder Tree */}
              <div className="space-y-1">
                <h3 className="text-sm font-medium px-2 flex items-center">
                  <Folder className="h-4 w-4 mr-2 text-primary" />
                  <span>Folders</span>
                </h3>
                
                <ScrollArea className="h-[calc(100vh-350px)] pr-3">
                  <div className="space-y-0.5">
                    {renderFolderTree(folders)}
                  </div>
                </ScrollArea>
              </div>
              
              <Separator />
              
              {/* Storage Usage */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium px-2">Storage</h3>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>25% used</span>
                    <span>25 GB of 100 GB</span>
                  </div>
                  <Progress value={25} className="h-2" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Breadcrumb and Actions */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-2"
                  onClick={() => navigateToFolder(null)}
                >
                  <Folder className="h-4 w-4 mr-1" />
                  Root
                </Button>
                
                {breadcrumbPath.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => {
                        const newPath = breadcrumbPath.slice(0, index + 1);
                        setBreadcrumbPath(newPath);
                        setCurrentFolder(item.id);
                        fetchFiles(item.id);
                      }}
                    >
                      {item.name}
                    </Button>
                  </React.Fragment>
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                      >
                        {viewMode === 'grid' ? (
                          <ListIcon className="h-4 w-4" />
                        ) : (
                          <Grid className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1">
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      <span>Sort</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuRadioGroup value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
                      <DropdownMenuRadioItem value="name">Name</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="date">Date Modified</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="size">Size</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="type">Type</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={sortDirection === 'asc'}
                      onCheckedChange={(checked) => setSortDirection(checked ? 'asc' : 'desc')}
                    >
                      Ascending
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1">
                      <Filter className="h-3.5 w-3.5" />
                      <span>Filter</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuRadioGroup value={filterType || 'all'} onValueChange={(value) => setFilterType(value === 'all' ? null : value)}>
                      <DropdownMenuRadioItem value="all">All Files</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="audio">Audio</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="image">Images</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="video">Videos</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="document">Documents</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {selectedItems.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8"
                    onClick={() => {
                      setItemsToDelete(selectedItems);
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
            
            {/* File Drop Area */}
            <div 
              className="flex-1 p-4 overflow-auto"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {isUploading ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <div className="space-y-4">
                    <Upload className="h-8 w-8 mx-auto text-primary animate-pulse" />
                    <p className="text-muted-foreground">Uploading files...</p>
                    <div className="max-w-md mx-auto">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="mt-2 text-sm text-muted-foreground">{uploadProgress}% complete</p>
                    </div>
                  </div>
                </div>
              ) : files.length === 0 && !loading ? (
                <div 
                  className="border-2 border-dashed rounded-lg p-8 text-center h-full flex flex-col items-center justify-center"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="space-y-4 max-w-md">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="text-lg font-medium">No files in this folder</h3>
                    <p className="text-sm text-muted-foreground">
                      Drag and drop files here, or click the upload button to add files
                    </p>
                    <div className="flex justify-center gap-4">
                      <Button onClick={handleUploadClick}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Files
                      </Button>
                      <Button variant="outline" onClick={() => setShowNewFolderDialog(true)}>
                        <FolderPlus className="h-4 w-4 mr-2" />
                        New Folder
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={cn(
                  viewMode === 'grid' 
                    ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4" 
                    : "flex flex-col space-y-2"
                )}>
                  {loading ? (
                    // Loading skeleton
                    Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className={cn(
                        "animate-pulse",
                        viewMode === 'grid' 
                          ? "p-4 rounded-lg border bg-muted/50 h-32" 
                          : "p-4 rounded-lg border bg-muted/50 h-16"
                      )} />
                    ))
                  ) : (
                    // Render files
                    getCurrentFiles().map((file, index) => (
                      <DraggableItem
                        key={file.id}
                        item={file}
                        index={index}
                        onSelect={handleSelectItem}
                        isSelected={selectedItems.some(item => item.id === file.id)}
                        onContextMenu={handleContextMenu}
                        onDoubleClick={handleItemDoubleClick}
                        viewMode={viewMode}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Sidebar - File Info */}
          {selectedFile && showFileInfo && (
            <div className="w-72 border-l p-4 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-lg">File Info</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowFileInfo(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="relative w-full aspect-square bg-muted rounded-md flex items-center justify-center">
                  <FileTypeIcon type={selectedFile.type} className="h-16 w-16" />
                </div>
                
                <div className="text-center">
                  <h4 className="font-medium">{selectedFile.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedFile.size} • {selectedFile.modified}
                  </p>
                </div>
                
                <div className="flex justify-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toggleFavorite(selectedFile.id)}
                  >
                    <Star className={cn(
                      "h-4 w-4 mr-1",
                      favorites.includes(selectedFile.id) && "fill-yellow-500 text-yellow-500"
                    )} />
                    {favorites.includes(selectedFile.id) ? 'Unfavorite' : 'Favorite'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setItemToRename(selectedFile);
                      setNewItemName(selectedFile.name);
                      setShowRenameDialog(true);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Rename
                  </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Name</span>
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Type</span>
                    <span className="text-sm font-medium capitalize">{selectedFile.type}</span>
                  </div>
                  {selectedFile.size && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Size</span>
                      <span className="text-sm font-medium">{selectedFile.size}</span>
                    </div>
                  )}
                  {selectedFile.modified && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Modified</span>
                      <span className="text-sm font-medium">{selectedFile.modified}</span>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="w-full">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm" className="w-full">
                      <Move className="h-4 w-4 mr-1" />
                      Move
                    </Button>
                    <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
                
                {selectedFile.type === 'audio' && selectedFile.audio_url && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Audio Preview</h4>
                      <audio 
                        controls 
                        className="w-full" 
                        src={selectedFile.audio_url}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* New Folder Dialog */}
        <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                Enter a name for your new folder
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateFolder}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Rename Dialog */}
        <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename {itemToRename?.type === 'folder' ? 'Folder' : 'File'}</DialogTitle>
              <DialogDescription>
                Enter a new name for "{itemToRename?.name}"
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="New name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowRenameDialog(false);
                setItemToRename(null);
                setNewItemName('');
              }}>
                Cancel
              </Button>
              <Button onClick={handleRename}>
                Rename
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete {itemsToDelete.length > 1 ? 'Items' : itemsToDelete[0]?.type === 'folder' ? 'Folder' : 'File'}</DialogTitle>
              <DialogDescription>
                {itemsToDelete.length > 1 
                  ? `Are you sure you want to delete ${itemsToDelete.length} items? This action cannot be undone.`
                  : `Are you sure you want to delete "${itemsToDelete[0]?.name}"? This action cannot be undone.`
                }
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowDeleteDialog(false);
                setItemsToDelete([]);
              }}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Move Dialog */}
        <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Move {itemsToMove.length > 1 ? 'Items' : itemsToMove[0]?.type === 'folder' ? 'Folder' : 'File'}</DialogTitle>
              <DialogDescription>
                Select a destination folder
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[300px] overflow-y-auto">
              <Button 
                variant="ghost"
                className="w-full justify-start mb-2"
                onClick={() => setTargetFolderId(null)}
              >
                <Folder className="h-4 w-4 mr-2" />
                Root
              </Button>
              
              <div className="space-y-1">
                {folders.map(folder => (
                  <Button 
                    key={folder.id}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setTargetFolderId(folder.id)}
                  >
                    <Folder className="h-4 w-4 mr-2" />
                    {folder.name}
                  </Button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowMoveDialog(false);
                setItemsToMove([]);
                setTargetFolderId(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleMove}>
                Move
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
}