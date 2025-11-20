import React from 'react';
import type { Document } from '../types';

interface DocumentSidebarProps {
    documents: Document[];
    selectedDocuments: string[];
    onSelectionChange: (id: string) => void;
    isLoading: boolean;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const DocumentSidebar: React.FC<DocumentSidebarProps> = ({ documents, selectedDocuments, onSelectionChange, isOpen, setIsOpen }) => {
    
    return (
        <>
            {/* Mobile Toggle - Only visible if sidebar is closed on mobile */}
            {!isOpen && (
                <button 
                    className="md:hidden fixed top-3 right-3 z-50 p-2 bg-white rounded-md shadow-md text-gray-600"
                    onClick={() => setIsOpen(true)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                </button>
            )}

            <aside 
                className={`
                    fixed md:relative z-40 h-full w-[260px] bg-[#F9F9F9] border-l border-gray-200 flex flex-col transition-all duration-300 ease-in-out transform
                    ${isOpen ? 'translate-x-0' : 'translate-x-full md:w-0 md:overflow-hidden md:border-l-0'}
                `}
            >
                <div className="p-3 flex justify-between items-center">
                     <button 
                        onClick={() => setIsOpen(false)} 
                        className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-md transition-colors"
                        title="إخفاء القائمة"
                     >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                     </button>
                </div>
                
                <div className="px-4 pb-2">
                    <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        الأنظمة
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
                    {documents.map((doc) => (
                        <button
                            key={doc.id}
                            onClick={() => onSelectionChange(doc.id)}
                            className={`
                                w-full text-right flex items-center gap-3 p-3 rounded-lg text-sm transition-all group
                                ${selectedDocuments.includes(doc.id) 
                                    ? 'bg-white shadow-sm border border-gray-200 text-gray-900' 
                                    : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'}
                            `}
                        >
                            <div className={`w-4 h-4 flex-shrink-0 transition-colors ${selectedDocuments.includes(doc.id) ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                {selectedDocuments.includes(doc.id) ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>
                                )}
                            </div>
                            <span className="truncate font-medium">{doc.name}</span>
                        </button>
                    ))}
                </div>
            </aside>
            
            {/* Overlay for mobile */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black/20 z-30 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
};

export default DocumentSidebar;