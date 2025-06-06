import * as React from "react"
import {
  Bell,
  Check,
  Globe,
  Home,
  Keyboard,
  Link,
  Lock,
  Menu,
  MessageCircle,
  Paintbrush,
  Settings,
  Video,
  Loader2
} from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import useProfile from "@/hooks/useProfile"
import { Profile } from "@/lib/types"

// Define the schema for each section separately
const nameSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
});

const bioSchema = z.object({
  bio: z.string().max(500, {
    message: "Bio must not exceed 500 characters.",
  }),
});

const locationSchema = z.object({
  location: z.string().optional().nullable(),
});

const websiteSchema = z.object({
  website: z.string().url({
    message: "Please enter a valid URL.",
  }).optional().nullable(),
});

const professionalInfoSchema = z.object({
  professionalTitle: z.string().optional().nullable(),
  genres: z.string().optional().nullable(),
  instruments: z.string().optional().nullable(),
  yearsOfExperience: z.coerce.number().optional().nullable(),
});

// Combine all sections for the full form
const profileFormSchema = z.object({
  ...nameSchema.shape,
  ...bioSchema.shape,
  ...locationSchema.shape,
  ...websiteSchema.shape,
  ...professionalInfoSchema.shape,
});

type ProfileFormValues = z.infer<typeof profileFormSchema>

const data = {
  nav: [
    { name: "Profile", icon: Paintbrush },
    { name: "Appearance", icon: Paintbrush },
    { name: "Privacy", icon: Lock },
    { name: "Notifications", icon: Bell },
    { name: "Connected accounts", icon: Link },
  ],
}

interface SettingsDialogProps {
  children?: React.ReactNode;
}

