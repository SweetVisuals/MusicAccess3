import { useState, useEffect } from 'react';
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
  Check,
  File,
  Folder,
  FolderPlus,
  Search,
  MoreVertical,
  Download,
  Pencil,
  Trash2,
  Star,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/@/ui/badge";
import { Card, CardContent } from "@/components/@/ui/card";
import { useDropzone } from 'react-dropzone';
import { Progress } from "@/components/@/ui/progress";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from 'uuid';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/@/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/@/ui/dialog";
import { UnifiedFileBrowser } from '@/components/upload/upload-with-browser';

export default function UploadWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folders, setFolders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'name' | 'date' | 'size'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: acceptedFiles => {
      setFiles(acceptedFiles);
    },
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a']
    },
    maxFiles: 10,
    multiple: true
  });

  useEffect(() => {
    if (user) {
      fetchFiles();
      fetchFolders();
    }
  }, [user, currentFolder]);

  const fetchFiles = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id);
      
      if (currentFolder) {
        query = query.eq('folder_id', currentFolder);
      } else {
        query = query.is('folder_id', null);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setUploadedFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFolders = async () => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id);
      
      if (currentFolder) {
        query = query.eq('parent_id', currentFolder);
      } else {
        query = query.is('parent_id', null);
      }
      
      const { data, error } = await query.order('name');
      
      if (error) throw error;
      
      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast.error('Failed to load folders');
    }
  };

  const handleUpload = async () => {
    if (!user) {
      toast.error('You must be logged in to upload files');
      return;
    }
    
    if (files.length === 0) {
      toast.error('Please select at least one file to upload');
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
          .from('files')
          .insert([{
            id: fileId,
            name: file.name,
            file_url: publicUrl,
            file_path: filePath,
            size: file.size,
            file_type: getFileType(file.type),
            user_id: user.id,
            folder_id: currentFolder
          }]);
        
        if (dbError) throw dbError;
      }
      
      // Set final progress
      setUploadProgress(100);
      
      // Show success message
      toast.success('Files uploaded successfully');
      
      // Clear files and refresh the list
      setFiles([]);
      fetchFiles();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  };

  const handleCreateFolder = async () => {
    if (!user) {
      toast.error('You must be logged in to create folders');
      return;
    }
    
    if (!newFolderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert([{
          name: newFolderName.trim(),
          user_id: user.id,
          parent_id: currentFolder
        }])
        .select();
      
      if (error) throw error;
      
      toast.success('Folder created successfully');
      setNewFolderName('');
      setShowNewFolderDialog(false);
      fetchFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
    }
  };

  const handleDeleteFile = async (id: string, filePath: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    try {
      // Delete from storage
      if (filePath) {
        const { error: storageError } = await supabase.storage
          .from('audio_files')
          .remove([filePath]);
        
        if (storageError) throw storageError;
      }
      
      // Delete from database
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast.success('File deleted successfully');
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this folder and all its contents?')) return;
    
    try {
      // Get all files in this folder
      const { data: folderFiles, error: filesError } = await supabase
        .from('files')
        .select('id, file_path')
        .eq('folder_id', id);
      
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
          .eq('folder_id', id);
        
        if (dbFilesError) throw dbFilesError;
      }
      
      // Delete the folder itself
      const { error: folderError } = await supabase
        .from('folders')
        .delete()
        .eq('id', id);
      
      if (folderError) throw folderError;
      
      toast.success('Folder deleted successfully');
      fetchFolders();
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Failed to delete folder');
    }
  };

  const navigateToFolder = (folderId: string | null) => {
    setCurrentFolder(folderId);
  };

  const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word')) return 'document';
    return 'file';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'audio':
        return <Music className="h-5 w-5 text-blue-500" />;
      case 'image':
        return <Image className="h-5 w-5 text-green-500" />;
      case 'video':
        return <Video className="h-5 w-5 text-red-500" />;
      case 'pdf':
        return <FileText className="h-5 w-5 text-orange-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const sortFiles = (files: any[]) => {
    return [...files].sort((a, b) => {
      let comparison = 0;
      
      switch (sortOrder) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          break;
        case 'size':
          comparison = b.size - a.size;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const filteredFiles = uploadedFiles
    .filter(file => file.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(file => currentFolder === file.folder_id);

  const sortedFiles = sortFiles(filteredFiles);

  const filteredFolders = folders
    .filter(folder => folder.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleToggleSort = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };

  const handleChangeSortOrder = (order: 'name' | 'date' | 'size') => {
    if (sortOrder === order) {
      handleToggleSort();
    } else {
      setSortOrder(order);
      setSortDirection('desc');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <UnifiedFileBrowser 
        files={uploadedFiles}
        folders={folders}
        onUpload={() => {
          fetchFiles();
          fetchFolders();
        }}
        onCreateFolder={() => {
          fetchFolders();
        }}
        uploadFile={async (file, folderId, onProgress) => {
          try {
            if (!user) throw new Error("User not authenticated");
            
            // Generate unique file path
            const fileId = uuidv4();
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/${fileId}.${fileExt}`;
            
            // Upload to Supabase Storage
            const { error } = await supabase.storage
              .from('audio_files')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
              });
              
            // Simulate progress updates
            let progress = 0;
            const progressInterval = setInterval(() => {
              progress += 10;
              if (progress >= 100) {
                clearInterval(progressInterval);
              }
              if (onProgress) onProgress(progress);
            }, 300);
            
            if (error) throw error;
            
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
                folder_id: folderId || null
              }]);
            
            if (dbError) throw dbError;
            
            return { success: true };
          } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
          }
        }}
      />
    </div>
  );
}