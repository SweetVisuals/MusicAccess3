import { useState } from "react";
import { AppSidebar } from "@/components/dashboard/layout/app-sidebar";
import { SiteHeader } from "@/components/dashboard/layout/site-header";
import { SidebarInset, SidebarProvider } from "@/components/@/ui/sidebar";
import { 
  Upload, 
  FolderPlus, 
  Package, 
  DollarSign, 
  Send, 
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Music,
  Folder,
  Tag,
  Globe,
  Archive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/@/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/@/ui/tabs";
import { UnifiedFileBrowser } from "@/components/upload/upload-with-browser";
import { useFiles } from "@/hooks/useFiles";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

export default function UploadWizard() {
  const { user } = useAuth();
  const { 
    files, 
    folders, 
    loading, 
    fetchFiles, 
    fetchFolders, 
    createFolder, 
    uploadFile 
  } = useFiles(user?.id || '');

  const [activeTab, setActiveTab] = useState("upload");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectType, setProjectType] = useState<"soundpack" | "beattape" | "project">("soundpack");
  const [individualPrice, setIndividualPrice] = useState("");
  const [packagePrice, setPackagePrice] = useState("");
  const [publishOption, setPublishOption] = useState<"public" | "private" | "order">("private");
  const [isComplete, setIsComplete] = useState(false);

  // Function to handle file selection
  const handleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileId)) {
        return prev.filter(id => id !== fileId);
      } else {
        return [...prev, fileId];
      }
    });
  };

  // Function to handle project creation
  const handleCreateProject = () => {
    if (!projectName) {
      toast.error("Please enter a project name");
      return;
    }

    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    // Here you would typically save the project to the database
    toast.success("Project created successfully!");
    setActiveTab("pricing");
  };

  // Function to handle pricing setup
  const handleSetupPricing = () => {
    if (packagePrice && isNaN(Number(packagePrice))) {
      toast.error("Package price must be a number");
      return;
    }

    if (individualPrice && isNaN(Number(individualPrice))) {
      toast.error("Individual price must be a number");
      return;
    }

    // Here you would typically save the pricing to the database
    toast.success("Pricing set up successfully!");
    setActiveTab("publish");
  };

  // Function to handle publishing
  const handlePublish = () => {
    // Here you would typically publish the project
    toast.success(`Project ${publishOption === "public" ? "published" : publishOption === "order" ? "submitted to order" : "saved to files"}!`);
    setIsComplete(true);
    setActiveTab("complete");
  };

  // Function to reset the wizard
  const handleReset = () => {
    setSelectedFiles([]);
    setProjectName("");
    setProjectDescription("");
    setProjectType("soundpack");
    setIndividualPrice("");
    setPackagePrice("");
    setPublishOption("private");
    setIsComplete(false);
    setActiveTab("upload");
  };

  // Function to navigate to next tab
  const handleNext = () => {
    if (activeTab === "upload") {
      setActiveTab("organize");
    } else if (activeTab === "organize") {
      setActiveTab("pricing");
    } else if (activeTab === "pricing") {
      setActiveTab("publish");
    } else if (activeTab === "publish") {
      setActiveTab("complete");
    }
  };

  // Function to navigate to previous tab
  const handlePrevious = () => {
    if (activeTab === "organize") {
      setActiveTab("upload");
    } else if (activeTab === "pricing") {
      setActiveTab("organize");
    } else if (activeTab === "publish") {
      setActiveTab("pricing");
    } else if (activeTab === "complete") {
      setActiveTab("publish");
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
              <div>
                <h1 className="text-2xl font-bold">Upload Wizard</h1>
                <p className="text-muted-foreground">Create and publish your music projects</p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-between items-center mb-6">
                <TabsList className="grid grid-cols-5 w-full max-w-3xl">
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline">Upload</span>
                  </TabsTrigger>
                  <TabsTrigger value="organize" className="flex items-center gap-2">
                    <FolderPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Organize</span>
                  </TabsTrigger>
                  <TabsTrigger value="pricing" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="hidden sm:inline">Pricing</span>
                  </TabsTrigger>
                  <TabsTrigger value="publish" className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">Publish</span>
                  </TabsTrigger>
                  <TabsTrigger value="complete" className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Complete</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="upload" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Files</CardTitle>
                    <CardDescription>Upload your audio files and organize them into folders</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[500px]">
                    <UnifiedFileBrowser 
                      files={files}
                      folders={folders}
                      onUpload={() => {
                        fetchFiles();
                        fetchFolders();
                      }}
                      onCreateFolder={() => {
                        fetchFolders();
                      }}
                      uploadFile={uploadFile}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div></div>
                    <Button onClick={handleNext}>
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="organize" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Organize Project</CardTitle>
                    <CardDescription>Create a project from your uploaded files</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="project-name">Project Name</Label>
                          <Input 
                            id="project-name" 
                            placeholder="Enter project name" 
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="project-description">Description</Label>
                          <Textarea 
                            id="project-description" 
                            placeholder="Describe your project" 
                            value={projectDescription}
                            onChange={(e) => setProjectDescription(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Project Type</Label>
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              variant={projectType === "soundpack" ? "default" : "outline"}
                              onClick={() => setProjectType("soundpack")}
                              className="flex items-center gap-2"
                            >
                              <Package className="h-4 w-4" />
                              Sound Pack
                            </Button>
                            <Button 
                              variant={projectType === "beattape" ? "default" : "outline"}
                              onClick={() => setProjectType("beattape")}
                              className="flex items-center gap-2"
                            >
                              <Music className="h-4 w-4" />
                              Beat Tape
                            </Button>
                            <Button 
                              variant={projectType === "project" ? "default" : "outline"}
                              onClick={() => setProjectType("project")}
                              className="flex items-center gap-2"
                            >
                              <Folder className="h-4 w-4" />
                              Project
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <Label>Select Files</Label>
                        <div className="border rounded-md h-[300px] overflow-y-auto p-2">
                          {loading ? (
                            <div className="flex items-center justify-center h-full">
                              <p>Loading files...</p>
                            </div>
                          ) : files.length === 0 ? (
                            <div className="flex items-center justify-center h-full">
                              <p>No files found. Please upload files first.</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {files.map((file) => (
                                <div 
                                  key={file.id}
                                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                                    selectedFiles.includes(file.id) ? 'bg-primary/10 border border-primary' : 'hover:bg-muted'
                                  }`}
                                  onClick={() => handleFileSelection(file.id)}
                                >
                                  <div className="flex items-center gap-2">
                                    <Music className="h-4 w-4 text-primary" />
                                    <span>{file.name}</span>
                                  </div>
                                  <Badge variant="outline">{file.size}</Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {selectedFiles.length} files selected
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={handlePrevious}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                    <Button onClick={handleNext}>
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Set Pricing</CardTitle>
                    <CardDescription>Set prices for your project and individual files</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="package-price">Package Price ($)</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="package-price" 
                              className="pl-9" 
                              placeholder="0.00"
                              value={packagePrice}
                              onChange={(e) => setPackagePrice(e.target.value)}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Price for the entire {projectType}
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="individual-price">Individual File Price ($)</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                              id="individual-price" 
                              className="pl-9" 
                              placeholder="0.00"
                              value={individualPrice}
                              onChange={(e) => setIndividualPrice(e.target.value)}
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Price for each individual file
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>License Options</Label>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="license-basic" className="rounded border-gray-300" />
                              <Label htmlFor="license-basic">Basic License</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="license-premium" className="rounded border-gray-300" />
                              <Label htmlFor="license-premium">Premium License</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="license-exclusive" className="rounded border-gray-300" />
                              <Label htmlFor="license-exclusive">Exclusive License</Label>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Tags</Label>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              Hip Hop
                            </Badge>
                            <Badge className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              Trap
                            </Badge>
                            <Badge className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              Lo-Fi
                            </Badge>
                            <Button variant="outline" size="sm" className="h-6">
                              + Add Tag
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={handlePrevious}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                    <Button onClick={handleNext}>
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="publish" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Publish</CardTitle>
                    <CardDescription>Choose how to publish your project</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className={`cursor-pointer transition-all ${publishOption === "public" ? "border-primary" : ""}`} onClick={() => setPublishOption("public")}>
                        <CardContent className="pt-6">
                          <div className="flex flex-col items-center text-center space-y-2">
                            <Globe className="h-8 w-8 text-primary" />
                            <h3 className="font-medium">Publish to Page</h3>
                            <p className="text-sm text-muted-foreground">Make your project public on your profile</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className={`cursor-pointer transition-all ${publishOption === "order" ? "border-primary" : ""}`} onClick={() => setPublishOption("order")}>
                        <CardContent className="pt-6">
                          <div className="flex flex-col items-center text-center space-y-2">
                            <Send className="h-8 w-8 text-primary" />
                            <h3 className="font-medium">Submit to Order</h3>
                            <p className="text-sm text-muted-foreground">Submit to an existing client order</p>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className={`cursor-pointer transition-all ${publishOption === "private" ? "border-primary" : ""}`} onClick={() => setPublishOption("private")}>
                        <CardContent className="pt-6">
                          <div className="flex flex-col items-center text-center space-y-2">
                            <Archive className="h-8 w-8 text-primary" />
                            <h3 className="font-medium">Keep in Files</h3>
                            <p className="text-sm text-muted-foreground">Save to your files without publishing</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {publishOption === "order" && (
                      <div className="space-y-4 pt-4">
                        <Label htmlFor="order-select">Select Order</Label>
                        <select 
                          id="order-select"
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="">Select an order</option>
                          <option value="order1">Order #1 - Custom Beat (Client: John Doe)</option>
                          <option value="order2">Order #2 - Mixing Service (Client: Jane Smith)</option>
                        </select>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={handlePrevious}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                    <Button onClick={handlePublish}>
                      {publishOption === "public" ? "Publish" : publishOption === "order" ? "Submit" : "Save"}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="complete" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Complete!</CardTitle>
                    <CardDescription>Your project has been successfully processed</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center py-10 space-y-6">
                    <div className="rounded-full bg-green-100 p-3">
                      <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-medium">
                        {publishOption === "public" 
                          ? "Your project has been published!" 
                          : publishOption === "order" 
                            ? "Your project has been submitted to the order!" 
                            : "Your project has been saved to your files!"}
                      </h3>
                      <p className="text-muted-foreground">
                        {projectName && <span>Project Name: <strong>{projectName}</strong><br /></span>}
                        {selectedFiles.length > 0 && <span>Files: <strong>{selectedFiles.length}</strong><br /></span>}
                        {packagePrice && <span>Package Price: <strong>${packagePrice}</strong></span>}
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-center">
                    <Button onClick={handleReset}>Create Another Project</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}