export function SettingsDialog({ children }: SettingsDialogProps) {
  const [open, setOpen] = React.useState(false)
  const { profile, updateProfile } = useProfile()
  const [activeSection, setActiveSection] = React.useState("Profile")
  const [isSaving, setIsSaving] = React.useState(false)

  // Create a form for each section
  const nameForm = useForm<z.infer<typeof nameSchema>>({
    resolver: zodResolver(nameSchema),
    defaultValues: {
      name: profile?.name || "",
    },
  });

  const bioForm = useForm<z.infer<typeof bioSchema>>({
    resolver: zodResolver(bioSchema),
    defaultValues: {
      bio: profile?.bio || "",
    },
  });

  const locationForm = useForm<z.infer<typeof locationSchema>>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      location: profile?.location || "",
    },
  });

  const websiteForm = useForm<z.infer<typeof websiteSchema>>({
    resolver: zodResolver(websiteSchema),
    defaultValues: {
      website: profile?.website || "",
    },
  });

  const professionalInfoForm = useForm<z.infer<typeof professionalInfoSchema>>({
    resolver: zodResolver(professionalInfoSchema),
    defaultValues: {
      professionalTitle: profile?.professionalTitle || "",
      genres: profile?.genres?.join(", ") || "",
      instruments: profile?.instruments?.join(", ") || "",
      yearsOfExperience: profile?.yearsOfExperience || undefined,
    },
  });

  // Update form values when profile changes
  React.useEffect(() => {
    if (profile) {
      nameForm.reset({
        name: profile.name || "",
      });
      
      bioForm.reset({
        bio: profile.bio || "",
      });
      
      locationForm.reset({
        location: profile.location || "",
      });
      
      websiteForm.reset({
        website: profile.website || "",
      });
      
      professionalInfoForm.reset({
        professionalTitle: profile.professionalTitle || "",
        genres: profile.genres?.join(", ") || "",
        instruments: profile.instruments?.join(", ") || "",
        yearsOfExperience: profile.yearsOfExperience || undefined,
      });
    }
  }, [profile]);

  // Handle form submissions for each section
  const onSubmitName = async (data: z.infer<typeof nameSchema>) => {
    if (!profile?.id) return;
    setIsSaving(true);
    
    try {
      await updateProfile({
        id: profile.id,
        name: data.name,
      });
      toast.success("Name updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update name");
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmitBio = async (data: z.infer<typeof bioSchema>) => {
    if (!profile?.id) return;
    setIsSaving(true);
    
    try {
      await updateProfile({
        id: profile.id,
        bio: data.bio,
      });
      toast.success("Bio updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update bio");
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmitLocation = async (data: z.infer<typeof locationSchema>) => {
    if (!profile?.id) return;
    setIsSaving(true);
    
    try {
      await updateProfile({
        id: profile.id,
        location: data.location,
      });
      toast.success("Location updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update location");
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmitWebsite = async (data: z.infer<typeof websiteSchema>) => {
    if (!profile?.id) return;
    setIsSaving(true);
    
    try {
      await updateProfile({
        id: profile.id,
        website: data.website,
      });
      toast.success("Website updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update website");
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmitProfessionalInfo = async (data: z.infer<typeof professionalInfoSchema>) => {
    if (!profile?.id) return;
    setIsSaving(true);
    
    try {
      await updateProfile({
        id: profile.id,
        professionalTitle: data.professionalTitle,
        genres: data.genres ? data.genres.split(",").map(g => g.trim()).filter(Boolean) : [],
        instruments: data.instruments ? data.instruments.split(",").map(i => i.trim()).filter(Boolean) : [],
        yearsOfExperience: data.yearsOfExperience,
      });
      toast.success("Professional info updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update professional info");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children || (
        <DialogTrigger asChild>
          <Button size="sm">Open Settings</Button>
        </DialogTrigger>
      )}
      <DialogContent className="overflow-hidden p-0 md:max-h-[600px] md:max-w-[800px] lg:max-w-[900px]">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Customize your settings here.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {data.nav.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={activeSection === item.name}
                          onClick={() => setActiveSection(item.name)}
                        >
                          <button type="button">
                            <item.icon />
                            <span>{item.name}</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[600px] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">Settings</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{activeSection}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
              {activeSection === "Profile" && (
                <div className="space-y-6">
                  {/* Name Section */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">Name</h3>
                    <Form {...nameForm}>
                      <form onSubmit={nameForm.handleSubmit(onSubmitName)} className="space-y-4">
                        <FormField
                          control={nameForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your name" {...field} />
                              </FormControl>
                              <FormDescription>
                                This is your public display name.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end">
                          <Button type="submit" disabled={isSaving || !nameForm.formState.isDirty}>
                            {isSaving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              'Save Name'
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>

                  {/* Username Section (Read-only) */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">Username</h3>
                    <div className="space-y-2">
                      <FormLabel>Username</FormLabel>
                      <Input 
                        value={profile?.username || ""} 
                        disabled 
                        className="bg-muted/50"
                      />
                      <p className="text-sm text-muted-foreground">
                        Your username cannot be changed.
                      </p>
                    </div>
                  </div>

                  {/* Bio Section */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">Bio</h3>
                    <Form {...bioForm}>
                      <form onSubmit={bioForm.handleSubmit(onSubmitBio)} className="space-y-4">
                        <FormField
                          control={bioForm.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Tell us about yourself"
                                  className="resize-none min-h-[120px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Write a short bio about yourself. This will be displayed on your profile.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end">
                          <Button type="submit" disabled={isSaving || !bioForm.formState.isDirty}>
                            {isSaving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              'Save Bio'
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>

                  {/* Location Section */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">Location</h3>
                    <Form {...locationForm}>
                      <form onSubmit={locationForm.handleSubmit(onSubmitLocation)} className="space-y-4">
                        <FormField
                          control={locationForm.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input placeholder="Your location" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormDescription>
                                Where are you based? (e.g., "New York, USA")
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end">
                          <Button type="submit" disabled={isSaving || !locationForm.formState.isDirty}>
                            {isSaving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              'Save Location'
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>

                  {/* Website Section */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">Website</h3>
                    <Form {...websiteForm}>
                      <form onSubmit={websiteForm.handleSubmit(onSubmitWebsite)} className="space-y-4">
                        <FormField
                          control={websiteForm.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website</FormLabel>
                              <FormControl>
                                <Input placeholder="https://example.com" {...field} value={field.value || ""} />
                              </FormControl>
                              <FormDescription>
                                Your personal or professional website.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end">
                          <Button type="submit" disabled={isSaving || !websiteForm.formState.isDirty}>
                            {isSaving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              'Save Website'
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>

                  {/* Professional Info Section */}
                  <div className="border rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">Professional Information</h3>
                    <Form {...professionalInfoForm}>
                      <form onSubmit={professionalInfoForm.handleSubmit(onSubmitProfessionalInfo)} className="space-y-4">
                        <FormField
                          control={professionalInfoForm.control}
                          name="professionalTitle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Professional Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Producer, Engineer, etc." {...field} value={field.value || ""} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={professionalInfoForm.control}
                          name="genres"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Genres</FormLabel>
                              <FormControl>
                                <Input placeholder="Hip Hop, Electronic, etc." {...field} value={field.value || ""} />
                              </FormControl>
                              <FormDescription>
                                Separate multiple genres with commas
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={professionalInfoForm.control}
                          name="instruments"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instruments</FormLabel>
                              <FormControl>
                                <Input placeholder="Guitar, Piano, etc." {...field} value={field.value || ""} />
                              </FormControl>
                              <FormDescription>
                                Separate multiple instruments with commas
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={professionalInfoForm.control}
                          name="yearsOfExperience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Years of Experience</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field} 
                                  value={field.value === undefined || field.value === null ? '' : field.value}
                                  onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end">
                          <Button 
                            type="submit" 
                            disabled={isSaving || !professionalInfoForm.formState.isDirty}
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              'Save Professional Info'
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                </div>
              )}
              {activeSection === "Appearance" && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Appearance settings coming soon</p>
                </div>
              )}
              {activeSection === "Privacy" && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Privacy settings coming soon</p>
                </div>
              )}
              {activeSection === "Notifications" && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Notification settings coming soon</p>
                </div>
              )}
              {activeSection === "Connected accounts" && (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Connected accounts settings coming soon</p>
                </div>
              )}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}