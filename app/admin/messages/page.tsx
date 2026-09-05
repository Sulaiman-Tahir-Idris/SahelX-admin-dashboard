"use client";

import { useAuth } from "@/lib/auth-utils";
import { useAdminMessages } from "@/lib/chat/use-admin-messages";
import { sendAdminMessage } from "@/lib/chat/send-admin-message";
import { markMessagesAsSeen } from "@/lib/chat/mark-messages-seen";
import { setTypingStatus } from "@/lib/chat/set-typing-status";
import { useTypingIndicator } from "@/lib/chat/use-typing-indicator";
import { toggleMessageReaction } from "@/lib/chat/toggle-message-reaction";
import { db } from "@/lib/firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Users, User, SmilePlus, ArrowLeft } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ChatUser {
  id: string;
  name: string;
  role: string;
}

export default function AdminMessagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [activeChatId, setActiveChatId] = useState<string>("global");
  const [activeChatName, setActiveChatName] = useState<string>("Global Group Chat");
  const [activeChatIsGroup, setActiveChatIsGroup] = useState<boolean>(true);
  
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const messages = useAdminMessages(activeChatId);
  const typers = useTypingIndicator(user?.userId ?? "", activeChatId);

  // Fetch admin and secretary users for 1-on-1 chats
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const adminSnap = await getDocs(collection(db, "Admin"));
        const secSnap = await getDocs(collection(db, "Secretary"));
        const fetchedUsers: ChatUser[] = [];
        
        adminSnap.forEach((doc) => {
          if (doc.id !== user?.userId) {
            fetchedUsers.push({
              id: doc.id,
              name: doc.data().displayName || "Admin",
              role: doc.data().role || "Admin",
            });
          }
        });

        secSnap.forEach((doc) => {
          if (doc.id !== user?.userId) {
            fetchedUsers.push({
              id: doc.id,
              name: doc.data().displayName || "Secretary",
              role: doc.data().role || "Secretary",
            });
          }
        });

        // Deduplicate by id in case a user exists in both collections
        const seen = new Set<string>()
        const uniqueUsers = fetchedUsers.filter(u => {
          if (seen.has(u.id)) return false
          seen.add(u.id)
          return true
        })
        setUsers(uniqueUsers);
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };
    if (user?.userId) {
      fetchUsers();
    }
  }, [user?.userId]);

  // Mark messages as seen when entering a chat
  useEffect(() => {
    if (!user?.userId) return;
    markMessagesAsSeen(user.userId, user.role);
  }, [user?.userId, user?.role, activeChatId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !user?.userId) return;

    const messageText = text;
    setText(""); // Optimistic clear
    setTypingStatus(user.userId, user.displayName ?? "Admin", false, activeChatId);

    await sendAdminMessage(
      messageText,
      {
        userId: user.userId,
        displayName: user.displayName ?? "Admin",
        role: user.role,
      },
      activeChatId
    );
  };

  const getChatId = (id1: string, id2: string) => {
    return [id1, id2].sort().join("_");
  };

  const handleSelectUser = (chatUser: ChatUser) => {
    if (!user?.userId) return;
    const newChatId = getChatId(user.userId, chatUser.id);
    setActiveChatId(newChatId);
    setActiveChatName(chatUser.name);
    setActiveChatIsGroup(false);
  };

  const handleSelectGlobal = () => {
    setActiveChatId("global");
    setActiveChatName("Global Group Chat");
    setActiveChatIsGroup(true);
  };

  if (!user) return null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden border rounded-xl shadow-sm bg-background">
      {/* 🔹 Left Sidebar (Chat List) */}
      <div className="w-80 border-r flex flex-col bg-muted/20">
        <div className="p-4 border-b flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground">
            <ArrowLeft size={18} />
          </Button>
          <h2 className="font-semibold text-lg">Messages</h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {/* Global Chat Item */}
            <button
              onClick={handleSelectGlobal}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                activeChatId === "global" ? "bg-primary/10 text-primary" : "hover:bg-muted"
              }`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${activeChatId === "global" ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20"}`}>
                <Users size={20} />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-medium truncate">Global Group Chat</p>
                <p className="text-xs text-muted-foreground truncate">Team announcements & chatter</p>
              </div>
            </button>
            
            {/* Secretaries Group Item */}
            <button
              onClick={() => {
                setActiveChatId("secretaries_group");
                setActiveChatName("Secretaries Group");
                setActiveChatIsGroup(true);
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors mt-1 ${
                activeChatId === "secretaries_group" ? "bg-primary/10 text-primary" : "hover:bg-muted"
              }`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${activeChatId === "secretaries_group" ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20"}`}>
                <Users size={20} />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-medium truncate">Secretaries Group</p>
                <p className="text-xs text-muted-foreground truncate">Admins & Secretaries</p>
              </div>
            </button>
            
            <div className="pt-4 pb-2 px-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Direct Messages</p>
            </div>

            {/* Individual Users */}
            {users.map((u) => {
              const chatId = getChatId(user.userId, u.id);
              const isActive = activeChatId === chatId;
              return (
                <button
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  }`}
                >
                  <Avatar className="w-10 h-10 border border-primary/10">
                    <AvatarFallback className={isActive ? "bg-primary/20 text-primary" : "bg-muted-foreground/10"}>
                      {u.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-medium truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate uppercase">{u.role}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* 🔹 Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background relative">
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b bg-background z-10 shadow-sm">
          {activeChatIsGroup ? (
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
              <Users size={20} />
            </div>
          ) : (
            <Avatar className="w-10 h-10 border border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {activeChatName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            <h1 className="text-base font-semibold">{activeChatName}</h1>
            <p className="text-xs text-muted-foreground">
              {activeChatIsGroup ? "Internal communication" : "Direct Message"}
            </p>
          </div>
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              className="text-xs hidden md:flex items-center gap-2"
              onClick={async () => {
                const { registerFcmToken } = await import('@/lib/firebase/fcm');
                const token = await registerFcmToken(
                  user.userId,
                  (user.role?.toLowerCase() === 'secretary' ? 'Secretary' : 'Admin')
                );
                if (token) {
                  toast({ title: "Notifications enabled!", description: "You'll receive OS notifications when you're away." });
                } else {
                  toast({ title: "Permission denied", description: "Allow notifications in your browser settings.", variant: "destructive" });
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              Enable Background Notifications
            </Button>
          </div>
        </div>

        {/* Messages Timeline */}
        <ScrollArea className="flex-1 p-4 md:p-6">
          <div className="space-y-6 flex flex-col justify-end min-h-full pb-4">
            {messages.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm h-full">
                No messages yet. Start the conversation!
              </div>
            )}
            {messages.map((msg) => {
              const isMine = msg.senderId === user?.userId;

              return (
                <div
                  key={msg.id}
                  className={`relative flex gap-2 group w-full ${isMine ? "justify-end" : "justify-start"}`}
                >
                  {!isMine && activeChatIsGroup && (
                    <Avatar className="w-8 h-8 mt-auto shrink-0 border">
                      <AvatarFallback className="text-xs bg-muted">
                        {msg.senderName?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`flex flex-col ${isMine ? "items-end" : "items-start"} max-w-[75%]`}>
                    {!isMine && activeChatIsGroup && (
                      <span className="text-[10px] text-muted-foreground ml-1 mb-1 font-medium">
                        {msg.senderName}
                      </span>
                    )}

                    <div
                      className={`relative rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        isMine 
                          ? "bg-primary text-primary-foreground rounded-br-sm" 
                          : "bg-muted text-foreground rounded-bl-sm border border-border/50"
                      }`}
                    >
                      <p className="leading-relaxed">{msg.text}</p>
                      
                      {/* Reaction Bubbles attached to message */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className={`absolute -bottom-3 flex gap-1 ${isMine ? "right-2" : "left-2"}`}>
                          {Object.entries(msg.reactions).map(([emoji, users]) => {
                            const userIds = users as string[];
                            if (userIds.length === 0) return null;
                            return (
                              <div
                                key={emoji}
                                className="bg-background border shadow-sm rounded-full px-1.5 py-0.5 text-[10px] flex items-center space-x-1"
                              >
                                <span>{emoji}</span>
                                {userIds.length > 1 && <span className="font-medium">{userIds.length}</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground px-1">
                        {msg.createdAt?.toDate
                          ? msg.createdAt.toDate().toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>
                  </div>

                  {/* Reaction Button (Hover) */}
                  <div className={`flex items-center opacity-0 group-hover:opacity-100 transition-opacity ${isMine ? "mr-2" : "ml-2"}`}>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background border shadow-sm text-muted-foreground hover:text-foreground">
                          <SmilePlus size={14} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="top" align="center" className="w-auto p-1.5 flex gap-1 rounded-full shadow-lg">
                        {["👍", "❤️", "😂", "😮", "🙏"].map((emoji) => {
                          const reacted = msg.reactions?.[emoji]?.includes(user?.userId ?? "") ?? false;
                          return (
                            <button
                              key={emoji}
                              className={`rounded-full p-2 text-base transition-transform hover:scale-110 ${reacted ? "bg-muted" : "hover:bg-muted"}`}
                              onClick={() => toggleMessageReaction(msg.id, emoji, user?.userId ?? "", activeChatId)}
                            >
                              {emoji}
                            </button>
                          );
                        })}
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* 🔹 Typing indicator */}
        <div className="absolute bottom-[72px] left-6">
          {typers.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full border shadow-sm">
              <span className="flex gap-0.5">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-100">.</span>
                <span className="animate-bounce delay-200">.</span>
              </span>
              <span>{typers.join(", ")} {typers.length > 1 ? "are" : "is"} typing</span>
            </div>
          )}
        </div>

        {/* 🔹 Input Area */}
        <div className="p-4 bg-background border-t">
          <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-full border border-border/50 focus-within:ring-1 focus-within:ring-primary focus-within:bg-background transition-all shadow-sm">
            <Input
              placeholder={activeChatIsGroup ? "Message the group..." : `Message ${activeChatName}...`}
              value={text}
              className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 px-4"
              onChange={(e) => {
                setText(e.target.value);
                if (!user?.userId) return;
                setTypingStatus(user.userId, user.displayName ?? "Admin", true, activeChatId);
              }}
              onBlur={() => {
                if (!user?.userId) return;
                setTypingStatus(user.userId, user.displayName ?? "Admin", false, activeChatId);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
            />
            <Button 
              size="icon" 
              onClick={handleSend} 
              disabled={!text.trim()}
              className="rounded-full shrink-0 h-10 w-10 transition-transform active:scale-95"
            >
              <Send size={16} className="ml-0.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
