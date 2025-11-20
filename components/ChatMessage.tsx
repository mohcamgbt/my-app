import React, { useMemo } from 'react';
import type { Message } from '../types';
import { Role } from '../types';

interface ChatMessageProps {
  message: Message;
  onCitationClick: (docName: string, pageNumbers: number[]) => void;
}

interface ParsedCitation {
    id: number;
    docName: string;
    articleNumbers: number[];
    originalString: string;
}

const arabicWordToNumber: { [key: string]: number } = {
    'الأولى': 1, 'الاولى': 1, 'أولى': 1, 'اولى': 1, 'واحد': 1,
    'الثانية': 2, 'الثانيه': 2, 'ثانية': 2, 'ثانيه': 2, 'اثنان': 2, 'اثنين': 2,
    'الثالثة': 3, 'الثالثه': 3, 'ثالثة': 3, 'ثالثه': 3, 'ثلاثة': 3,
    'الرابعة': 4, 'الرابعه': 4, 'رابعة': 4, 'رابعه': 4, 'أربعة': 4,
    'الخامسة': 5, 'الخامسه': 5, 'خامسة': 5, 'خامسه': 5, 'خمسة': 5,
    'السادسة': 6, 'السادسه': 6, 'سادسة': 6, 'سادسه': 6, 'ستة': 6,
    'السابعة': 7, 'السابعه': 7, 'سابعة': 7, 'سابعه': 7, 'سبعة': 7,
    'الثامنة': 8, 'الثامنه': 8, 'ثامنة': 8, 'ثامنه': 8, 'ثمانية': 8,
    'التاسعة': 9, 'التاسعه': 9, 'تاسعة': 9, 'تاسعه': 9, 'تسعة': 9,
    'العاشرة': 10, 'العاشره': 10, 'عاشرة': 10, 'عاشره': 10, 'عشرة': 10
};

// No User Icon, No Model Label, No User Label

