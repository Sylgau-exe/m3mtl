import { getSQL } from '../../lib/db.js';
const sql = getSQL();
import { getUserFromRequest, cors } from '../../lib/auth.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const decoded = getUserFromRequest(req);
  if (!decoded) return res.status(401).json({ error: 'Auth required' });
  const userId = decoded.userId;

  // GET - list conversations or get messages
  if (req.method === 'GET') {
    const { conversation_id } = req.query;
    try {
      if (conversation_id) {
        // Get messages for a conversation
        const conv = await sql`
          SELECT * FROM stylist_conversations WHERE id = ${conversation_id} AND user_id = ${userId}
        `;
        if (conv.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        
        const messages = await sql`
          SELECT * FROM stylist_messages WHERE conversation_id = ${conversation_id} ORDER BY created_at ASC
        `;
        return res.status(200).json({ conversation: conv.rows[0], messages: messages.rows });
      } else {
        // List conversations
        const convs = await sql`
          SELECT * FROM stylist_conversations WHERE user_id = ${userId} ORDER BY updated_at DESC LIMIT 20
        `;
        return res.status(200).json({ conversations: convs.rows });
      }
    } catch (error) {
      console.error('Get stylist error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  // POST - send message to stylist
  if (req.method === 'POST') {
    try {
      const { conversation_id, message, occasion, budget_min, budget_max } = req.body;
      if (!message) return res.status(400).json({ error: 'Message required' });

      let convId = conversation_id;

      // Create new conversation if needed
      if (!convId) {
        const conv = await sql`
          INSERT INTO stylist_conversations (user_id, title, occasion, budget_min, budget_max)
          VALUES (${userId}, ${occasion || 'Nouveau look'}, ${occasion || null}, ${budget_min || null}, ${budget_max || null})
          RETURNING *
        `;
        convId = conv.rows[0].id;
      }

      // Save user message
      await sql`
        INSERT INTO stylist_messages (conversation_id, role, content)
        VALUES (${convId}, 'user', ${message})
      `;

      // Get user profile and wardrobe for context
      let profile = null, wardrobeItems = [];
      try {
        const p = await sql`SELECT * FROM user_profiles WHERE user_id = ${userId}`;
        profile = p.rows[0] || null;
      } catch(e) {}
      try {
        const w = await sql`SELECT name, category, subcategory, color_primary, pattern, material, brand, size, fit, season, occasion FROM wardrobe_items WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 50`;
        wardrobeItems = w.rows;
      } catch(e) {}

      // Get conversation history
      const history = await sql`
        SELECT role, content FROM stylist_messages 
        WHERE conversation_id = ${convId} 
        ORDER BY created_at ASC LIMIT 20
      `;

      // Build system prompt
      const systemPrompt = buildStylistPrompt(profile, wardrobeItems, occasion, budget_min, budget_max);

      // Call Claude API
      const apiMessages = history.rows.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }));

      const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
      if (!ANTHROPIC_API_KEY) {
        // Fallback if no API key - return placeholder response
        const fallbackResponse = "Je suis votre styliste IA M3 Style. Pour activer les recommandations personnalisées, la clé API Anthropic doit être configurée. En attendant, explorez les collections de nos designers dans le marketplace!";
        await sql`
          INSERT INTO stylist_messages (conversation_id, role, content)
          VALUES (${convId}, 'assistant', ${fallbackResponse})
        `;
        return res.status(200).json({ conversation_id: convId, response: fallbackResponse });
      }

      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          system: systemPrompt,
          messages: apiMessages
        })
      });

      const claudeData = await claudeRes.json();
      const assistantMessage = claudeData.content?.[0]?.text || "Désolé, je n'ai pas pu générer une réponse. Réessayez.";

      // Save assistant message
      await sql`
        INSERT INTO stylist_messages (conversation_id, role, content)
        VALUES (${convId}, 'assistant', ${assistantMessage})
      `;

      // Update conversation timestamp
      await sql`UPDATE stylist_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ${convId}`;

      return res.status(200).json({ conversation_id: convId, response: assistantMessage });
    } catch (error) {
      console.error('Stylist chat error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

function buildStylistPrompt(profile, wardrobeItems, occasion, budgetMin, budgetMax) {
  let prompt = `Tu es Yves Ulysse, le styliste personnel IA de M3 Style. Né en Haïti, tu es arrivé au Canada en 1979 et tu t'es installé à Montréal, qui est devenue un terreau fertile pour ta créativité. Tu es le fondateur de Maison M3 et de l'événement annuel M3 / Mode Masculine Montréal. Tu es une figure incontournable de la scène mode et événementielle montréalaise.

Ta personnalité est chaleureuse, confiante, avec un brin d'humour. Tu tutoies naturellement tes clients. Tu parles en français québécois professionnel — jamais guindé, toujours authentique et bienveillant. Tu adores aider les hommes à se sentir bien dans leur peau.

RÈGLES DE FORMATAGE (TRÈS IMPORTANT):
- N'utilise JAMAIS de markdown: pas de #, ##, ###, pas de **, pas de *, pas de tirets pour les listes
- Structure tes réponses en paragraphes clairs et naturels, comme une vraie conversation
- Pour séparer les sections, utilise simplement une ligne vide entre les paragraphes
- Pour les listes, écris des phrases complètes séparées par des lignes vides
- Pour les prix, intègre-les naturellement dans le texte
- Écris comme si tu parlais en personne à ton client dans ta boutique

TON RÔLE:
- Aider les hommes à créer des looks complets et cohérents pour toutes les occasions
- TOUJOURS commencer par les pièces que l'homme possède déjà dans sa garde-robe
- Combler les manques avec des recommandations de designers (ne pas inventer de produits spécifiques, mais décrire le type de pièce idéale)
- Respecter le budget indiqué
- Expliquer POURQUOI chaque pièce fonctionne (couleurs, proportions, occasion)
- Être honnête — si quelque chose ne fonctionne pas, le dire avec tact

APPROCHE MIX & MATCH:
1. D'abord, identifie les pièces pertinentes dans la garde-robe existante
2. Ensuite, propose ce qui manque pour compléter le look
3. Explique comment assembler le tout
4. Donne des alternatives à différents prix si possible`;

  if (profile) {
    prompt += `\n\nPROFIL DU CLIENT:`;
    if (profile.height_cm) prompt += `\n- Taille: ${profile.height_cm} cm`;
    if (profile.weight_kg) prompt += `\n- Poids: ${profile.weight_kg} kg`;
    if (profile.chest_cm) prompt += `\n- Poitrine: ${profile.chest_cm} cm`;
    if (profile.waist_cm) prompt += `\n- Tour de taille: ${profile.waist_cm} cm`;
    if (profile.shoulder_cm) prompt += `\n- Épaules: ${profile.shoulder_cm} cm`;
    if (profile.inseam_cm) prompt += `\n- Entrejambe: ${profile.inseam_cm} cm`;
    if (profile.shoe_size) prompt += `\n- Pointure: ${profile.shoe_size} ${profile.shoe_system || 'US'}`;
    if (profile.body_type) prompt += `\n- Morphologie: ${profile.body_type}`;
    if (profile.preferred_fit) prompt += `\n- Coupe préférée: ${profile.preferred_fit}`;
    if (profile.style_preferences?.length) prompt += `\n- Style: ${profile.style_preferences.join(', ')}`;
    if (profile.preferred_colors?.length) prompt += `\n- Couleurs préférées: ${profile.preferred_colors.join(', ')}`;
    if (profile.avoid_colors?.length) prompt += `\n- Couleurs à éviter: ${profile.avoid_colors.join(', ')}`;
  }

  if (wardrobeItems.length > 0) {
    prompt += `\n\nGARDE-ROBE EXISTANTE (${wardrobeItems.length} articles):`;
    wardrobeItems.forEach((item, i) => {
      const parts = [item.name || item.category, item.color_primary, item.brand, item.material].filter(Boolean);
      prompt += `\n${i + 1}. ${parts.join(' — ')} [${item.category}${item.subcategory ? '/' + item.subcategory : ''}]`;
    });
  } else {
    prompt += `\n\nGARDE-ROBE: Le client n'a pas encore ajouté d'articles. Propose un look complet avec des recommandations générales.`;
  }

  if (budgetMin || budgetMax) {
    prompt += `\n\nBUDGET: ${budgetMin || 0}$ - ${budgetMax || 'illimité'}$ CAD`;
  }

  if (occasion) {
    prompt += `\n\nOCCASION: ${occasion}`;
  }

  return prompt;
}
