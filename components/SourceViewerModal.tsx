import React, { useEffect, useRef } from 'react';

interface SourceViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    docName: string;
    content: string[];
}

const SourceViewerModal: React.FC<SourceViewerModalProps> = ({ isOpen, onClose, docName, content }) => {
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        if (isOpen && contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    }, [isOpen, content]);

    if (!isOpen) {
        return null;
    }
    
    const getArticleTitle = (text: string) => {
        const firstLine = text.split('\n')[0];
        if (firstLine.includes('المادة')) {
            return firstLine;
        }
        return null;
    };
    
    const getArticleContent = (text: string) => {
        const lines = text.split('\n');
        if (lines.length > 1 && lines[0].includes('المادة')) {
            return lines.slice(1).join('\n').trim();
        }
        return text;
    };

    return (
        <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center p-4 fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <header className="px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0 text-gray-400">
                             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 id="modal-title" className="text-base font-bold text-gray-800 truncate" title={docName}>
                                {docName}
                            </h2>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        aria-label="إغلاق"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </header>

                {/* Content */}
                <main ref={contentRef} className="flex-1 overflow-y-auto p-6 bg-white">
                    <div className="space-y-6" dir="rtl">
                        {content && content.length > 0 ? (
                            content.map((text, index) => {
                                const title = getArticleTitle(text);
                                const articleText = getArticleContent(text);

                                return (
                                <div key={index} className="group">
                                    {title && (
                                        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                                            <span className="w-1 h-5 bg-emerald-500 rounded-full"></span>
                                            {title}
                                        </h3>
                                    )}
                                    <div className="text-gray-600 leading-loose text-[16px] pr-3">
                                        {articleText}
                                    </div>
                                    {index < content.length - 1 && <div className="h-px bg-gray-100 my-6" />}
                                </div>
                            )})
                        ) : (
                            <p className="text-gray-400 text-center py-10">تعذر العثور على النص المحدد.</p>
                        )}
                    </div>
                </main>
                
                <footer className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end">
                     <button 
                        onClick={onClose}
                        className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 font-medium text-sm transition-all"
                    >
                        إغلاق
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SourceViewerModal;