const ModelIcon: React.FC = () => (
    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm border border-emerald-600/10">
         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
    </div>
);

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onCitationClick }) => {
  const isUser = message.role === Role.USER;
  const textContent = message.parts.map(part => part.text).join('');

  const { renderedContent, uniqueCitations } = useMemo(() => {
      if (isUser) return { renderedContent: textContent, uniqueCitations: [] };

      const citationRegex = /\(المصدر\s*:\s*([^,،\-]+?)\s*[,،\-]\s*المادة\s*([^)]+?)\)/g;
      const parts: (string | React.ReactElement)[] = [];
      const foundCitations: ParsedCitation[] = [];
      let lastIndex = 0;
      let match;

      while ((match = citationRegex.exec(textContent)) !== null) {
          if (match.index > lastIndex) {
              parts.push(textContent.substring(lastIndex, match.index));
          }

          const docName = match[1].trim();
          const articlePartRaw = match[2].trim();
          
          let articleNumbers: number[] = [];

          const groups = articlePartRaw.split(/[,،]/);
          groups.forEach(group => {
              const rangeMatch = group.match(/(\d+)\s*[-–]\s*(\d+)/);
              if (rangeMatch) {
                  const start = parseInt(rangeMatch[1]);
                  const end = parseInt(rangeMatch[2]);
                  if (!isNaN(start) && !isNaN(end)) {
                      const min = Math.min(start, end);
                      const max = Math.max(start, end);
                      for (let i = min; i <= max; i++) {
                          articleNumbers.push(i);
                      }
                  }
              } else {
                   const matches = group.match(/\d+/g);
                   if (matches) {
                       matches.forEach(m => articleNumbers.push(parseInt(m)));
                   }
              }
          });

          if (articleNumbers.length === 0) {
              const words = articlePartRaw.split(/[\s,،\-]+/);
              words.forEach(w => {
                  const cleanWord = w.replace(/[^\u0621-\u063A\u0641-\u064A]/g, ''); 
                  if (arabicWordToNumber[cleanWord]) {
                      articleNumbers.push(arabicWordToNumber[cleanWord]);
                  }
              });
          }

          articleNumbers = Array.from(new Set(articleNumbers)).sort((a, b) => a - b);

          if (articleNumbers.length > 0) {
              let citationId: number;
              const existingIndex = foundCitations.findIndex(c => 
                  c.docName === docName && 
                  JSON.stringify(c.articleNumbers) === JSON.stringify(articleNumbers)
              );

              if (existingIndex !== -1) {
                  citationId = foundCitations[existingIndex].id;
              } else {
                  citationId = foundCitations.length + 1;
                  foundCitations.push({
                      id: citationId,
                      docName,
                      articleNumbers,
                      originalString: match[0]
                  });
              }

              parts.push(
                  <sup key={`cit-${match.index}`} className="inline-block mx-0.5 align-top top-0">
                      <button 
                          onClick={() => onCitationClick(docName, articleNumbers)}
                          className="w-4 h-4 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full text-[9px] font-bold transition-colors -mt-1"
                          title={`عرض المصدر: ${docName}، المادة ${articleNumbers.join('، ')}`}
                      >
                          {citationId}
                      </button>
                  </sup>
              );
          } else {
              parts.push(match[0]);
          }

          lastIndex = citationRegex.lastIndex;
      }

      if (lastIndex < textContent.length) {
          parts.push(textContent.substring(lastIndex));
      }

      const finalParts = parts.map((part, index) => {
          if (typeof part !== 'string') return part;
          const boldRegex = /(\*\*.*?\*\*)/g;
          const subParts = part.split(boldRegex);
          return subParts.map((subPart, subIndex) => {
              if (boldRegex.test(subPart)) {
                  return <strong key={`${index}-${subIndex}`} className="font-bold text-gray-900">{subPart.slice(2, -2)}</strong>;
              }
              return <React.Fragment key={`${index}-${subIndex}`}>{subPart}</React.Fragment>;
          });
      });

      return { renderedContent: finalParts, uniqueCitations: foundCitations };

  }, [textContent, isUser, onCitationClick]);

  const aggregatedFooterCitations = useMemo(() => {
      const groupedByDoc: { [docName: string]: { ids: number[], articles: Set<number> } } = {};

      uniqueCitations.forEach(cit => {
          if (!groupedByDoc[cit.docName]) {
              groupedByDoc[cit.docName] = { ids: [], articles: new Set() };
          }
          groupedByDoc[cit.docName].ids.push(cit.id);
          cit.articleNumbers.forEach(num => groupedByDoc[cit.docName].articles.add(num));
      });

      return Object.entries(groupedByDoc).map(([docName, data]) => {
          const sortedArticles = Array.from(data.articles).sort((a, b) => a - b);
          const uniqueIds = Array.from(new Set(data.ids)).sort((a, b) => a - b);
          return {
              docName,
              ids: uniqueIds,
              articleNumbers: sortedArticles
          };
      });
  }, [uniqueCitations]);

  const formatArticleRanges = (numbers: number[]): string => {
      if (numbers.length === 0) return '';
      const ranges: string[] = [];
      let start = numbers[0];
      let prev = numbers[0];

      for (let i = 1; i < numbers.length; i++) {
          if (numbers[i] === prev + 1) {
              prev = numbers[i];
          } else {
              ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
              start = numbers[i];
              prev = numbers[i];
          }
      }
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      return ranges.join('، ');
  };

  return (
    <div className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'} group mb-2`}>
      {/* Only Model Icon, No User Icon */}
      {!isUser && <ModelIcon />}
      
      <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
         {/* Message Content */}
         <div 
            className={`px-5 py-3.5 text-[15px] leading-relaxed whitespace-pre-wrap
            ${isUser 
                ? 'bg-[#f4f4f4] text-gray-900 rounded-3xl' // User: Fully rounded pill shape
                : 'bg-transparent text-gray-800 px-0 py-0' 
            }`}
         >
           {renderedContent}
         </div>

        {!isUser && aggregatedFooterCitations.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
                {aggregatedFooterCitations.map((cit, idx) => (
                    <button 
                        key={idx}
                        onClick={() => onCitationClick(cit.docName, cit.articleNumbers)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-xs text-gray-600 transition-all shadow-sm hover:shadow-md"
                    >
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                            {cit.ids.join(', ')}
                        </span>
                        <span className="truncate max-w-[250px]">
                             {cit.docName}
                        </span>
                    </button>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;