import { GoogleGenAI } from "@google/genai";
import type { Message } from '../types';
import { Role } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Changed return type to AsyncGenerator to support streaming
export async function* getChatResponse(pdfText: string, userQuery: string, history: Message[]): AsyncGenerator<string, void, unknown> {
  const model = "gemini-2.5-flash";

  const historyText = history
    .map(message => {
        const prefix = message.role === Role.USER ? "المستخدم" : "المساعد";
        const text = message.parts.map(part => part.text).join('');
        return `${prefix}: ${text}`;
    })
    .join('\n');

  const prompt = `
    أنت "محكم"، مساعد قانوني ذكي ومفيد. مهمتك الإجابة على أسئلة المستخدم بناءً على الأنظمة الرسمية السعودية المتاحة لك فقط.
    
    المصادر المتاحة لك:
    "الأنظمة الرسمية": (المحتوى أدناه).

    المهمة:
    أجب على سؤال المستخدم بناءً على فهمك للنصوص المقدمة لك هنا.
    
    تعليمات الإجابة (المرونة والتقيد):
    1. **كن مفيداً:** حاول الإجابة على السؤال قدر الإمكان. إذا لم تجد نصاً حرفياً، حاول استنباط الإجابة لكن لا تخرج نهائيا عن الأنظمة المتاحة.
    2. **عدم الخروج عن النص (Anti-Hallucination):** لا تذكر معلومات قانونية أو مواد من أنظمة خارجية غير موجودة في النص المقدم لك أدناه. اعتمد فقط على ما هو موجود هنا.
    3. **عدم وجود إجابة:** فقط في حال كان السؤال بعيداً تماماً عن موضوع الأنظمة المتاحة، قل: "لا توجد إجابة على سؤالك في الأنظمة المتاحة حالياً".
    4. لا تتكلم ابدا من غير اقتباس من الأنظمة المتاحة.
    
    قواعد الاقتباس (صارمة جداً):
    1. عند الاستشهاد بمعلومة، يجب ذكر المصدر بالتنسيق: (المصدر: [اسم النظام]، المادة [رقم المادة]).
    2. [اسم النظام] يجب أن يطابق الاسم في ترويسة "--- بداية النظام: ... ---" بدقة. تجنب استخدام تنسيق Markdown داخل اسم النظام.
    3. [رقم المادة] يجب أن يكون رقماً حسابياً حصراً (مثلاً: 1، 5، 50) وليس نصاً. 
       - **مهم جداً:** يمنع منعاً باتاً استخدام الكلمات مثل (المادة الأولى، المادة الخامسة)، استبدلها فوراً بـ (المادة 1، المادة 5).
    4. **تجميع المواد:** إذا كانت الإجابة تعتمد على مواد متتالية، استخدم الشرطة (-) لبيان النطاق (مثال: المادة 1-5). إذا كانت متفرقة، استخدم الفاصلة.

    ---محتوى الأنظمة الرسمية---
    ${pdfText}
    ---نهاية محتوى الأنظمة الرسمية---

    ---سجل الدردشة---
    ${historyText}
    ---نهاية سجل الدردشة---

    سؤال المستخدم: ${userQuery}
  `;

  try {
    // Use generateContentStream for faster perceived response
    const result = await ai.models.generateContentStream({
        model,
        contents: prompt
    });

    for await (const chunk of result) {
        if (chunk.text) {
            yield chunk.text;
        }
    }

  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    // Return the raw error message to the user as requested
    const errorMessage = error instanceof Error ? error.message : String(error);
    yield `حدث خطأ أثناء الاتصال بالمساعد الذكي: ${errorMessage}`;
  }
}
