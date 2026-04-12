import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are Saku, the AI assistant for NychIQ — a YouTube Intelligence Platform built for creators in Africa and beyond. You specialize in YouTube algorithm optimization, content strategy, SEO, virality mechanics, monetization, competitive intelligence, and trend prediction. Be concise, actionable, and specific. Use YouTube metrics (CTR, AVD, RPM, CPV, VPH, ER). Keep responses under 300 words unless asked for deep analysis.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    // Build messages with system prompt prepended
    const fullMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ];

    const completion = await zai.chat.completions.create({
      messages: fullMessages,
      thinking: { type: 'disabled' },
    });

    const text = completion.choices?.[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';

    // Simulate streaming by chunking the full response into SSE events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const words = text.split(' ');
        let index = 0;
        const chunkSize = 3; // words per chunk

        const sendChunk = () => {
          if (index < words.length) {
            const chunk = words.slice(index, index + chunkSize).join(' ') + (index + chunkSize < words.length ? ' ' : '');
            const data = JSON.stringify({
              choices: [{ delta: { content: chunk } }],
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            index += chunkSize;
            setTimeout(sendChunk, 15); // Small delay between chunks
          } else {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          }
        };

        sendChunk();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('AI Stream error:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'AI request failed' },
      { status: 500 }
    );
  }
}
