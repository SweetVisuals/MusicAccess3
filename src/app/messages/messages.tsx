import React, { useState, useEffect } from "react";
import { AppSidebar } from "@/components/dashboard/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/@/ui/sidebar";
import { SiteHeader } from "@/components/dashboard/layout/site-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/@/ui/card";
import { Button } from "@/components/@/ui/button";
import { Input } from "@/components/@/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/@/ui/avatar";
import { Badge } from "@/components/@/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/@/ui/tabs";
import { Separator } from "@/components/@/ui/separator";
import { useAuth } from "@/contexts/auth-context";
import { 
  Search, 
  Send, 
  Plus, 
  MoreVertical, 
  Phone, 
  Video, 
  Info, 
  Paperclip, 
  Smile, 
  Mic, 
  Image, 
  File, 
  Star, 
  Clock, 
  CheckCheck, 
  Filter,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/@/ui/dropdown-menu";

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  attachments?: {
    type: 'image' | 'file' | 'audio';
    url: string;
    name?: string;
    size?: string;
  }[];
}

interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    avatar?: string;
    status?: 'online' | 'offline' | 'away';
    lastSeen?: string;
  }[];
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId: string;
    isRead: boolean;
  };
  unreadCount: number;
  isPinned: boolean;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [isComposing, setIsComposing] = useState(false);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Sample data
        const sampleConversations: Conversation[] = [
          {
            id: "1",
            participants: [
              {
                id: "2",
                name: "John Doe",
                avatar: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg",
                status: "online"
              }
            ],
            lastMessage: {
              content: "Hey, I really liked your latest track! Would love to collaborate.",
              timestamp: "2024-06-05T14:30:00Z",
              senderId: "2",
              isRead: false
            },
            unreadCount: 2,
            isPinned: true
          },
          {
            id: "2",
            participants: [
              {
                id: "3",
                name: "Sarah Smith",
                avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg",
                status: "away",
                lastSeen: "2024-06-05T12:45:00Z"
              }
            ],
            lastMessage: {
              content: "The mix sounds great! I'll send you the vocals tomorrow.",
              timestamp: "2024-06-04T18:15:00Z",
              senderId: "user-id", // Current user
              isRead: true
            },
            unreadCount: 0,
            isPinned: false
          },
          {
            id: "3",
            participants: [
              {
                id: "4",
                name: "Mike Wilson",
                avatar: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg",
                status: "offline",
                lastSeen: "2024-06-03T09:20:00Z"
              }
            ],
            lastMessage: {
              content: "I've sent you the payment for the beat pack.",
              timestamp: "2024-06-03T09:20:00Z",
              senderId: "4",
              isRead: true
            },
            unreadCount: 0,
            isPinned: false
          },
          {
            id: "4",
            participants: [
              {
                id: "5",
                name: "Emily Chen",
                avatar: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg",
                status: "online"
              }
            ],
            lastMessage: {
              content: "Can you send me the stems for the track?",
              timestamp: "2024-06-02T16:40:00Z",
              senderId: "5",
              isRead: true
            },
            unreadCount: 0,
            isPinned: true
          },
          {
            id: "5",
            participants: [
              {
                id: "6",
                name: "David Kim",
                avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg",
                status: "offline",
                lastSeen: "2024-06-01T20:10:00Z"
              }
            ],
            lastMessage: {
              content: "Thanks for the feedback on my mix!",
              timestamp: "2024-06-01T20:10:00Z",
              senderId: "user-id", // Current user
              isRead: true
            },
            unreadCount: 0,
            isPinned: false
          }
        ];
        
        setConversations(sampleConversations);
        setFilteredConversations(sampleConversations);
        
        // Select the first conversation by default
        if (sampleConversations.length > 0) {
          setSelectedConversation(sampleConversations[0]);
          fetchMessages(sampleConversations[0].id);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConversations();
  }, [user]);

  // Filter conversations based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }
    
    const filtered = conversations.filter(conversation => {
      const participant = conversation.participants[0];
      return participant.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
    
    setFilteredConversations(filtered);
  }, [searchQuery, conversations]);

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Sample messages
      const sampleMessages: Message[] = [
        {
          id: "1",
          content: "Hey, I really liked your latest track! Would love to collaborate.",
          sender: {
            id: "2",
            name: "John Doe",
            avatar: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg"
          },
          timestamp: "2024-06-05T14:30:00Z",
          status: 'read'
        },
        {
          id: "2",
          content: "Thanks! I'd be interested in collaborating. What did you have in mind?",
          sender: {
            id: "user-id", // Current user
            name: "You",
            avatar: ""
          },
          timestamp: "2024-06-05T14:35:00Z",
          status: 'read'
        },
        {
          id: "3",
          content: "I'm working on an EP and I think your production style would be perfect for one of the tracks. It's a mix of electronic and R&B.",
          sender: {
            id: "2",
            name: "John Doe",
            avatar: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg"
          },
          timestamp: "2024-06-05T14:40:00Z",
          status: 'read'
        },
        {
          id: "4",
          content: "That sounds interesting! I've been experimenting with that fusion lately.",
          sender: {
            id: "user-id", // Current user
            name: "You",
            avatar: ""
          },
          timestamp: "2024-06-05T14:45:00Z",
          status: 'read'
        },
        {
          id: "5",
          content: "Great! Here's a demo of what I'm working on.",
          sender: {
            id: "2",
            name: "John Doe",
            avatar: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg"
          },
          timestamp: "2024-06-05T14:50:00Z",
          status: 'read',
          attachments: [
            {
              type: 'audio',
              url: '#',
              name: 'demo_track.mp3',
              size: '4.2 MB'
            }
          ]
        },
        {
          id: "6",
          content: "Just listened to it. I love the vibe! I can definitely add some production elements to enhance it.",
          sender: {
            id: "user-id", // Current user
            name: "You",
            avatar: ""
          },
          timestamp: "2024-06-05T15:05:00Z",
          status: 'delivered'
        },
        {
          id: "7",
          content: "Awesome! What's your rate for this kind of collaboration?",
          sender: {
            id: "2",
            name: "John Doe",
            avatar: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg"
          },
          timestamp: "2024-06-05T15:10:00Z",
          status: 'read'
        }
      ];
      
      setMessages(sampleMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Handle sending a new message
  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content: messageInput,
      sender: {
        id: "user-id", // Current user
        name: "You",
        avatar: ""
      },
      timestamp: new Date().toISOString(),
      status: 'sent'
    };
    
    setMessages(prev => [...prev, newMessage]);
    setMessageInput("");
    
    // Update the conversation's last message
    setConversations(prev => 
      prev.map(conv => 
        conv.id === selectedConversation.id 
          ? {
              ...conv,
              lastMessage: {
                content: messageInput,
                timestamp: new Date().toISOString(),
                senderId: "user-id",
                isRead: false
              }
            }
          : conv
      )
    );
    
    // Simulate message delivery after a delay
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'delivered' } 
            : msg
        )
      );
    }, 1000);
  };

  // Format timestamp to a readable format
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      // Today - show time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffInDays < 7) {
      // Within a week - show day name
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      // Older - show date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Get status icon for messages
  const getStatusIcon = (status: 'sent' | 'delivered' | 'read') => {
    switch (status) {
      case 'sent':
        return <Clock className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
    }
  };

  // Start a new conversation
  const startNewConversation = () => {
    setIsComposing(true);
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 animate-fade-in">
            <div className="flex h-[calc(100vh-64px)] overflow-hidden">
              {/* Conversations Sidebar */}
              <div className="w-80 border-r flex flex-col">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-lg">Messages</h2>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={startNewConversation}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      placeholder="Search messages..." 
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <Tabs defaultValue="all" className="flex-1 flex flex-col">
                  <div className="px-2 pt-2">
                    <TabsList className="w-full">
                      <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                      <TabsTrigger value="unread" className="flex-1">Unread</TabsTrigger>
                      <TabsTrigger value="pinned" className="flex-1">Pinned</TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="all" className="flex-1 overflow-y-auto p-2">
                    {isLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : filteredConversations.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <div className="bg-muted/50 p-4 rounded-full mb-4">
                          <MessageSquare className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium mb-1">No conversations found</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {searchQuery ? "Try a different search term" : "Start a new conversation"}
                        </p>
                        {!searchQuery && (
                          <Button onClick={startNewConversation}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Message
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredConversations.map((conversation) => (
                          <div
                            key={conversation.id}
                            className={`p-2 rounded-lg cursor-pointer transition-colors ${
                              selectedConversation?.id === conversation.id 
                                ? 'bg-accent' 
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => {
                              setSelectedConversation(conversation);
                              fetchMessages(conversation.id);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Avatar>
                                  <AvatarImage src={conversation.participants[0].avatar} />
                                  <AvatarFallback>{conversation.participants[0].name[0]}</AvatarFallback>
                                </Avatar>
                                {conversation.participants[0].status === 'online' && (
                                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium truncate">{conversation.participants[0].name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {conversation.lastMessage && formatTimestamp(conversation.lastMessage.timestamp)}
                                  </p>
                                </div>
                                <div className="flex items-center justify-between">
                                  <p className="text-sm text-muted-foreground truncate">
                                    {conversation.lastMessage?.content}
                                  </p>
                                  <div className="flex items-center">
                                    {conversation.isPinned && (
                                      <Star className="h-3 w-3 text-yellow-500 mr-1" />
                                    )}
                                    {conversation.unreadCount > 0 && (
                                      <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center">
                                        {conversation.unreadCount}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="unread" className="flex-1 overflow-y-auto p-2">
                    <div className="space-y-1">
                      {filteredConversations
                        .filter(conv => conv.unreadCount > 0)
                        .map((conversation) => (
                          <div
                            key={conversation.id}
                            className={`p-2 rounded-lg cursor-pointer transition-colors ${
                              selectedConversation?.id === conversation.id 
                                ? 'bg-accent' 
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => {
                              setSelectedConversation(conversation);
                              fetchMessages(conversation.id);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={conversation.participants[0].avatar} />
                                <AvatarFallback>{conversation.participants[0].name[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium truncate">{conversation.participants[0].name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {conversation.lastMessage && formatTimestamp(conversation.lastMessage.timestamp)}
                                  </p>
                                </div>
                                <div className="flex items-center justify-between">
                                  <p className="text-sm text-muted-foreground truncate">
                                    {conversation.lastMessage?.content}
                                  </p>
                                  <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center">
                                    {conversation.unreadCount}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="pinned" className="flex-1 overflow-y-auto p-2">
                    <div className="space-y-1">
                      {filteredConversations
                        .filter(conv => conv.isPinned)
                        .map((conversation) => (
                          <div
                            key={conversation.id}
                            className={`p-2 rounded-lg cursor-pointer transition-colors ${
                              selectedConversation?.id === conversation.id 
                                ? 'bg-accent' 
                                : 'hover:bg-muted'
                            }`}
                            onClick={() => {
                              setSelectedConversation(conversation);
                              fetchMessages(conversation.id);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={conversation.participants[0].avatar} />
                                <AvatarFallback>{conversation.participants[0].name[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium truncate">{conversation.participants[0].name}</p>
                                  <div className="flex items-center">
                                    <Star className="h-3 w-3 text-yellow-500 mr-1" />
                                    <p className="text-xs text-muted-foreground">
                                      {conversation.lastMessage && formatTimestamp(conversation.lastMessage.timestamp)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <p className="text-sm text-muted-foreground truncate">
                                    {conversation.lastMessage?.content}
                                  </p>
                                  {conversation.unreadCount > 0 && (
                                    <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center">
                                      {conversation.unreadCount}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={selectedConversation.participants[0].avatar} />
                          <AvatarFallback>{selectedConversation.participants[0].name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{selectedConversation.participants[0].name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {selectedConversation.participants[0].status === 'online' 
                              ? 'Online' 
                              : selectedConversation.participants[0].lastSeen 
                                ? `Last seen ${formatTimestamp(selectedConversation.participants[0].lastSeen)}` 
                                : 'Offline'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Phone className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Video className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Info className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((message) => (
                        <div 
                          key={message.id} 
                          className={`flex ${message.sender.id === 'user-id' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`flex gap-2 max-w-[70%] ${message.sender.id === 'user-id' ? 'flex-row-reverse' : ''}`}>
                            {message.sender.id !== 'user-id' && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={message.sender.avatar} />
                                <AvatarFallback>{message.sender.name[0]}</AvatarFallback>
                              </Avatar>
                            )}
                            <div>
                              <div 
                                className={`rounded-lg p-3 ${
                                  message.sender.id === 'user-id' 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted'
                                }`}
                              >
                                <p>{message.content}</p>
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className="mt-2 space-y-2">
                                    {message.attachments.map((attachment, index) => (
                                      <div 
                                        key={index} 
                                        className={`flex items-center gap-2 p-2 rounded ${
                                          message.sender.id === 'user-id' 
                                            ? 'bg-primary-foreground/10' 
                                            : 'bg-background'
                                        }`}
                                      >
                                        {attachment.type === 'image' && <Image className="h-4 w-4" />}
                                        {attachment.type === 'file' && <File className="h-4 w-4" />}
                                        {attachment.type === 'audio' && <Mic className="h-4 w-4" />}
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium truncate">{attachment.name}</p>
                                          {attachment.size && (
                                            <p className="text-xs opacity-70">{attachment.size}</p>
                                          )}
                                        </div>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-6 w-6"
                                        >
                                          <Download className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div 
                                className={`flex items-center gap-1 mt-1 text-xs text-muted-foreground ${
                                  message.sender.id === 'user-id' ? 'justify-end' : ''
                                }`}
                              >
                                <span>{formatTimestamp(message.timestamp)}</span>
                                {message.sender.id === 'user-id' && (
                                  <span>{getStatusIcon(message.status)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Message Input */}
                    <div className="p-4 border-t">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Smile className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Paperclip className="h-5 w-5" />
                        </Button>
                        <Input 
                          placeholder="Type a message..." 
                          className="flex-1"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                        <Button 
                          variant={messageInput.trim() ? "default" : "ghost"} 
                          size="icon"
                          disabled={!messageInput.trim()}
                          onClick={handleSendMessage}
                        >
                          <Send className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                    <div className="bg-muted/50 p-6 rounded-full mb-4">
                      <MessageSquare className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">Your Messages</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      Connect with collaborators, clients, and fellow musicians. Select a conversation or start a new one.
                    </p>
                    <Button onClick={startNewConversation}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Message
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function MessageSquare(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function Download(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  )
}