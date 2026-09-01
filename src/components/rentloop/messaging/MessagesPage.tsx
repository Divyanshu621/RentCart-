'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  MessageSquare,
  Loader2,
  Check,
  CheckCheck,
  PackageOpen,
  Search,
  ArrowRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/store';
import { api } from '@/lib/api';
import type { Conversation, ChatMessage } from '@/types';
import { formatDistanceToNow } from 'date-fns';

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function MessagesPage() {
  const user = useAppStore((s) => s.user);
  const navigate = useAppStore((s) => s.navigate);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.getConversations().then((data: any) => Array.isArray(data?.conversations) ? data.conversations as Conversation[] : []),
    enabled: !!user,
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: () =>
      api.getMessages(selectedConversation!.id).then((data: any) => Array.isArray(data?.messages) ? data.messages as ChatMessage[] : []),
    enabled: !!selectedConversation,
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
      api.sendMessage(conversationId, content),
    onMutate: async ({ conversationId, content }) => {
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });
      const prev = queryClient.getQueryData<ChatMessage[]>(['messages', conversationId]);
      const optimistic: ChatMessage = {
        id: `temp-${Date.now()}`,
        conversationId,
        senderId: user!.id,
        sender: { id: user!.id, name: user!.name, avatarUrl: user!.avatarUrl },
        content,
        type: 'TEXT',
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData(['messages', conversationId], [...(prev || []), optimistic]);
      return { prev };
    },
    onError: (_err, vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['messages', vars.conversationId], context.prev);
      }
    },
    onSettled: (_data, _err, vars) => {
      queryClient.invalidateQueries({ queryKey: ['messages', vars.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    useAppStore.getState().setCurrentConversation(conv);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(
      { conversationId: selectedConversation.id, content: messageInput.trim() },
      {
        onSuccess: () => {
          setMessageInput('');
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getOtherUser = (conv: Conversation) => {
    if (!user) return null;
    if (conv.user1Id === user.id) return conv.user2;
    return conv.user1;
  };

  const filteredConversations = searchQuery
    ? conversations.filter((c) => {
        const other = getOtherUser(c);
        return other?.name.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : conversations;

  // Mobile state
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const handleSelectMobile = (conv: Conversation) => {
    setSelectedConversation(conv);
    setMobileShowChat(true);
  };

  const handleBack = () => {
    setMobileShowChat(false);
  };

  const renderConversationItem = (conv: Conversation) => {
    const other = getOtherUser(conv);
    if (!other) return null;
    const isSelected = selectedConversation?.id === conv.id;
    const hasUnread = (conv.unreadCount ?? 0) > 0;
    return (
      <motion.button
        key={conv.id}
        onClick={() => {
          if (isMobileViewport) {
            handleSelectMobile(conv);
          } else {
            handleSelectConversation(conv);
          }
        }}
        className={`w-full flex items-center gap-3 p-3 text-left transition-colors rounded-lg ${
          isSelected
            ? 'bg-emerald-50 border border-emerald-200'
            : 'hover:bg-slate-50 border border-transparent'
        }`}
        whileTap={{ scale: 0.98 }}
      >
        {other.avatarUrl ? (
          <Avatar className="h-11 w-11 shrink-0">
            <AvatarImage src={other.avatarUrl} />
            <AvatarFallback>{getInitials(other.name)}</AvatarFallback>
          </Avatar>
        ) : (
          <Avatar className="h-11 w-11 shrink-0">
            <AvatarFallback className="bg-slate-100 text-slate-600 text-sm font-medium">{getInitials(other.name)}</AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm text-slate-900 truncate">{other.name}</span>
            {conv.lastMessageAt && (
              <span className="text-[11px] text-slate-400 shrink-0">
                {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-500 truncate">
              {conv.lastMessage || 'Start a conversation...'}
            </p>
            {conv.product && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0 bg-slate-100">
                {conv.product.title.slice(0, 15)}
              </Badge>
            )}
          </div>
        </div>
        {hasUnread && (
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
        )}
      </motion.button>
    );
  };

  // Detect mobile viewport
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  useEffect(() => {
    const check = () => setIsMobileViewport(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const otherUser = selectedConversation ? getOtherUser(selectedConversation) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('dashboard')}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
            <p className="text-sm text-slate-500">Chat with renters and owners</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex h-[calc(100vh-180px)] min-h-[500px]">
          {/* Left Panel - Conversation List */}
          <div
            className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col shrink-0 ${
              isMobileViewport && mobileShowChat ? 'hidden' : 'flex'
            }`}
          >
            {/* Search */}
            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            {/* Conversation List */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {loadingConversations ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <Skeleton className="h-11 w-11 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                  ))
                ) : filteredConversations.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-16 px-4 text-center"
                  >
                    <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <MessageSquare className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="font-semibold text-slate-700 mb-1">No conversations yet</h3>
                    <p className="text-sm text-slate-500">
                      Start one from a product page.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      onClick={() => navigate('marketplace')}
                    >
                      Browse Marketplace
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  </motion.div>
                ) : (
                  <AnimatePresence>
                    {filteredConversations.map((conv) => renderConversationItem(conv))}
                  </AnimatePresence>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Chat Area */}
          <div
            className={`flex-1 flex flex-col ${
              isMobileViewport && !mobileShowChat ? 'hidden' : 'flex'
            }`}
          >
            {selectedConversation && otherUser ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
                  {isMobileViewport && (
                    <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  )}
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-medium">
                      {getInitials(otherUser.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-slate-900 truncate">{otherUser.name}</h3>
                    {selectedConversation.product && (
                      <p className="text-xs text-slate-500 truncate">
                        Re: {selectedConversation.product.title}
                      </p>
                    )}
                  </div>
                </div>

                {/* Messages Area */}
                <ScrollArea className="flex-1 px-4 py-4">
                  <div className="space-y-3 max-w-2xl mx-auto">
                    {loadingMessages ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className={`flex gap-2 ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                        >
                          <Skeleton className="h-12 w-48 rounded-2xl" />
                        </div>
                      ))
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12">
                        <PackageOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">No messages yet. Say hello!</p>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {messages.map((msg, idx) => {
                          const isMe = msg.senderId === user?.id;
                          const prevMsg = messages[idx - 1];
                          const showName = !prevMsg || prevMsg.senderId !== msg.senderId;
                          return (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2 }}
                              className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                              {!isMe && (
                                <Avatar className="h-8 w-8 shrink-0 mt-auto">
                                  <AvatarFallback className="bg-slate-100 text-slate-600 text-[10px] font-medium">
                                    {getInitials(msg.sender?.name || '?')}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                {showName && !isMe && (
                                  <span className="text-[11px] text-slate-400 mb-0.5 ml-1 block">
                                    {msg.sender?.name}
                                  </span>
                                )}
                                <div
                                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                    isMe
                                      ? 'bg-[#0f172a] text-white rounded-br-md'
                                      : 'bg-slate-100 text-slate-800 rounded-bl-md'
                                  }`}
                                >
                                  {msg.content}
                                </div>
                                <div
                                  className={`flex items-center gap-1 mt-0.5 ${
                                    isMe ? 'justify-end' : 'justify-start'
                                  }`}
                                >
                                  <span className="text-[10px] text-slate-400">
                                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                                  </span>
                                  {isMe && (
                                    msg.isRead ? (
                                      <CheckCheck className="h-3 w-3 text-emerald-500" />
                                    ) : (
                                      <Check className="h-3 w-3 text-slate-400" />
                                    )
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t border-slate-200 px-4 py-3 bg-white">
                  <div className="flex items-center gap-2 max-w-2xl mx-auto">
                    <Input
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="flex-1 h-10 text-sm border-slate-200"
                    />
                    <Button
                      size="icon"
                      className="h-10 w-10 bg-emerald-600 hover:bg-emerald-700 shrink-0"
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || sendMessageMutation.isPending}
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              /* Empty chat state */
              <div className="flex-1 flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center px-4"
                >
                  <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-10 w-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-1">Select a conversation</h3>
                  <p className="text-sm text-slate-500">
                    Choose a conversation from the list to start messaging
                  </p>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
