import React, { useState, useRef, useEffect } from 'react';
import { createTutorChat } from '../services/geminiService';
import { Chat, GenerateContentResponse } from "@google/genai";
import { Sparkles, Send, X, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from './Button';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  sources?: { uri: string; title: string }[];
}

interface GeminiTutorProps {
  context: string;
  isOpen: boolean;
  onClose: () => void;
}

export const GeminiTutor: React.FC<GeminiTutorProps> = ({ context, isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: "Hi! I'm your AI Tutor. Ask me anything about this lesson." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Re-initialize chat when context changes (new lesson)
  useEffect(() => {
    const chat = createTutorChat(context);
    chatRef.current = chat;
    setMessages([
      { role: 'assistant', text: "Hi! I'm your AI Tutor. Ask me anything about this lesson." }
    ]);
  }, [context]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    try {
      if (chatRef.current) {
        const response: GenerateContentResponse = await chatRef.current.sendMessage({ message: userMsg });
        const text = response.text || "I'm not sure how to answer that.";
        
        // Extract Grounding Sources
        const sources: { uri: string; title: string }[] = [];
        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          response.candidates[0].groundingMetadata.groundingChunks.forEach(chunk => {
            if (chunk.web?.uri) {
              sources.push({
                uri: chunk.web.uri,
                title: chunk.web.title || new URL(chunk.web.uri).hostname
              });
            }
          });
        }

        setMessages(prev => [...prev, { role: 'assistant', text: text, sources }]);
      } else {
        // Fallback if AI not initialized
        await new Promise(resolve => setTimeout(resolve, 1000));
        setMessages(prev => [...prev, { role: 'assistant', text: "AI features are currently unavailable. Please check if the API key is configured." }]);
      }
    } catch (error) {
      console.error("Chat Error", error);
      setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I encountered an error while processing that." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    const chat = createTutorChat(context);
    chatRef.current = chat;
    setMessages([
      { role: 'assistant', text: "Chat cleared. What else can I help you with?" }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-500 p-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <h3 className="font-semibold">AI Tutor</h3>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={resetChat} 
            className="hover:bg-primary-700 p-1 rounded transition-colors"
            title="Reset Chat"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button 
            onClick={onClose} 
            className="hover:bg-primary-700 p-1 rounded transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div 
              className={`max-w-[85%] p-3 rounded-lg text-sm ${
                msg.role === 'user' 
                  ? 'bg-primary-600 text-white rounded-br-none' 
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
            {/* Grounding Sources Display */}
            {msg.sources && msg.sources.length > 0 && (
              <div className="mt-2 text-xs max-w-[85%] bg-gray-100 p-2 rounded border border-gray-200">
                <p className="font-semibold text-gray-500 mb-1 flex items-center gap-1">
                   <Sparkles className="h-3 w-3" /> Sources
                </p>
                <div className="flex flex-wrap gap-2">
                  {msg.sources.map((source, sIdx) => (
                    <a 
                      key={sIdx}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-1 text-primary-700 hover:text-primary-900 hover:border-primary-400 transition-colors"
                    >
                      <span className="truncate max-w-[100px]">{source.title}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 p-3 rounded-lg rounded-bl-none shadow-sm flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            className="flex-1 bg-white text-gray-900 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isLoading}
          />
          <Button size="sm" onClick={handleSend} disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};