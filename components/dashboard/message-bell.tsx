"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";

export type AdminMessage = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt?: any;
  seen?: boolean;
  reactions?: Record<string, string[]>; // 👈 IMPORTANT
  [key: string]: any; // for any additional fields
};

interface MessageBellProps {
  messages: AdminMessage[];
  onClick?: () => void;
}

export function MessageBell({ messages, onClick }: MessageBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const unreadCount = messages.filter((m) => !m.seen).length;

  const previewMessages = messages.slice().reverse().slice(0, 3); // last 3 messages

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={onClick ?? (() => router.push("/admin/messages"))}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-white text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64 border">
        <div className="px-2 py-1 text-sm font-semibold text-gray-700 border-b">
          Messages
        </div>
        {previewMessages.length === 0 && (
          <div className="px-3 py-2 text-xs text-gray-500">No new messages</div>
        )}
        {previewMessages.map((msg) => (
          <DropdownMenuItem
            key={msg.id}
            className="flex flex-col text-xs cursor-pointer hover:bg-gray-100"
            onClick={() => router.push("/admin/messages")}
          >
            <span className="font-medium">{msg.senderName}</span>
            <span className="truncate">{msg.text}</span>
          </DropdownMenuItem>
        ))}
        {messages.length > 3 && (
          <DropdownMenuItem
            className="text-center text-xs text-gray-500"
            onClick={() => router.push("/admin/messages")}
          >
            See all messages
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
