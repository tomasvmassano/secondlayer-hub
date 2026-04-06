import { NextResponse } from 'next/server';

const DM_SYSTEM = `You are the DM outreach writer for Second Layer. You write cold DMs that feel human.

## Key Rules

1. Write like a real person, not a bot or agency. Peer to peer.
2. Open with first name. Warm but not fake.
3. Paragraph 1: Show you appreciate their work. Reference their GENERAL vibe, quality, or niche — NOT hyper-specific details you might get wrong. Compliment the quality of what they do or the result they create. Use hard numbers (followers, likes) ONLY when you're confident they're correct. When in doubt, describe the feeling of their work instead.
4. Paragraph 2: Hint at "receita recorrente" or "recurring revenue" from what they already have. Create curiosity. Don't explain how.
5. Paragraph 3: Soft CTA — ask to watch a short video.
6. Sign off: sender name — Second Layer / secondlayerhq.com
7. Max 4-5 sentences. 3 short paragraphs. Shorter is better.
8. Default to Portuguese unless clearly English-speaking.
9. NEVER mention pricing, commission, %, business model, "partnership", "collaboration", "proposal", "agency", or "services".
10. NEVER mention specific details you're not 100% sure about (like "levas o estúdio a casa" or "desde newborns até idosos"). If unsure, stay broad — describe the quality or emotion of their work instead.
11. NEVER use em dashes (—), en dashes (–), or hyphens (-) as punctuation in the DM text. No "sem mudares nada — do que fazes". Use commas, periods, or just restructure the sentence. Dashes are an AI writing tell.

## GOOD: Broad but genuine
"Reparei no teu trabalho e é raro encontrar alguém tão dedicado a fotografar os momentos mais ternos da vida. O resultado final mostra o cuidado que tens com cada cliente."

## GOOD: Hard numbers when confident
"2.6M de likes no TikTok, com uma audiência que claramente não te segue por acaso."

## BAD: Too specific, might be wrong
"O facto de levares o estúdio até casa das pessoas mostra o cuidado que tens."

## BAD: Uses dashes
"sem mudares nada — do que fazes" (NEVER use dashes)

## Examples (notice: zero dashes in any of them)

"Olá Rita, como estás?
Sigo o teu trabalho há algum tempo e é impossível não reparar no alcance que tens. 2.6M de likes no TikTok, com uma audiência que claramente não te segue por acaso.
Tenho uma ideia específica para transformar os teus workshops em receita recorrente mensal, sem teres de estar constantemente a lançar coisas novas.
Posso partilhar contigo um vídeo curto para veres o que tenho em mente?"

"Olá Sandra, como estás?
Reparei no teu trabalho e é raro encontrar alguém tão dedicado a fotografar os momentos mais ternos da vida. O resultado final mostra o cuidado que tens com cada cliente.
Estive a pensar numa forma de criares uma fonte de receita recorrente usando tudo o que já sabes sobre fotografia de família, sem mudares nada do que fazes atualmente.
Tens 1 minuto para ver um vídeo curto sobre esta ideia?"

"Olá Rui, como estás?
Na minha opinião, o Faz & Come é um dos projetos culinários mais sólidos que existe em Portugal. Mostra que construíste algo com muito mais profundidade do que a maioria dos criadores com o dobro dos seguidores.
Tenho uma ideia para transformar o que já tens numa fonte de receita mensal previsível, sem adicionar trabalho à tua rotina.
Posso partilhar contigo um vídeo curto para veres o que tenho em mente?"`;

export async function POST(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 });
  }

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { url, senderName, language, creatorName, notes } = body;
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
        max_tokens: 2000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Quick search about this creator: ${url}

Find their name, follower counts (Instagram/TikTok/YouTube), what they sell (courses, workshops, products), and what niche they're in. Keep it brief.

IMPORTANT: At the very end, write this exact line with the Instagram follower count as a number:
FOLLOWERS: [number]
Example: FOLLOWERS: 85000`,
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

    // Extract follower count from research and calculate revenue
    const followerMatch = research.match(/FOLLOWERS:\s*([\d,.\s]+)/i);
    let estimatedRevenue = null;
    if (followerMatch) {
      const f = parseInt(followerMatch[1].replace(/[,.\s]/g, ''), 10);
      if (f > 100) {
        const activeClients = Math.round(f * 0.00675);
        const monthly = activeClients * 39; // €39 default WTP mid
        estimatedRevenue = { activeClients, monthly, followers: f };
      }
    }

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
        max_tokens: 4000,
        system: DM_SYSTEM,
        messages: [{
          role: 'user',
          content: `NEVER refuse. NEVER ask for more info. NEVER use dashes as punctuation. Write the FULL outreach sequence below.

Sender: ${senderName || 'Tomás'}
Language: ${language || 'Auto-detect, default Portuguese.'}
URL: ${url}
${notes ? `\nPersonal notes from sender (use naturally where relevant):\n${notes}` : ''}

## Research
${research}

Write the complete 5-touchpoint outreach sequence. Each message must add NEW value. Never repeat the same angle. Every message should feel human, personal, and non-spammy.

## DAY 1 — DM (First Contact)
The opening DM. Personal, short, reference their work broadly. CTA: watch a short video.
[write the DM]

## DAY 1 — EMAIL (Same Day)
Slightly more detailed than the DM. Same angle but expanded. Professional but warm. Include a subject line.
Subject: [subject line]
[write the email body]

## DAY 3 — DM (The Nudge)
MAXIMUM 1-2 sentences. Must feel like a text to a friend. Pick ONE of these approaches:
- Just their name + "?" (e.g. "Rita?")
- A one-liner with a revenue number: ${estimatedRevenue ? `"Fiz umas contas e acredito que consigas chegar aos €${estimatedRevenue.monthly.toLocaleString()}/mês recorrentes com o que já tens. Viste o vídeo?"` : '"Fiz umas contas e o potencial que tens é sério. Viste o vídeo?"'}
- A sticker/meme reference: "[insert relevant meme] + one short line"
[write the DM — MAX 2 sentences]

## DAY 7 — EMAIL (The Proof)
Share a concrete (but anonymous) example: "Um criador com uma audiência parecida com a tua..." with realistic numbers. Don't name anyone. Make it believable. CTA: video or quick call. Include subject line.
Subject: [subject line]
[write the email body]

## DAY 10 — DM (The Soft Close)
MAXIMUM 1-2 sentences. Zero pressure. Pick ONE approach:
- "Se o timing não for o melhor, sem stress. ${loomUrl ? `Deixo aqui o link caso queiras ver: ${loomUrl}` : 'Fica o convite em aberto.'}"
- "Ainda faz sentido falar sobre isto?"
- Reference something recent from their content + soft close
[write the DM — MAX 2 sentences]

## DAY 14 — EMAIL (The Clean Close)
Final email. Respectful close. "Não vou voltar a enviar mensagem." Summarize the opportunity in one sentence. Leave the door open forever. Include subject line.
Subject: [subject line]
[write the email body]`,
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
