import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Message, Document } from './types';
import { Role } from './types';
import { getChatResponse } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import DocumentSidebar from './components/DocumentSidebar';
import { DOCUMENTS } from './constants';
import SourceViewerModal from './components/SourceViewerModal';

// Minimalist Processing Status
const ProcessingStatus: React.FC = () => {
    const [step, setStep] = useState(0);
    const steps = [
        "جاري التحليل...",
        "مراجعة الأنظمة...",
        "صياغة الإجابة..."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % steps.length);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fade-in flex items-center gap-2 py-2 px-4 justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400 font-medium">
                {steps[step]}
            </span>
        </div>
    );
};

// Helper function to convert number to Arabic Legal Ordinal string
function toLegalArabicOrdinal(num: number): string {
    const units = ["", "الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة", "السادسة", "السابعة", "الثامنة", "التاسعة"];
    
    if (num >= 1 && num <= 9) return units[num];
    
    if (num === 10) return "العاشرة";
    
    if (num >= 11 && num <= 19) {
        const idx = num - 10;
        const teensList = ["العاشرة", "الحادية عشرة", "الثانية عشرة", "الثالثة عشرة", "الرابعة عشرة", "الخامسة عشرة", "السادسة عشرة", "السابعة عشرة", "الثامنة عشرة", "التاسعة عشرة"];
        return teensList[idx];
    }

    const tens = ["", "العاشرة", "العشرون", "الثلاثون", "الأربعون", "الخمسون", "الستون", "السبعون", "الثمانون", "التسعون"];

    if (num >= 20 && num <= 99) {
        const unit = num % 10;
        const ten = Math.floor(num / 10);
        if (unit === 0) return tens[ten];
        
        let unitStr = units[unit];
        if (unit === 1) unitStr = "الحادية"; 
        
        return `${unitStr} و${tens[ten]}`;
    }

    if (num === 100) return "المائة";
    
    if (num > 100 && num < 200) {
        const remainder = num - 100;
        const remainderStr = toLegalArabicOrdinal(remainder);
        return `${remainderStr} بعد المائة`;
    }

    if (num === 200) return "المائتان";

    if (num > 200 && num < 300) {
        const remainder = num - 200;
        const remainderStr = toLegalArabicOrdinal(remainder);
        return `${remainderStr} بعد المائتين`;
    }

    const hundredsMap: { [key: number]: string } = {
        300: "الثلاثمائة",
        400: "الأربعمائة",
        500: "الخمسمائة",
        600: "الستمائة",
        700: "السبعمائة",
        800: "الثمانمائة",
        900: "التسعمائة"
    };

    if (num >= 300 && num < 1000) {
        const hundreds = Math.floor(num / 100) * 100;
        const remainder = num - hundreds;
        const hundredsStr = hundredsMap[hundreds];
        
        if (remainder === 0) return hundredsStr;
        
        const remainderStr = toLegalArabicOrdinal(remainder);
        return `${remainderStr} بعد ${hundredsStr}`;
    }
    
    return num.toString();
}


