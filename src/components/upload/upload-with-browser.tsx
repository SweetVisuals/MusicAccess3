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
  Music,
  MoreVertical,
  Trash2,
  Pencil,
  Download,
  Share2,
  FileText,
  Star,
  Clock,
  Grid,
  List,
  Filter,
  SortAsc,
  SortDesc,
  X,
  Info,
  AlertCircle,
  CheckCircle2
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
  DialogFooter,
} from '../@/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../@/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../@/ui/tooltip';
import { Progress } from '../@/ui/progress';
import { Badge } from '../@/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../@/ui/tabs';
import { FileItem } from '@/lib/types';
import { Skeleton } from '../@/ui/skeleton';

interface UnifiedFileBrowserProps {
  initialFiles?: FileItem[];
  files?: FileItem[];
  folders?: FileItem[];
  onUpload?: () => void;
  onCreateFolder?: () => void;
  uploadFile?: (
    file: File, 
    folderId?: string, 
    onProgress?: (progress: number) => void
  ) => Promise<{ success: boolean }>;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'name' | 'date' | 'size' | 'type';
type SortDirection = 'asc' | 'desc';

export function UnifiedFileBrowser({ 
  initialFiles,
  files: propFiles,
  folders: propFolders,
  onUpload,
  onCreateFolder,
  uploadFile: propUploadFile
}: UnifiedFileBrowserProps) {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileItem[]>(propFiles || initialFiles || []);
  const [folders, setFolders] = useState<FileItem[]>(propFolders || []);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [itemToRename, setItemToRename] = useState<FileItem | null>(null);
  const [itemsToDelete, setItemsToDelete] = useState<FileItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<FileItem | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'audio' | 'recent' | 'starred'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Update local state when prop files/folders change
  useEffect(() => {
    if (propFiles) setFiles(propFiles);
    if (propFolders) setFolders(propFolders);
    setIsLoading(false);
  }, [propFiles, propFolders]);

  // Load folders and files from Supabase if not provided as props
  useEffect(() => {
    if (!user?.id || (propFiles && propFolders)) return;
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load folders
        const { data: folderData, error: folderError } = await supabase
          .from('folders')
          .select('*')
          .eq('user_id', user.id);
        
        if (folderError) throw folderError;
        
        // Build folder hierarchy
        const rootFolders: FileItem[] = [];
        const folderMap: Record<string, FileItem> = {};
        
        // First pass: Create folder objects
        folderData?.forEach(folder => {
          folderMap[folder.id] = {
            id: folder.id,
            name: folder.name,
            type: 'folder',
            modified: folder.updated_at || folder.created_at,
            children: []
          };
        });
        
        // Second pass: Build hierarchy
        folderData?.forEach(folder => {
          const folderItem = folderMap[folder.id];
          
          if (folder.parent_id && folderMap[folder.parent_id]) {
            // Add to parent's children
            if (!folderMap[folder.parent_id].children) {
              folderMap[folder.parent_id].children = [];
            }
            folderMap[folder.parent_id].children?.push(folderItem);
          } else {
            // Root level folder
            rootFolders.push(folderItem);
          }
        });
        
        setFolders(rootFolders);
        
        // Load files
        const { data: fileData, error: fileError } = await supabase
          .from('files')
          .select('*')
          .eq('user_id', user.id);
        
        if (fileError) throw fileError;
        
        const formattedFiles: FileItem[] = fileData?.map(file => ({
          id: file.id,
          name: file.name,
          type: file.file_type || 'file',
          size: formatFileSize(file.size),
          modified: file.updated_at || file.created_at,
          audio_url: file.file_url,
          file_path: file.file_path,
          folder_id: file.folder_id
        })) || [];
        
        setFiles(formattedFiles);
      } catch (err) {
        console.error('Error loading data:', err);
        toast({
          title: "Error",
          description: "Failed to load files and folders",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user?.id, propFiles, propFolders]);

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter files based on search query and selected folder
  const filteredFiles = useMemo(() => {
    let result = files;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(file => 
        file.name.toLowerCase().includes(query)
      );
    }
    
    // Filter by selected folder
    if (selectedFolder) {
      result = result.filter(file => file.folder_id === selectedFolder);
    } else if (activeTab !== 'all') {
      // Don't filter by folder if we're in a special tab
    } else {
      // Show only root files (no folder) when no folder is selected
      result = result.filter(file => !file.folder_id);
    }
    
    // Filter by tab
    if (activeTab === 'audio') {
      result = result.filter(file => file.type === 'audio');
    } else if (activeTab === 'recent') {
      // Sort by date and take the first 20
      result = [...result].sort((a, b) => {
        const dateA = a.modified ? new Date(a.modified).getTime() : 0;
        const dateB = b.modified ? new Date(b.modified).getTime() : 0;
        return dateB - dateA;
      }).slice(0, 20);
    } else if (activeTab === 'starred') {
      result = result.filter(file => file.starred);
    }
    
    // Sort files
    result = [...result].sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'date' && a.modified && b.modified) {
        const dateA = new Date(a.modified).getTime();
        const dateB = new Date(b.modified).getTime();
        comparison = dateA - dateB;
      } else if (sortBy === 'size' && a.size && b.size) {
        // Extract numeric part from size string (e.g., "2.5 MB" -> 2.5)
        const sizeRegex = /^([\d.]+)\s*([KMGT]?B)$/i;
        const matchA = a.size.match(sizeRegex);
        const matchB = b.size.match(sizeRegex);
        
        if (matchA && matchB) {
          const sizeA = parseFloat(matchA[1]);
          const sizeB = parseFloat(matchB[1]);
          const unitA = matchA[2].toUpperCase();
          const unitB = matchB[2].toUpperCase();
          
          const units = ['B', 'KB', 'MB', 'GB', 'TB'];
          const unitIndexA = units.indexOf(unitA);
          const unitIndexB = units.indexOf(unitB);
          
          if (unitIndexA !== unitIndexB) {
            comparison = unitIndexA - unitIndexB;
          } else {
            comparison = sizeA - sizeB;
          }
        }
      } else if (sortBy === 'type') {
        comparison = a.type.localeCompare(b.type);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [files, searchQuery, selectedFolder, activeTab, sortBy, sortDirection]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // If we have a prop uploadFile function, use it
        if (propUploadFile) {
          await propUploadFile(file, selectedFolder || undefined, (progress) => {
            setUploadProgress(progress);
          });
        } else {
          // Otherwise use our own implementation
          await uploadFile(file);
        }
        
        // Update progress for multiple files
        setUploadProgress(((i + 1) / files.length) * 100);
      }
      
      toast({
        title: "Upload complete",
        description: "Your files have been uploaded successfully!",
      });
      
      // Refresh files
      if (onUpload) {
        onUpload();
      } else {
        await fetchFiles();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Clear the input value so the same file can be uploaded again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File) => {
    if (!user?.id) throw new Error("User not authenticated");
    
    // Generate unique file path
    const fileId = uuidv4();
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${fileId}.${fileExt}`;
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('audio_files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) throw uploadError;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('audio_files')
      .getPublicUrl(filePath);
    
    // Add file record to database
    const { error: dbError } = await supabase
      .from('files')
      .insert([{
        id: fileId,
        name: file.name,
        file_url: publicUrl,
        file_path: filePath,
        size: file.size,
        file_type: getFileType(file.type),
        user_id: user.id,
        folder_id: selectedFolder
      }]);
    
    if (dbError) throw dbError;
    
    return { success: true, fileId, url: publicUrl };
  };

  const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.includes('pdf')) return 'document';
    return 'file';
  };

  const fetchFiles = async () => {
    if (!user?.id) return;
    
    try {
      let query = supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const formattedFiles: FileItem[] = data.map(file => ({
        id: file.id,
        name: file.name,
        type: file.file_type || 'file',
        size: formatFileSize(file.size),
        modified: file.updated_at || file.created_at,
        audio_url: file.file_url,
        file_path: file.file_path,
        folder_id: file.folder_id
      }));
      
      setFiles(formattedFiles);
    } catch (err) {
      console.error('Error fetching files:', err);
      toast({
        title: "Error",
        description: "Failed to fetch files",
        variant: "destructive"
      });
    }
  };

  const fetchFolders = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Build folder hierarchy
      const rootFolders: FileItem[] = [];
      const folderMap: Record<string, FileItem> = {};
      
      // First pass: Create folder objects
      data?.forEach(folder => {
        folderMap[folder.id] = {
          id: folder.id,
          name: folder.name,
          type: 'folder',
          modified: folder.updated_at || folder.created_at,
          children: []
        };
      });
      
      // Second pass: Build hierarchy
      data?.forEach(folder => {
        const folderItem = folderMap[folder.id];
        
        if (folder.parent_id && folderMap[folder.parent_id]) {
          // Add to parent's children
          if (!folderMap[folder.parent_id].children) {
            folderMap[folder.parent_id].children = [];
          }
          folderMap[folder.parent_id].children?.push(folderItem);
        } else {
          // Root level folder
          rootFolders.push(folderItem);
        }
      });
      
      setFolders(rootFolders);
    } catch (err) {
      console.error('Error fetching folders:', err);
      toast({
        title: "Error",
        description: "Failed to fetch folders",
        variant: "destructive"
      });
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Error",
        description: "Folder name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    try {
      if (onCreateFolder) {
        onCreateFolder();
      } else {
        // Create folder in Supabase
        const folderId = uuidv4();
        const { error } = await supabase
          .from('folders')
          .insert([{ 
            id: folderId,
            name: newFolderName, 
            user_id: user?.id,
            parent_id: selectedFolder
          }]);
        
        if (error) throw error;
        
        // Add to local state
        const newFolder: FileItem = {
          id: folderId,
          name: newFolderName,
          type: 'folder',
          modified: new Date().toISOString(),
          children: []
        };
        
        if (selectedFolder) {
          // Add to selected folder's children
          setFolders(prev => {
            const updateFolderChildren = (items: FileItem[]): FileItem[] => {
              return items.map(item => {
                if (item.id === selectedFolder) {
                  return {
                    ...item,
                    children: [...(item.children || []), newFolder]
                  };
                }
                if (item.children) {
                  return {
                    ...item,
                    children: updateFolderChildren(item.children)
                  };
                }
                return item;
              });
            };
            
            return updateFolderChildren(prev);
          });
        } else {
          // Add to root folders
          setFolders(prev => [...prev, newFolder]);
        }
        
        toast({
          title: "Success",
          description: "Folder created successfully",
        });
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create folder",
        variant: "destructive"
      });
    } finally {
      setShowNewFolderDialog(false);
      setNewFolderName('');
    }
  };

  const handleRenameItem = async () => {
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
        // Rename folder in Supabase
        const { error } = await supabase
          .from('folders')
          .update({ name: newItemName })
          .eq('id', itemToRename.id);
        
        if (error) throw error;
        
        // Update local state
        setFolders(prev => {
          const updateFolderName = (items: FileItem[]): FileItem[] => {
            return items.map(item => {
              if (item.id === itemToRename.id) {
                return { ...item, name: newItemName };
              }
              if (item.children) {
                return {
                  ...item,
                  children: updateFolderName(item.children)
                };
              }
              return item;
            });
          };
          
          return updateFolderName(prev);
        });
      } else {
        // Rename file in Supabase
        const { error } = await supabase
          .from('files')
          .update({ name: newItemName })
          .eq('id', itemToRename.id);
        
        if (error) throw error;
        
        // Update local state
        setFiles(prev => 
          prev.map(file => 
            file.id === itemToRename.id 
              ? { ...file, name: newItemName } 
              : file
          )
        );
      }
      
      toast({
        title: "Success",
        description: "Item renamed successfully",
      });
    } catch (error) {
      console.error('Error renaming item:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to rename item",
        variant: "destructive"
      });
    } finally {
      setShowRenameDialog(false);
      setItemToRename(null);
      setNewItemName('');
    }
  };

  const handleDeleteItems = async () => {
    if (!itemsToDelete.length) return;
    
    try {
      for (const item of itemsToDelete) {
        if (item.type === 'folder') {
          await deleteFolder(item.id);
        } else {
          await deleteFile(item.id, item.file_path || '');
        }
      }
      
      toast({
        title: "Success",
        description: `${itemsToDelete.length} item(s) deleted successfully`,
      });
      
      // Clear selection
      setSelectedItems([]);
    } catch (error) {
      console.error('Error deleting items:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete items",
        variant: "destructive"
      });
    } finally {
      setShowDeleteDialog(false);
      setItemsToDelete([]);
    }
  };

  const deleteFile = async (fileId: string, filePath: string) => {
    // Delete from storage
    if (filePath) {
      const { error: storageError } = await supabase.storage
        .from('audio_files')
        .remove([filePath]);
      
      if (storageError) throw storageError;
    }
    
    // Delete from database
    const { error: dbError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId);
    
    if (dbError) throw dbError;
    
    // Update local state
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const deleteFolder = async (folderId: string) => {
    // Get all files in this folder
    const { data: folderFiles, error: filesError } = await supabase
      .from('files')
      .select('id, file_path')
      .eq('folder_id', folderId);
    
    if (filesError) throw filesError;
    
    // Delete all files in the folder from storage
    if (folderFiles && folderFiles.length > 0) {
      const filePaths = folderFiles.map(file => file.file_path).filter(Boolean);
      
      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('audio_files')
          .remove(filePaths);
        
        if (storageError) throw storageError;
      }
      
      // Delete all file records
      const { error: dbFilesError } = await supabase
        .from('files')
        .delete()
        .eq('folder_id', folderId);
      
      if (dbFilesError) throw dbFilesError;
    }
    
    // Get all subfolders
    const { data: subfolders, error: subfoldersError } = await supabase
      .from('folders')
      .select('id')
      .eq('parent_id', folderId);
    
    if (subfoldersError) throw subfoldersError;
    
    // Recursively delete subfolders
    if (subfolders && subfolders.length > 0) {
      for (const subfolder of subfolders) {
        await deleteFolder(subfolder.id);
      }
    }
    
    // Finally delete the folder itself
    const { error: folderError } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId);
    
    if (folderError) throw folderError;
    
    // Update local state
    setFolders(prev => {
      const removeFolderFromTree = (items: FileItem[]): FileItem[] => {
        return items.filter(item => {
          if (item.id === folderId) return false;
          if (item.children) {
            item.children = removeFolderFromTree(item.children);
          }
          return true;
        });
      };
      
      return removeFolderFromTree(prev);
    });
  };

  const moveItem = async (itemId: string, itemType: 'file' | 'folder', targetFolderId: string | null) => {
    try {
      if (itemType === 'file') {
        // Move file in database
        const { error } = await supabase
          .from('files')
          .update({ folder_id: targetFolderId })
          .eq('id', itemId);
        
        if (error) throw error;
        
        // Update local state
        setFiles(prev => 
          prev.map(file => 
            file.id === itemId 
              ? { ...file, folder_id: targetFolderId } 
              : file
          )
        );
      } else {
        // Check for circular reference
        if (targetFolderId) {
          let currentFolder = targetFolderId;
          const { data } = await supabase
            .from('folders')
            .select('parent_id')
            .eq('id', currentFolder)
            .single();
          
          while (data && data.parent_id) {
            if (data.parent_id === itemId) {
              throw new Error("Cannot move a folder into its own subfolder");
            }
            
            const { data: parentData } = await supabase
              .from('folders')
              .select('parent_id')
              .eq('id', data.parent_id)
              .single();
            
            if (!parentData) break;
            currentFolder = parentData.parent_id;
          }
        }
        
        // Move folder in database
        const { error } = await supabase
          .from('folders')
          .update({ parent_id: targetFolderId })
          .eq('id', itemId);
        
        if (error) throw error;
        
        // Update local state
        await fetchFolders(); // Refetch to rebuild hierarchy
      }
      
      toast({
        title: "Success",
        description: "Item moved successfully",
      });
    } catch (error) {
      console.error('Error moving item:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to move item",
        variant: "destructive"
      });
    }
  };

  const toggleStarItem = async (item: FileItem) => {
    try {
      if (item.type === 'folder') {
        // Update folder in database
        const { error } = await supabase
          .from('folders')
          .update({ starred: !item.starred })
          .eq('id', item.id);
        
        if (error) throw error;
        
        // Update local state
        setFolders(prev => {
          const updateFolderStar = (items: FileItem[]): FileItem[] => {
            return items.map(folder => {
              if (folder.id === item.id) {
                return { ...folder, starred: !folder.starred };
              }
              if (folder.children) {
                return {
                  ...folder,
                  children: updateFolderStar(folder.children)
                };
              }
              return folder;
            });
          };
          
          return updateFolderStar(prev);
        });
      } else {
        // Update file in database
        const { error } = await supabase
          .from('files')
          .update({ starred: !item.starred })
          .eq('id', item.id);
        
        if (error) throw error;
        
        // Update local state
        setFiles(prev => 
          prev.map(file => 
            file.id === item.id 
              ? { ...file, starred: !file.starred } 
              : file
          )
        );
      }
      
      toast({
        title: "Success",
        description: item.starred ? "Item unstarred" : "Item starred",
      });
    } catch (error) {
      console.error('Error toggling star:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update item",
        variant: "destructive"
      });
    }
  };

  const downloadFile = async (file: FileItem) => {
    if (!file.audio_url) {
      toast({
        title: "Error",
        description: "File URL not available",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = file.audio_url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download started",
        description: `Downloading ${file.name}`,
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
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
    setSelectedFile(null);
  };

  const handleItemClick = (item: FileItem, event: React.MouseEvent) => {
    // Handle multi-select with Ctrl/Cmd key
    if (event.ctrlKey || event.metaKey) {
      setSelectedItems(prev => {
        const isSelected = prev.includes(item.id);
        return isSelected 
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id];
      });
    } else {
      // Single select
      setSelectedItems([item.id]);
      
      if (item.type === 'folder') {
        selectFolder(item.id);
      } else {
        setSelectedFile(item);
      }
    }
  };

  const handleDragStart = (item: FileItem) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(folderId);
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolder(null);
    
    if (!draggedItem) return;
    
    // Don't drop on itself
    if (draggedItem.type === 'folder' && draggedItem.id === targetFolderId) return;
    
    // Don't drop if source and target are the same
    if (draggedItem.folder_id === targetFolderId) return;
    
    await moveItem(draggedItem.id, draggedItem.type as 'file' | 'folder', targetFolderId);
    setDraggedItem(null);
  };

  const handleFileDropUpload = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const files = Array.from(e.dataTransfer.files);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        if (propUploadFile) {
          await propUploadFile(file, selectedFolder || undefined, (progress) => {
            setUploadProgress(progress);
          });
        } else {
          await uploadFile(file);
        }
        
        setUploadProgress(((i + 1) / files.length) * 100);
      }
      
      toast({
        title: "Upload complete",
        description: "Your files have been uploaded successfully!",
      });
      
      if (onUpload) {
        onUpload();
      } else {
        await fetchFiles();
      }
    } catch (error) {
      console.error('Upload error:', error);
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

  const renderFolderTree = (folders: FileItem[], level = 0) => {
    return folders.map(folder => (
      <div key={folder.id} className="transition-all duration-200">
        <Button 
          variant={selectedFolder === folder.id ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start gap-2 py-1.5 h-auto text-sm rounded-md",
            "transition-all duration-200 hover:bg-primary/10",
            selectedFolder === folder.id && "bg-primary/15 hover:bg-primary/20",
            dragOverFolder === folder.id && "bg-primary/10 border-2 border-dashed border-primary"
          )}
          onClick={() => selectFolder(folder.id)}
          onDragOver={(e) => handleDragOver(e, folder.id)}
          onDrop={(e) => handleDrop(e, folder.id)}
          style={{ paddingLeft: `${(level * 12) + 8}px` }}
        >
          <div className="flex items-center gap-1.5 min-w-[24px]">
            {folder.children?.length ? (
              <div 
                className="transition-transform duration-200" 
                style={{ transform: expandedFolders[folder.id] ? 'rotate(90deg)' : 'rotate(0deg)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(folder.id);
                }}
              >
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              </div>
            ) : (
              <div className="w-4" />
            )}
            <Folder className={cn(
              "h-4 w-4 flex-shrink-0",
              selectedFolder === folder.id ? "text-primary" : "text-muted-foreground",
              folder.starred && "text-yellow-500"
            )} />
          </div>
          <span className="truncate">{folder.name}</span>
          {folder.children?.length && (
            <span className="ml-auto text-xs text-muted-foreground">
              {folder.children.length}
            </span>
          )}
        </Button>
        
        {/* Render subfolders if expanded */}
        {folder.children?.length && expandedFolders[folder.id] && (
          <div className="transition-all duration-200">
            {renderFolderTree(folder.children.filter(item => item.type === 'folder'), level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const renderFileGrid = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <Skeleton className="h-32 w-full rounded-md" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      );
    }
    
    if (filteredFiles.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No files found</h3>
          <p className="text-muted-foreground mt-2">
            {searchQuery 
              ? "Try a different search term" 
              : "Upload files or create folders to get started"}
          </p>
          <div className="flex gap-3 mt-6">
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
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredFiles.map(file => (
          <div 
            key={file.id}
            className={cn(
              "border rounded-lg p-4 transition-all duration-200 hover:shadow-md cursor-pointer",
              selectedItems.includes(file.id) && "ring-2 ring-primary bg-primary/5",
              draggedItem?.id === file.id && "opacity-50"
            )}
            onClick={(e) => handleItemClick(file, e)}
            draggable
            onDragStart={() => handleDragStart(file)}
          >
            <div className="flex flex-col h-full">
              <div className="flex-1 flex items-center justify-center p-4 bg-muted/30 rounded-md mb-3">
                {file.type === 'audio' ? (
                  <Music className="h-16 w-16 text-primary/70" />
                ) : (
                  <FileIcon className="h-16 w-16 text-muted-foreground/70" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium truncate">{file.name}</h3>
                  {file.starred && (
                    <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{file.size}</span>
                  <span>{file.modified && new Date(file.modified).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => downloadFile(file)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setItemToRename(file);
                      setNewItemName(file.name);
                      setShowRenameDialog(true);
                    }}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleStarItem(file)}>
                      <Star className="h-4 w-4 mr-2" />
                      {file.starred ? 'Unstar' : 'Star'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                      setItemsToDelete([file]);
                      setShowDeleteDialog(true);
                    }} className="text-red-500 focus:text-red-500">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderFileList = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center p-3 border rounded-lg">
              <Skeleton className="h-10 w-10 rounded-md mr-3" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          ))}
        </div>
      );
    }
    
    if (filteredFiles.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No files found</h3>
          <p className="text-muted-foreground mt-2">
            {searchQuery 
              ? "Try a different search term" 
              : "Upload files or create folders to get started"}
          </p>
          <div className="flex gap-3 mt-6">
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
      );
    }
    
    return (
      <div className="space-y-2">
        {filteredFiles.map(file => (
          <div 
            key={file.id}
            className={cn(
              "flex items-center p-3 border rounded-lg transition-all duration-200 hover:shadow-sm cursor-pointer",
              selectedItems.includes(file.id) && "ring-2 ring-primary bg-primary/5",
              draggedItem?.id === file.id && "opacity-50"
            )}
            onClick={(e) => handleItemClick(file, e)}
            draggable
            onDragStart={() => handleDragStart(file)}
          >
            <div className="p-2 bg-primary/10 rounded-md mr-3">
              {file.type === 'audio' ? (
                <Music className="h-5 w-5 text-primary" />
              ) : (
                <FileIcon className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <p className="font-medium truncate">{file.name}</p>
                {file.starred && (
                  <Star className="h-4 w-4 text-yellow-500 ml-2 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{file.size}</span>
                <span>•</span>
                <span>{file.modified && new Date(file.modified).toLocaleDateString()}</span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => downloadFile(file)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setItemToRename(file);
                  setNewItemName(file.name);
                  setShowRenameDialog(true);
                }}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleStarItem(file)}>
                  <Star className="h-4 w-4 mr-2" />
                  {file.starred ? 'Unstar' : 'Star'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  setItemsToDelete([file]);
                  setShowDeleteDialog(true);
                }} className="text-red-500 focus:text-red-500">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-1 h-full">
        {/* Sidebar with folders */}
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

          <Separator />

          <div className="space-y-2">
            <Tabs defaultValue="folders" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="folders" className="flex-1">Folders</TabsTrigger>
                <TabsTrigger value="recent" className="flex-1">Recent</TabsTrigger>
              </TabsList>
              <TabsContent value="folders" className="mt-2">
                <Button 
                  variant={selectedFolder === null ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2 py-1.5 h-auto text-sm rounded-md mb-2",
                    "transition-all duration-200 hover:bg-primary/10",
                    selectedFolder === null && "bg-primary/15 hover:bg-primary/20",
                    dragOverFolder === null && "bg-primary/10 border-2 border-dashed border-primary"
                  )}
                  onClick={() => selectFolder(null)}
                  onDragOver={(e) => handleDragOver(e, null)}
                  onDrop={(e) => handleDrop(e, null)}
                >
                  <FileIcon className="h-4 w-4 text-primary" />
                  <span>All Files</span>
                </Button>

                <div className="space-y-0.5 max-h-[300px] overflow-y-auto pr-1">
                  {renderFolderTree(folders)}
                </div>
              </TabsContent>
              <TabsContent value="recent" className="mt-2">
                <div className="space-y-2">
                  <Button 
                    variant={activeTab === 'recent' ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2 py-1.5 h-auto text-sm rounded-md"
                    onClick={() => {
                      setActiveTab('recent');
                      setSelectedFolder(null);
                    }}
                  >
                    <Clock className="h-4 w-4 text-primary" />
                    <span>Recent Files</span>
                  </Button>
                  <Button 
                    variant={activeTab === 'starred' ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2 py-1.5 h-auto text-sm rounded-md"
                    onClick={() => {
                      setActiveTab('starred');
                      setSelectedFolder(null);
                    }}
                  >
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>Starred</span>
                  </Button>
                  <Button 
                    variant={activeTab === 'audio' ? "secondary" : "ghost"}
                    className="w-full justify-start gap-2 py-1.5 h-auto text-sm rounded-md"
                    onClick={() => {
                      setActiveTab('audio');
                      setSelectedFolder(null);
                    }}
                  >
                    <Music className="h-4 w-4 text-primary" />
                    <span>Audio Files</span>
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <Separator />

          {/* Storage usage */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Storage</span>
              <span className="font-medium">25% used</span>
            </div>
            <Progress value={25} className="h-2" />
            <p className="text-xs text-muted-foreground">2.5 GB of 10 GB</p>
          </div>
        </div>

        {/* Main file browser area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">
                {activeTab === 'all' && (selectedFolder 
                  ? folders.find(f => f.id === selectedFolder)?.name || 'Files' 
                  : 'All Files'
                )}
                {activeTab === 'recent' && 'Recent Files'}
                {activeTab === 'starred' && 'Starred Items'}
                {activeTab === 'audio' && 'Audio Files'}
              </h1>
              {selectedItems.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedItems.length} selected
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* View mode toggle */}
              <TooltipProvider>
                <div className="border rounded-md flex">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant={viewMode === 'grid' ? "secondary" : "ghost"} 
                        size="icon"
                        className="h-8 w-8 rounded-none rounded-l-md"
                        onClick={() => setViewMode('grid')}
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Grid view</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant={viewMode === 'list' ? "secondary" : "ghost"} 
                        size="icon"
                        className="h-8 w-8 rounded-none rounded-r-md"
                        onClick={() => setViewMode('list')}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>List view</TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
              
              {/* Sort dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                    Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortBy('name')}>
                    Name {sortBy === 'name' && '✓'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('date')}>
                    Date {sortBy === 'date' && '✓'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('size')}>
                    Size {sortBy === 'size' && '✓'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('type')}>
                    Type {sortBy === 'type' && '✓'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}>
                    {sortDirection === 'asc' ? 'Ascending ✓' : 'Descending ✓'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Filter button */}
              <Button variant="outline" size="icon" className="h-8 w-8">
                <Filter className="h-4 w-4" />
              </Button>
              
              {/* Actions for selected items */}
              {selectedItems.length > 0 && (
                <>
                  <Separator orientation="vertical" className="h-8" />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const selectedItemsData = [
                        ...files.filter(file => selectedItems.includes(file.id)),
                        ...folders.flatMap(folder => {
                          const findInFolder = (f: FileItem): FileItem[] => {
                            const result: FileItem[] = [];
                            if (selectedItems.includes(f.id)) result.push(f);
                            if (f.children) {
                              f.children.forEach(child => {
                                result.push(...findInFolder(child));
                              });
                            }
                            return result;
                          };
                          return findInFolder(folder);
                        })
                      ];
                      
                      setItemsToDelete(selectedItemsData);
                      setShowDeleteDialog(true);
                    }}
                    className="text-red-500"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedItems([])}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Selection
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Drop zone for file upload */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg m-4 p-4 text-center",
              "transition-all hover:border-primary/50"
            )}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDropUpload}
          >
            {isUploading ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">Uploading...</p>
                <div className="relative h-2 max-w-md mx-auto rounded-full bg-muted overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-primary rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
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

          {/* File browser */}
          <div className="flex-1 p-4 overflow-y-auto">
            {viewMode === 'grid' ? renderFileGrid() : renderFileList()}
          </div>
        </div>

        {/* File details sidebar */}
        {selectedFile && (
          <div className="w-72 flex-shrink-0 border-l p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-lg">File Info</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="relative w-full aspect-square bg-muted/30 rounded-md flex items-center justify-center">
                  {selectedFile.type === 'audio' ? (
                    <Music className="h-16 w-16 text-primary/70" />
                  ) : (
                    <FileIcon className="h-16 w-16 text-muted-foreground/70" />
                  )}
                </div>
                <div className="text-center">
                  <h4 className="font-medium">{selectedFile.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedFile.size} • {selectedFile.modified && new Date(selectedFile.modified).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Name</span>
                  <span className="text-sm font-medium truncate max-w-[150px]">{selectedFile.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <span className="text-sm font-medium">{selectedFile.type}</span>
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
                    <span className="text-sm font-medium">{new Date(selectedFile.modified).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Button 
                  className="w-full justify-start gap-2"
                  onClick={() => downloadFile(selectedFile)}
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setItemToRename(selectedFile);
                    setNewItemName(selectedFile.name);
                    setShowRenameDialog(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Rename
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => toggleStarItem(selectedFile)}
                >
                  <Star className="h-4 w-4" />
                  {selectedFile.starred ? 'Unstar' : 'Star'}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setItemsToDelete([selectedFile]);
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Folder Dialog */}
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setShowNewFolderDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename {itemToRename?.type === 'folder' ? 'Folder' : 'File'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Input
                id="itemName"
                placeholder="New name"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="col-span-4"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameItem();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => {
                setShowRenameDialog(false);
                setItemToRename(null);
                setNewItemName('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRenameItem}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-5 w-5" />
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete {itemsToDelete.length > 1 
                ? `these ${itemsToDelete.length} items` 
                : itemsToDelete[0]?.type === 'folder' 
                  ? 'this folder and all its contents' 
                  : 'this file'
              }?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setItemsToDelete([]);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteItems}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Info Dialog */}
      <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              File Information
            </DialogTitle>
          </DialogHeader>
          {selectedFile && (
            <div className="py-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-muted/30 rounded-md">
                  {selectedFile.type === 'audio' ? (
                    <Music className="h-12 w-12 text-primary/70" />
                  ) : (
                    <FileIcon className="h-12 w-12 text-muted-foreground/70" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-lg">{selectedFile.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedFile.size} • {selectedFile.modified && new Date(selectedFile.modified).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <span className="text-sm font-medium">{selectedFile.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Size</span>
                      <span className="text-sm font-medium">{selectedFile.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Created</span>
                      <span className="text-sm font-medium">{selectedFile.modified && new Date(selectedFile.modified).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Modified</span>
                      <span className="text-sm font-medium">{selectedFile.modified && new Date(selectedFile.modified).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Location</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Folder</span>
                      <span className="text-sm font-medium">
                        {selectedFile.folder_id 
                          ? folders.find(f => f.id === selectedFile.folder_id)?.name || 'Unknown'
                          : 'Root'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Path</span>
                      <span className="text-sm font-medium truncate max-w-[150px]">
                        {selectedFile.file_path || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowInfoDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DndProvider>
  );
}