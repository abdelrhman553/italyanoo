
import { GoogleGenAI } from "@google/genai";
import { Job } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateProfessionalReport = async (job: Job): Promise<string> => {
  try {
    const prompt = `
      أنت مدير صيانة محترف في مركز "ايطاليانو" (ITALIANO) لصيانة الموتوسيكلات.
      المكان: أول كوبري العمرانية. تواصل: 01225822202.
      أنشئ تقرير فحص فني مفصل للعميل ${job.client.name} عن موتوسيكل ${job.client.model}.
      نوع الخدمة: ${job.serviceType}.
      البيانات: ${JSON.stringify(job.inspection)}
      الملاحظات: ${job.technicianNotes}
      التكلفة: ${job.totalCost} جنيه.
      الأسلوب: احترافي، ودود، إيطالي الطابع.
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "فشل إنشاء التقرير.";
  } catch (error) {
    return "خطأ في الاتصال بالذكاء الاصطناعي.";
  }
};

export const askItalyanoAI = async (userQuery: string, priceConfig: string): Promise<string> => {
  try {
    const prompt = `
      أنت "مساعد ايطاليانو الذكي" (ITALIANO AI Support). 
      مهمتك الرد على استفسارات العملاء عن صيانة الموتوسيكلات في مركز ايطاليانو (أول كوبري العمرانية - 01225822202).
      
      خدمة مميزة: لدينا خدمة "الاستلام والتوصيل" (Pickup & Delivery). إحنا بنبعت ونش أو فني ياخد المكنة من بيت العميل أو شغله، يعملها الصيانة، ويرجعها له مغسولة وجاهزة. شعارنا: "إحنا بنشيل عنك الهم".
      
      قائمة الأسعار والخدمات:
      ${priceConfig}
      
      التعليمات:
      1. كن ودوداً جداً ومرحباً بلهجة مصرية عامية.
      2. إذا سأل العميل عن الأسعار، رد من القائمة.
      3. إذا سأل عن خدمة النقل أو الونش، اشرح له خدمة "الاستلام والتوصيل" بحماس وقوله إنها بتوفر وقته ومجهوده.
      4. مكاننا: أول كوبري العمرانية - الجيزة.
      
      سؤال العميل: ${userQuery}
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "أنا موجود لمساعدتك، اسألني عن أي شيء يخص مكنتك!";
  } catch (error) {
    return "عذراً، واجهت مشكلة تقنية بسيطة. شرفنا في المحل أو تواصل معنا هاتفياً!";
  }
};