const App: React.FC = () => {
  const [documents] = useState<Document[]>(DOCUMENTS);
  const [selectedDocs, setSelectedDocs] = useState<string[]>(() => documents.map(d => d.id));
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [modalData, setModalData] = useState<{ docName: string; content: string[] } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Memoized full document text - Reverted to use this for full context
  const documentText = useMemo(() => {
    if (selectedDocs.length === 0) {
      return null;
    }
    return documents
      .filter(doc => selectedDocs.includes(doc.id))
      .map(doc => {
          const docHeader = `--- بداية النظام: ${doc.name} ---`;
          const docFooter = `--- نهاية النظام: ${doc.name} ---`;
          return `${docHeader}\n\n${doc.text}\n\n${docFooter}`;
      })
      .join('\n\n');
  }, [selectedDocs, documents]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSelectionChange = (id: string) => {
    setSelectedDocs(currentSelection => 
        currentSelection.includes(id)
            ? currentSelection.filter(p => p !== id)
            : [...currentSelection, id]
    );
    setMessages([]);
    setApiError(null);
    setIsThinking(false);
  };
  
  const extractArticleContent = (docText: string, num: number): string | null => {
      const arabicOrdinal = toLegalArabicOrdinal(num);
      const patterns = [
          `المادة\\s+${arabicOrdinal}[:\\s]`,
          `المادة\\s+${num}[:\\s]`,
          `المادة\\s+\\(?${num}\\)?[:\\s]`
      ];

      for (const patternStr of patterns) {
           const regex = new RegExp(`(\\n|^)(${patternStr})([\\s\\S]*?)(?=\\n\\s*المادة|$)`, 'i');
           const match = docText.match(regex);
           if (match) {
               return `${match[2].trim()}\n${match[3].trim()}`;
           }
      }
      return null;
  };

  const handleCitationClick = (docName: string, articleNumbers: number[]) => {
    const cleanDocName = docName.replace(/[*_]/g, '').trim();
    
    let targetDoc = documents.find(d => {
        const name = d.name.trim();
        return name === cleanDocName || name.includes(cleanDocName) || cleanDocName.includes(name);
    });

    if (!targetDoc) {
        targetDoc = documents.find(d => {
            const preamble = d.text.slice(0, 1000);
            return preamble.includes(cleanDocName);
        });
    }

    if (!targetDoc) {
      setModalData({ docName: docName, content: ["عذراً، النظام المطلوب غير موجود في القائمة."] });
      return;
    }

    const finalContentParts: string[] = [];
    const sortedNumbers = [...articleNumbers].sort((a, b) => a - b);

    sortedNumbers.forEach(num => {
        const text = extractArticleContent(targetDoc!.text, num);
        if (text) {
            finalContentParts.push(text);
        }
    });

    if (finalContentParts.length > 0) {
        setModalData({ docName: targetDoc.name, content: finalContentParts });
    } else {
         setModalData({ 
             docName: targetDoc.name, 
             content: [`عذراً، لم نتمكن من استخراج نص المواد (${articleNumbers.join('، ')}) تلقائياً. قد يكون التنسيق مختلفاً.`] 
         });
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    if (selectedDocs.length === 0) {
        setApiError("الرجاء تحديد نظام واحد على الأقل للمتابعة.");
        return;
    }
    
    if (!documentText) {
        setApiError("محتوى النظام غير جاهز، يرجى المحاولة مرة أخرى.");
        return;
    }

    const userMessageId = Date.now().toString();
    const userMessage: Message = { id: userMessageId, role: Role.USER, parts: [{ text }] };
    setMessages((prev) => [...prev, userMessage]);
    
    setIsThinking(true);
    setApiError(null);

    try {
      // Reverted to send full documentText instead of searching
      const stream = getChatResponse(documentText, text, messages);
      
      let isFirstChunk = true;
      const modelMessageId = (Date.now() + 1).toString();
      
      for await (const chunk of stream) {
        if (isFirstChunk) {
            setIsThinking(false);
            setMessages((prev) => [
                ...prev, 
                { id: modelMessageId, role: Role.MODEL, parts: [{ text: chunk }] }
            ]);
            isFirstChunk = false;
        } else {
            setMessages((prev) => {
                const messageIndex = prev.findIndex(msg => msg.id === modelMessageId);
                if (messageIndex === -1) return prev; 

                const newMessages = [...prev];
                const msgToUpdate = newMessages[messageIndex];
                const newParts = [...msgToUpdate.parts];
                newParts[0] = { ...newParts[0], text: newParts[0].text + chunk };
                newMessages[messageIndex] = { ...msgToUpdate, parts: newParts };
                
                return newMessages;
            });
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setApiError(errorMessage); // Display raw error as requested
      setIsThinking(false);
    }
  };
  
  return (
    <div className="flex h-screen bg-white text-gray-800 font-sans overflow-hidden">
        {/* Sidebar */}
        <DocumentSidebar 
          documents={documents}
          selectedDocuments={selectedDocs}
          onSelectionChange={handleSelectionChange}
          isLoading={isThinking}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full relative min-w-0 bg-white">
            {/* Minimal Header */}
            <header className="h-14 flex items-center justify-between px-4 border-b border-gray-100/50">
                <div className="flex items-center gap-3">
                    {/* Toggle Button for Desktop when Sidebar is Closed */}
                    {!isSidebarOpen && (
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                            title="إظهار القائمة"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                        </button>
                    )}
                    <span className="text-lg font-bold text-gray-800">محكم</span>
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">تجريبي</span>
                </div>
            </header>

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                {messages.length > 0 ? (
                    <div className="flex flex-col w-full pb-32 pt-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className="w-full flex justify-center">
                                <div className="w-full max-w-3xl px-4 py-6">
                                    <ChatMessage message={msg} onCitationClick={handleCitationClick} />
                                </div>
                            </div>
                        ))}
                        
                        {isThinking && (
                           <div className="w-full flex justify-center">
                               <div className="w-full max-w-3xl px-4">
                                    <ProcessingStatus />
                               </div>
                           </div>
                        )}

                        {apiError && !isThinking && (
                             <div className="w-full flex justify-center py-4">
                                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">
                                    {apiError}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full px-4 text-center -mt-16 animate-in fade-in duration-500">
                        <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-3xl mb-6 shadow-sm border border-gray-100">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">مرحباً، أنا محكم</h2>
                        <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
                            مساعدك القانوني الذكي. اسألني عن الأنظمة السعودية وسأجيبك بدقة مع الاستشهاد بالمواد النظامية.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                             <button onClick={() => handleSendMessage("ما هي شروط الحضانة في النظام السعودي؟")} className="group p-4 text-right bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-2xl transition-all shadow-sm hover:shadow-md">
                                 <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 block mb-1">الحضانة</span>
                                 <span className="text-xs text-gray-400">"ما هي شروط الحضانة؟"</span>
                             </button>
                             <button onClick={() => handleSendMessage("كيف يتم توزيع الميراث؟")} className="group p-4 text-right bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-2xl transition-all shadow-sm hover:shadow-md">
                                 <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 block mb-1">الميراث</span>
                                 <span className="text-xs text-gray-400">"كيف يتم توزيع الميراث؟"</span>
                             </button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Input Area */}
            <div className="w-full flex justify-center p-4 bg-white pt-2">
                 <ChatInput onSendMessage={handleSendMessage} isLoading={isThinking} />
            </div>
        </div>

        <SourceViewerModal
            isOpen={!!modalData}
            onClose={() => setModalData(null)}
            docName={modalData?.docName || ''}
            content={modalData?.content || []}
        />
    </div>
  );
};

export default App;
