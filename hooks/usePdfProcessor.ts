import { useState, useCallback } from 'react';
import type { Document } from '../types';

export const usePdfProcessor = () => {
  const [pdfText, setPdfText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const processPdfs = useCallback(async (documents: Document[]) => {
    if (documents.length === 0) {
      setError("الرجاء تحديد نظام واحد على الأقل للمتابعة.");
      setPdfText(null);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const combinedText = documents.map(doc => {
            const docHeader = `--- بداية النظام: ${doc.name} ---`;
            const docFooter = `--- نهاية النظام: ${doc.name} ---`;
            // Use doc.text directly as it is now a single string
            return `${docHeader}\n\n${doc.text}\n\n${docFooter}`;
        }).join('\n\n');
      setPdfText(combinedText);

    } catch (err) {
      console.error("Failed to process document content:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`فشل في معالجة الأنظمة: ${errorMessage}`);
      setPdfText(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setPdfText(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { pdfText, isLoading, error, processPdfs, reset };
};