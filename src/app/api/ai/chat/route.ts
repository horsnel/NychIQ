import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are Saku, the AI assistant for NychIQ — a YouTube Intelligence Platform. You help YouTube creators with:
- Content strategy and viral prediction
- SEO optimization (titles, descriptions, tags)
- Trend analysis and niche discovery
- Channel growth tips and monetization advice
- Competitor analysis insights
- Thumbnail and hook optimization

Be concise, actionable, and specific. Use data and examples when possible. Keep responses under 200 words unless asked for detailed analysis. Use a friendly, expert tone.`;

export async function POST(req: NextRequest) {
  try {
    const { prompt, systemPrompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const messages = [
      { role: 'assistant' as const, content: systemPrompt || SYSTEM_PROMPT },
      { role: 'user' as const, content: prompt },
    ];

    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
    });

    const text = completion.choices?.[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error('AI Chat error:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'AI request failed' },
      { status: 500 }
    );
  }
}
