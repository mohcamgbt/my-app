import React, { useState, useRef, useEffect, KeyboardEvent, FormEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [inputValue, setInputValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
      const textarea = textareaRef.current;
      if (textarea) {
          textarea.style.height = 'auto';
          const newHeight = Math.min(textarea.scrollHeight, 200);
          textarea.style.height = `${newHeight}px`;
      }
  }, [inputValue]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as any);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto relative">
      <form 
        onSubmit={handleSubmit} 
        className={`
            relative flex items-end gap-2 bg-[#f4f4f4] rounded-[26px] px-4 py-3 shadow-sm border border-transparent focus-within:border-gray-300 focus-within:bg-white focus-within:shadow-md transition-all duration-200
            ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}
        `}
      >
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="اسأل محكم..."
          disabled={isLoading}
          rows={1}
          className="flex-1 max-h-[200px] bg-transparent border-none resize-none focus:ring-0 text-gray-800 py-2.5 text-base placeholder:text-gray-400 overflow-y-auto"
        />

        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className={`
            p-2 rounded-full mb-0.5 transition-all duration-200
            ${inputValue.trim() && !isLoading 
                ? 'bg-black text-white hover:bg-gray-800' 
                : 'bg-transparent text-gray-300 cursor-not-allowed'}
          `}
        >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            )}
        </button>
      </form>
      <p className="text-[10px] text-center text-gray-400 mt-2">يمكن لمحكم ارتكاب الأخطاء. يرجى التحقق من المعلومات المهمة.</p>
    </div>
  );
};

export default ChatInput;