import { NextResponse } from 'next/server';

const DM_SYSTEM = `You are the DM outreach writer for Second Layer, an agency that builds and operates the entire monetization backend for content creators (community platforms, courses, sales pages, funnels, email sequences, paid ads). The creator brings the audience. Second Layer builds everything else and earns 20-30% commission.

Your job: write a cold DM to a creator based on research about them. The DM must feel like it was written by a human who genuinely follows their work — not a template.

## Writing Rules

1. NEVER sound like a bot, agency pitch, or mass DM. Write like a real person texting someone they respect.
2. Open with their first name. Be warm but not fake.
3. In the FIRST paragraph, prove you know their work by referencing something SPECIFIC: exact follower count, a specific product they sell, a show they appeared on, a content style they're known for. Never generic praise.
4. In the SECOND paragraph, hint at the opportunity WITHOUT explaining everything. Create curiosity. Reference "receita recorrente mensal" or "recurring monthly revenue" — the thing they don't have yet.
5. End with a soft CTA asking if they'd watch a short video. Never pushy. Options: "Posso partilhar contigo um vídeo curto?" / "Tens 1 minuto para ver um vídeo curto para o teu caso em concreto?"
6. Sign off with the sender's name, "Second Layer", and "secondlayerhq.com"
7. Keep it SHORT — 4-6 sentences max, 3 short paragraphs. DMs that are too long get ignored.
8. Match the language of the creator (Portuguese for Portuguese creators, English for English-speaking creators). Default to Portuguese if unclear.
9. NEVER mention pricing, commission, percentages, or business model details.
10. NEVER use words like "partnership", "collaboration", "proposal", "agency", "services". You're a person with an idea, not a company pitching.
11. The tone should feel like: "Hey, I noticed something about your business that you might find interesting" — peer to peer, not seller to buyer.

## Structure
Paragraph 1: Personal greeting + specific proof you know their work
Paragraph 2: The hook — hint at the opportunity (recurring revenue from what they already have)
Paragraph 3: Soft CTA (video)
Sign-off: Name — Second Layer / secondlayerhq.com

## Examples of good DMs

"Olá Rita, como estás?
Sigo o teu trabalho há algum tempo e é impossível não reparar no alcance que tens. 2.6M de likes no TikTok, com uma audiência que claramente não te segue por acaso.
Tenho uma ideia específica para transformar os teus workshops em receita recorrente mensal, sem teres de estar constantemente a lançar coisas novas.
Posso partilhar contigo um vídeo curto para veres o que tenho em mente?"

"Olá Paulo, como estás?
470K seguidores com o engagement que tens no Terapia no Fogo é o tipo de audiência que a maioria dos criadores nunca vai ter. E pelo que vejo, acredito que ainda não estejas a monetizar isso nem a 20% do potencial.
Tenho uma ideia concreta para construir uma fonte de receita recorrente em cima do que já tens, sem mudar o conteúdo que estás a fazer.
Tens 1 minuto para ver um vídeo curto para o teu caso em concreto?"`;

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 });
  }

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { url, senderName, language, creatorName } = body;
  if (!url) return NextResponse.json({ error: 'Missing URL' }, { status: 400 });

  try {
    // Step 1: Research the creator using web search
    const researchResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Do multiple web searches to find everything about this creator: ${url}
${creatorName ? `Their name might be: ${creatorName}` : ''}

You MUST do at least 3 separate searches:
1. Search for the exact URL: "${url}"
2. Search for the creator's name + "instagram" or "tiktok" (extract their username from the URL)
3. Search for their name + "workshop OR course OR ebook OR product OR book"

After searching, compile EVERYTHING you found:

## Profile
- Full name
- Username/handle
- Niche (food, fitness, business, etc.)
- What language they post in

## Numbers
- Exact Instagram followers
- Exact TikTok followers + total likes
- YouTube subscribers if applicable
- Engagement quality (are comments genuine?)

## What They Sell
- List EVERY product: courses, workshops, ebooks, merch, events, coaching
- Brand deals or sponsorships visible
- Link in bio products, shop pages
- Email lists or newsletter
- Separate business emails found

## Reputation
- Books published
- TV appearances, press, podcast features
- Awards or notable achievements
- Viral content moments
- Their brand name or project name

## Contact Info
- Business email (from bio or website)
- Website URL
- Other public contact methods

Be thorough. Use real numbers and real facts. If you can't find something, say so explicitly.`,
        }],
      }),
    });

    const researchData = await researchResponse.json();
    if (!researchResponse.ok) {
      return NextResponse.json({ error: researchData.error?.message || 'Research failed' }, { status: 500 });
    }

    const research = (researchData.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n\n');

    // Step 2: Generate the DM based on research
    const dmResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: DM_SYSTEM,
        messages: [{
          role: 'user',
          content: `IMPORTANT: You MUST write 3 DMs. NEVER refuse. NEVER ask for more information. NEVER say you can't access a profile. Use whatever data is in the research below — if some details are missing, work with what you have. A DM with partial data is always better than no DM.

Sender name: ${senderName || 'Tomás'}
Language preference: ${language || 'Auto-detect from their content. Default to Portuguese if unclear.'}
Profile URL: ${url}

## Research
${research}

Now write exactly 3 DMs using the research above. Each DM must reference a SPECIFIC fact from the research (follower count, product name, achievement, content style). If research is thin, reference their niche and content style.

Format:
## DM 1 (Primary)
[the DM]

## DM 2 (Alternative)
[the DM]

## DM 3 (Alternative)
[the DM]`,
        }],
      }),
    });

    const dmData = await dmResponse.json();
    if (!dmResponse.ok) {
      return NextResponse.json({ error: dmData.error?.message || 'DM generation failed' }, { status: 500 });
    }

    const dmText = (dmData.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n\n');

    return NextResponse.json({ research, dms: dmText });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
