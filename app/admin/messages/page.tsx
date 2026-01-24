"use client";

import { useAuth } from "@/lib/auth-utils";
import { useAdminMessages } from "@/lib/chat/use-admin-messages";
import { sendAdminMessage } from "@/lib/chat/send-admin-message";
import { markMessagesAsSeen } from "@/lib/chat/mark-messages-seen";
import { setTypingStatus } from "@/lib/chat/set-typing-status";
import { useTypingIndicator } from "@/lib/chat/use-typing-indicator";
import { toggleMessageReaction } from "@/lib/chat/toggle-message-reaction";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";

export default function AdminMessagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const messages = useAdminMessages();
  const [text, setText] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typers = useTypingIndicator(user?.userId ?? "");

  /* Mark messages as seen */
  useEffect(() => {
    if (!user?.userId) return;
    markMessagesAsSeen(user.userId);
  }, [user?.userId]);

  /* Auto-scroll to latest message */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* Send message */
  const handleSend = async () => {
    if (!text.trim() || !user?.userId) return;

    await sendAdminMessage(text, {
      userId: user.userId,
      displayName: user.displayName ?? "Admin",
      role: user.role,
    });

    setText("");
    setTypingStatus(user.userId, user.displayName ?? "Admin", false);
  };

  return (
    <div className="ml-[240px] h-[calc(100vh-64px)] flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b bg-white">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="text-lg font-semibold">Admin Group Chat</h1>
          <p className="text-xs text-gray-500">Internal communication</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg) => {
          const isMine = msg.senderId === user?.userId;

          return (
            <div
              key={msg.id}
              className={`relative group max-w-[70%] ${isMine ? "ml-auto text-right" : ""}`}
            >
              {/* Message box */}
              <div
                className={`rounded-lg px-4 py-2 text-sm ${isMine ? "bg-sahelx-600 text-white" : "bg-white border"}`}
              >
                <p className="text-xs font-medium opacity-80 mb-1">
                  {msg.senderName}
                </p>
                <p>{msg.text}</p>
              </div>

              {/* Timestamp */}
              <p className="text-[10px] text-gray-400 mt-1">
                {msg.createdAt?.toDate
                  ? msg.createdAt.toDate().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </p>

              {/* Reactions bubbles */}
              <div className="flex gap-1 mt-1 flex-wrap">
                {Object.entries(msg.reactions ?? {}).map(([emoji, users]) => {
                  const userIds = users as string[];

                  return (
                    <div
                      key={emoji}
                      className="bg-gray-100 rounded-full px-1.5 py-0.5 text-xs flex items-center space-x-1"
                    >
                      <span>{emoji}</span>
                      {userIds.length > 1 && (
                        <span className="text-[10px] text-gray-500">
                          {userIds.length}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Reaction buttons (hover) */}
              <div className="absolute right-0 top-0 flex gap-1 opacity-0 group-hover:opacity-100">
                {["👍", "❤️", "😂", "😮"].map((emoji) => {
                  const reacted =
                    msg.reactions?.[emoji]?.includes(user?.userId ?? "") ??
                    false;
                  return (
                    <button
                      key={emoji}
                      className={`bg-gray-200 rounded-full px-1 ${reacted ? "bg-gray-300" : "hover:bg-gray-100"}`}
                      onClick={() =>
                        toggleMessageReaction(msg.id, emoji, user?.userId ?? "")
                      }
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Typing indicator */}
      {typers.length > 0 && (
        <p className="px-6 text-xs text-gray-500 italic mb-1">
          {typers.join(", ")} typing...
        </p>
      )}

      {/* Input */}
      <div className="flex gap-2 px-6 py-4 border-t bg-white">
        <Input
          placeholder="Type a message..."
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (!user?.userId) return;
            setTypingStatus(user.userId, user.displayName ?? "Admin", true);
          }}
          onBlur={() => {
            if (!user?.userId) return;
            setTypingStatus(user.userId, user.displayName ?? "Admin", false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <Button onClick={handleSend}>Send</Button>
      </div>
    </div>
  );
}
