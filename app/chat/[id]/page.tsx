// app/chat/[id]/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import { Send, User, ArrowLeft, Check, CheckCheck, Trash2 } from "lucide-react";
import Link from "next/link";
import { useDialog } from "@/components/DialogProvider";

export default function ChatPage() {
  const { showConfirm, showAlert } = useDialog();
  const router = useRouter();
  const params = useParams();
  const otherUserId = params.id as string; 
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTabActive, setIsTabActive] = useState(true); 
  const bottomRef = useRef<HTMLDivElement>(null);
  // 💬 update-59: support 💬 button එක message යවන button එක උඩ වැටෙන්නේ නැති වෙන්න (globals.css)
  useEffect(() => {
    document.documentElement.dataset.chatOpen = "1";
    return () => { delete document.documentElement.dataset.chatOpen; };
  }, []);

  useEffect(() => {
    const handleFocus = () => setIsTabActive(true);
    const handleBlur = () => setIsTabActive(false);

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  useEffect(() => {
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      setCurrentUser(user);

      const { data: otherProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", otherUserId)
        .single();
      setOtherUser(otherProfile);

      const { data: prevMessages } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      if (prevMessages) setMessages(prevMessages);

      if (document.hasFocus()) {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("receiver_id", user.id)
          .eq("sender_id", otherUserId)
          .eq("is_read", false);
      }

      const subscription = supabase
        .channel('public:messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
          const newMsg = payload.new;
          
          if (
            (newMsg.sender_id === user.id && newMsg.receiver_id === otherUserId) ||
            (newMsg.sender_id === otherUserId && newMsg.receiver_id === user.id)
          ) {
            setMessages((prev) => {
              if (prev.find(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });

            if (newMsg.receiver_id === user.id && document.hasFocus()) {
              await supabase
                .from("messages")
                .update({ is_read: true })
                .eq("id", newMsg.id);
            }
          }
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
          const updatedMsg = payload.new;
          setMessages((prev) => 
            prev.map(msg => msg.id === updatedMsg.id ? updatedMsg : msg)
          );
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    };

    initChat();
  }, [otherUserId, router]);

  useEffect(() => {
    const markPendingAsRead = async () => {
      if (isTabActive && currentUser && otherUserId) {
        await supabase
          .from("messages")
          .update({ is_read: true })
          .eq("receiver_id", currentUser.id)
          .eq("sender_id", otherUserId)
          .eq("is_read", false);
      }
    };
    markPendingAsRead();
  }, [isTabActive, currentUser, otherUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const msgText = newMessage;
    setNewMessage(""); 

    const { data, error } = await supabase
      .from("messages")
      .insert({
        sender_id: currentUser.id,
        receiver_id: otherUserId,
        content: msgText,
      })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => [...prev, data]);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    const confirmDelete = await showConfirm({
      title: "Delete message?",
      message: "This message will be removed from the conversation.",
      confirmText: "Delete",
      tone: "danger",
    });
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("messages")
      .update({ is_deleted: true })
      .eq("id", msgId);

    if (error) {
      showAlert({ title: "Couldn't delete message", message: error.message, tone: "error" });
    }
  };

  return (
    <main className="min-h-screen bg-background flex flex-col">
      
      <div className="flex-1 max-w-3xl w-full mx-auto p-4 flex flex-col h-[calc(100vh-80px)]">
        
        {/* Chat Header */}
        <div className="flex items-center gap-4 p-4 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10 rounded-t-2xl">
          <Link href="/interests" className="p-2 hover:bg-muted rounded-full transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          {otherUser?.avatar_url ? (
            <img src={otherUser.avatar_url} alt="User" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><User className="h-5 w-5 text-muted-foreground" /></div>
          )}
          <div>
            <h2 className="font-bold text-lg text-foreground">{otherUser?.full_name || "Loading..."}</h2>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground mt-10">
              Say hello to {otherUser?.full_name || "them"}! 👋
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.sender_id === currentUser?.id;
              const isDeleted = msg.is_deleted;
              
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const isSameSenderAsPrev = prevMsg && prevMsg.sender_id === msg.sender_id;
              
              const showAvatar = !isMe && !isSameSenderAsPrev;
              const marginTop = isSameSenderAsPrev ? "mt-0.5" : "mt-4";

              const timeString = new Date(msg.created_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              });

              return (
                <div key={msg.id} className={`flex w-full ${isMe ? "justify-end" : "justify-start"} ${marginTop}`}>
                  
                  {/* 👇 මේකෙන් අනිත් කෙනාගේ ප්‍රොෆයිල් පින්තූරය පෙන්නනවා (ඩිලීට් වුණත්) */}
                  {!isMe && (
                    <div className="w-8 mr-2 shrink-0 flex items-start pt-1">
                      {showAvatar ? (
                        otherUser?.avatar_url ? (
                          <img src={otherUser.avatar_url} alt="User" className="w-8 h-8 rounded-full object-cover shadow-sm" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shadow-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )
                      ) : (
                        <div className="w-8 h-8" /> 
                      )}
                    </div>
                  )}

                  {/* මැසේජ් එක සහ වෙලාව */}
                  <div className={`group flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[75%]`}>
                    <div className={`px-4 py-2 rounded-2xl ${
                      isDeleted 
                        ? "bg-muted/50 border border-border text-muted-foreground italic text-xs"
                        : isMe 
                          ? "bg-gradient-to-r from-[#DD2F4F] to-[#F05160] text-white rounded-br-sm shadow-md" 
                          : "bg-muted text-foreground rounded-bl-sm"
                    }`}>
                      <p className={isDeleted ? "text-xs" : "text-sm"}>
                        {isDeleted ? "This message was deleted" : msg.content}
                      </p>
                    </div>

                    {/* 👇 මේ කොටසින් වෙන්නේ ඩිලීට් නොවුණු මැසේජ් වලට විතරක් වෙලාවයි ටික් එකයි පෙන්නන එකයි */}
                    {!isDeleted && (
                      <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                        
                        {isMe && (
                          <button 
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-red-500"
                            title="Delete message"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}

                        <span className="text-[10px] text-muted-foreground">
                          {timeString}
                        </span>
                        
                        {isMe && (
                          <span className="flex items-center">
                            {msg.is_read ? (
                              <CheckCheck className="h-4 w-4 text-blue-500" /> 
                            ) : (
                              <Check className="h-4 w-4 text-muted-foreground" /> 
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-4 bg-background border-t border-border flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-border bg-muted/50 px-6 py-3 outline-none focus:border-primary transition-all text-sm"
          />
          <button 
            type="submit" 
            className="rounded-full bg-gradient-to-r from-[#DD2F4F] to-[#F05160] p-3 text-white hover:opacity-90 shadow-md transition-all active:scale-95"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>

      </div>
    </main>
  );
}