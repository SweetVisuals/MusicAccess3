import { useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useFiles } from '@/hooks/useFiles';
import { UnifiedFileBrowser } from '@/components/upload/upload-with-browser';
import { useToast } from '@/hooks/use-toast';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from '@/components/ui/menubar';

export default function UploadPage() {
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
    fetchFolders
  } = useFiles(user?.id || '');

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const result = await uploadFile(file);
    
    if (result.success) {
      toast({
        title: "Upload complete",
        description: "Your file has been uploaded successfully!",
      });
      fetchFiles();
    } else {
      const error = result.error as string | Error | { message: string };
      const errorMessage = 
        typeof error === 'string' ? error :
        error instanceof Error ? error.message :
        error?.message || "Failed to upload file";
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleNewFolder = async () => {
    const folderName = prompt("Enter folder name:");
    if (!folderName) return;
    
    const result = await createFolder(folderName);
    if (result.success) {
      toast({
        title: "Folder created",
        description: `Folder "${folderName}" was created successfully`
      });
      fetchFolders();
    } else {
      const error = result.error as string | Error | { message: string };
      const errorMessage = 
        typeof error === 'string' ? error :
        error instanceof Error ? error.message :
        error?.message || "Failed to create folder";
      toast({
        title: "Error creating folder",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <Menubar className="w-full">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onClick={handleUploadClick}>
              Upload Files
            </MenubarItem>
            <MenubarItem onClick={handleNewFolder}>
              New Folder
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Audio</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Import Stems</MenubarItem>
            <MenubarItem>Export Mix</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
        accept="audio/*,.mp3,.wav,.aiff,.flac,.ogg,.aac"
      />

      <UnifiedFileBrowser 
        files={files}
        folders={folders}
        onUpload={handleUploadClick}
        onCreateFolder={handleNewFolder}
      />
    </div>
  );
}
