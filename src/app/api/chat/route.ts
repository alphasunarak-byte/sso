import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // If an API key is available, use the AI SDK stream
    if (googleKey || openaiKey) {
      const model = googleKey
        ? google('gemini-2.0-flash-exp')
        : openai('gpt-4o-mini');

      const result = streamText({
        model,
        messages,
      });

      return result.toTextStreamResponse();
    }

    // Default Fallback Simulated Stream (allows testing out-of-the-box without keys)
    const lastUserMessage = messages[messages.length - 1]?.content || 'สวัสดี';
    const responseText = `👋 สวัสดีครับ! ระบบ Next.js 16 (App Router) พร้อม AI SDK ทำงานสมบูรณ์บนพอร์ต 3030 แล้ว 🎉

ข้อความที่คุณส่งมา: "${lastUserMessage}"

⚡ สถานะการเชื่อมต่อ:
• Framework: Next.js 16.4 (Stable)
• Port: 3030
• Vercel AI SDK: ติดตั้งเรียบร้อย
• API Key: ยังไม่ได้ระบุใน .env.local (กำลังทำงานในโหมด Demo Stream)

💡 หากต้องการเชื่อมต่อโมเดลจริง เช่น Google Gemini หรือ OpenAI:
1. สร้างไฟล์ \`.env.local\` ที่โฟลเดอร์หลัก
2. เพิ่มคีย์:
   GOOGLE_GENERATIVE_AI_API_KEY="your-gemini-key"
   หรือ
   OPENAI_API_KEY="your-openai-key"
3. รีสตาร์ท Dev Server แล้วเริ่มใช้งาน AI ได้ทันที!`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const words = responseText.split(' ');
        for (const word of words) {
          controller.enqueue(encoder.encode(word + ' '));
          await new Promise((resolve) => setTimeout(resolve, 35));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error: unknown) {
    console.error('Chat API Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
