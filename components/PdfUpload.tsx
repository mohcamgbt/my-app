import React, { useRef, useState } from 'react';
import type { Document } from '../types';

declare const pdfjsLib: any;
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js`;

interface PdfUploadProps {
    onFilesAdded: (newFiles: Document[]) => void;
    isLoading: boolean;
}

const PdfUpload: React.FC<PdfUploadProps> = ({ onFilesAdded, isLoading }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setIsProcessing(true);
        try {
            const newDocuments = await Promise.all(
                Array.from(files).map(async (file): Promise<Document> => {
                    const pdfData = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
                    
                    let fullText = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map((item: any) => item.str).join(' ');
                        fullText += `\n-- صفحة ${i} --\n${pageText}\n`; 
                    }
                    
                    return {
                        id: `${file.name}-${file.lastModified}`,
                        name: file.name,
                        text: fullText,
                    };
                })
            );
            onFilesAdded(newDocuments);
        } catch (error) {
            console.error("Error processing uploaded PDFs:", error);
        } finally {
            setIsProcessing(false);
            if(fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf"
                multiple
                className="hidden"
                disabled={isLoading || isProcessing}
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isProcessing}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
            >
                {isProcessing ? (
                    <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                )}
                <span>رفع ملف جديد</span>
            </button>
        </>
    );
};

export default PdfUpload;