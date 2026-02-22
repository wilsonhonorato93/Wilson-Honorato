import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function chatWithAI(message: string, context: any) {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    Você é o assistente SoloBiz, um assistente virtual especializado em ajudar autônomos e freelancers a gerirem seus negócios.
    Você tem acesso aos seguintes dados do usuário (em formato JSON):
    ${JSON.stringify(context)}
    
    Responda de forma profissional, amigável e prestativa. 
    Ajude o usuário a analisar seu faturamento, identificar clientes inativos, sugerir lembretes ou dar dicas de gestão.
    Mantenha as respostas concisas e úteis.
    Sempre fale em Português do Brasil.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: message }] }],
      config: {
        systemInstruction,
      },
    });

    return response.text || "Desculpe, não consegui processar sua solicitação agora.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Ocorreu um erro ao falar com a IA. Verifique sua conexão ou tente novamente mais tarde.";
  }
}
