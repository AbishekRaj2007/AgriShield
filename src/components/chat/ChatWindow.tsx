import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"; // Animation for messages
import { Send, Paperclip, Sparkles, Sprout, CloudRain, IndianRupee, X, Image, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageBubble } from "./MessageBubble";
import { AgrishieldLogo } from "@/components/ui/AgrishieldLogo"; // Keeping your custom logo
import clsx from "clsx";

interface AttachedFile {
  file: File;
  preview?: string;
  type: 'image' | 'document';
}

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  attachments?: AttachedFile[];
}

// Quick prompts to help farmers start the conversation
const SUGGESTED_QUESTIONS = [
  { icon: Sprout, text: "Best flood-resistant rice?" },
  { icon: CloudRain, text: "Will it rain tomorrow?" },
  { icon: IndianRupee, text: "Current Wheat prices?" },
];

const initialMessages: Message[] = [
  {
    id: '1',
    text: "Namaste! I'm your AgriShield AI. I can analyze your soil, predict weather risks, and suggest crops. How can I help your farm today?",
    isBot: true,
    timestamp: new Date(),
  }
];

export function ChatWindow({ location }: { location: any }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [language, setLanguage] = useState("English");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: AttachedFile[] = [];

    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const attachment: AttachedFile = {
        file,
        type: isImage ? 'image' : 'document',
      };

      if (isImage) {
        const reader = new FileReader();
        reader.onload = (event) => {
          attachment.preview = event.target?.result as string;
          setAttachedFiles(prev => [...prev]);
        };
        reader.readAsDataURL(file);
      }

      newAttachments.push(attachment);
    });

    setAttachedFiles(prev => [...prev, ...newAttachments]);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() && attachedFiles.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isBot: false,
      timestamp: new Date(),
      attachments: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setAttachedFiles([]);
    setIsTyping(true);

    // Build message text including file info for AI context
    let messageText = text.trim();
    if (attachedFiles.length > 0) {
      const fileNames = attachedFiles.map(a => a.file.name).join(', ');
      messageText += messageText ? `\n[Attached files: ${fileNames}]` : `[Attached files: ${fileNames}]`;
    }

    try {
      const apiResponse = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          language: language,
          location: location, // Passing the location data
          date: new Date().toISOString(),
        }),
      });

      if (!apiResponse.ok) throw new Error("Failed to get response.");

      const data = await apiResponse.json();

      const botResponse: Message = {
        id: Date.now().toString() + "-bot",
        text: data.response,
        isBot: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botResponse]);

    } catch (error) {
      const errorResponse: Message = {
        id: Date.now().toString() + "-error",
        text: "I'm having trouble connecting to the satellite. Please check your internet connection.",
        isBot: true,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    // Fill parent container and use flex layout
    <div className="flex flex-col h-full bg-transparent">

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto chat-scroll p-4 space-y-6">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <MessageBubble message={message} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-start space-x-3"
          >
            <div className="h-8 w-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center p-1">
              <AgrishieldLogo size={20} />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-white/10 border border-white/10 backdrop-blur-md">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions (Only show if few messages) */}
      {messages.length <= 2 && !isTyping && (
        <div className="px-4 pb-2">
          <p className="text-xs text-white/50 mb-2 font-medium uppercase tracking-wider">Suggested Questions</p>
          <div className="flex gap-2 flex-wrap">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(q.text)}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 text-sm px-3 py-2 rounded-full transition-all hover:scale-105"
              >
                <q.icon className="w-3 h-3 text-green-400" />
                {q.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area - Floating Capsule Design */}
      <div className="p-4 pt-2">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
          className="hidden"
        />

        {/* Attached Files Preview */}
        {attachedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachedFiles.map((attachment, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group"
              >
                {attachment.type === 'image' && attachment.preview ? (
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/20">
                    <img
                      src={attachment.preview}
                      alt={attachment.file.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeAttachment(index)}
                      className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="relative flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-3 py-2">
                    <FileText className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-white/80 max-w-[100px] truncate">
                      {attachment.file.name}
                    </span>
                    <button
                      onClick={() => removeAttachment(index)}
                      className="text-white/60 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-2 flex items-center gap-2 shadow-2xl relative">

          {/* Language Selector (Integrated into input bar) */}
          <div className="hidden md:flex bg-white/5 rounded-full p-1 border border-white/5">
            {['En', 'Hi', 'Ta'].map(langShort => {
              const fullLang = langShort === 'En' ? 'English' : langShort === 'Hi' ? 'Hindi' : 'Tamil';
              return (
                <button
                  key={langShort}
                  onClick={() => setLanguage(fullLang)}
                  className={clsx(
                    "text-xs px-2 py-1 rounded-full transition-all",
                    language === fullLang ? "bg-green-600 text-white" : "text-white/60 hover:text-white"
                  )}
                >
                  {langShort}
                </button>
              )
            })}
          </div>

          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Ask in ${language}...`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }
              }}
              className="bg-transparent border-none text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-2 h-auto text-base"
            />
          </div>

          <div className="flex items-center gap-1 pr-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAttachClick}
              className={clsx(
                "h-8 w-8 rounded-full transition-all",
                attachedFiles.length > 0
                  ? "text-green-400 hover:text-green-300 hover:bg-green-500/20"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              )}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleSendMessage(inputValue)}
              disabled={(!inputValue.trim() && attachedFiles.length === 0) || isTyping}
              size="icon"
              className={clsx(
                "h-10 w-10 rounded-full transition-all duration-300",
                (inputValue.trim() || attachedFiles.length > 0) ? "bg-green-500 hover:bg-green-600 text-white" : "bg-white/10 text-white/40"
              )}
            >
              {isTyping ? <Sparkles className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
            </Button>
          </div>
        </div>
        <p className="text-center text-[10px] text-white/30 mt-2">
          AI can make mistakes. Please verify important farming decisions.
        </p>
      </div>
    </div>
  );
}