// ============================================
// YVES HELPER — Floating assistant widget
// Include on any page: <script src="/yves-helper.js"></script>
// ============================================
(function() {
  var isOpen = false;
  var messages = [];
  var conversationId = null;

  // Detect current page context
  var page = window.location.pathname.replace(/\//g, '').replace('.html', '') || 'landing';
  var pageContextMap = {
    'landing': 'la page d\'accueil de M3 Style',
    'index': 'la page d\'accueil de M3 Style',
    'dashboard': 'le tableau de bord',
    'profile': 'la page de profil et mensurations',
    'wardrobe': 'la page garde-robe',
    'stylist': 'la page du styliste IA (session complète)',
    'marketplace': 'la page des designers M3',
    'looks': 'la page des looks sauvegardés',
    'admin': 'le panneau d\'administration'
  };
  var pageContext = pageContextMap[page] || 'M3 Style';

  // Quick suggestions per page
  var suggestionsMap = {
    'landing': ['C\'est quoi M3 Style?', 'Comment ça marche?', 'C\'est gratuit?'],
    'index': ['C\'est quoi M3 Style?', 'Comment ça marche?', 'C\'est gratuit?'],
    'dashboard': ['Par où commencer?', 'Comment ajouter des vêtements?', 'Lancer une session styliste'],
    'profile': ['Pourquoi mes mensurations?', 'Comment mesurer?', 'C\'est confidentiel?'],
    'wardrobe': ['Comment ajouter un vêtement?', 'Quoi photographier?', 'Organiser ma garde-robe'],
    'stylist': ['Comment fonctionne le styliste?', 'Quel budget choisir?', 'C\'est quoi Mix & Match?'],
    'marketplace': ['Qui sont les designers?', 'Comment acheter?', 'Voir les nouveautés'],
    'looks': ['Comment sauvegarder un look?', 'Partager un look', 'Retour au styliste']
  };
  var suggestions = suggestionsMap[page] || suggestionsMap['dashboard'];

  function injectStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '#yves-fab { position: fixed; bottom: 24px; right: 24px; z-index: 9999; width: 60px; height: 60px; border-radius: 50%; cursor: pointer; border: 2px solid rgba(139,92,246,0.4); overflow: hidden; box-shadow: 0 4px 24px rgba(139,92,246,0.3); transition: all 0.3s; }',
      '#yves-fab:hover { transform: scale(1.08); box-shadow: 0 4px 32px rgba(139,92,246,0.5); }',
      '#yves-fab img { width: 100%; height: 100%; object-fit: cover; }',
      '#yves-fab .fab-pulse { position: absolute; inset: -4px; border-radius: 50%; border: 2px solid rgba(139,92,246,0.5); animation: yvesPulse 2s infinite; }',
      '@keyframes yvesPulse { 0%,100% { opacity: 0; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }',
      '#yves-panel { position: fixed; bottom: 96px; right: 24px; z-index: 9998; width: 380px; max-height: 500px; background: #0d0d14; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; box-shadow: 0 25px 50px rgba(0,0,0,0.5); display: none; flex-direction: column; overflow: hidden; animation: yvesPanelIn 0.25s ease; }',
      '@keyframes yvesPanelIn { from { opacity: 0; transform: translateY(10px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }',
      '#yves-panel.open { display: flex; }',
      '#yves-panel-header { padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 12px; }',
      '#yves-panel-header img { width: 36px; height: 36px; border-radius: 10px; object-fit: cover; }',
      '#yves-panel-header .name { font-weight: 700; color: white; font-size: 15px; font-family: "Space Grotesk", sans-serif; }',
      '#yves-panel-header .status { font-size: 13px; color: #10b981; }',
      '#yves-panel-header .close-btn { margin-left: auto; color: #6b7280; cursor: pointer; padding: 4px; }',
      '#yves-panel-header .close-btn:hover { color: white; }',
      '#yves-messages { flex: 1; overflow-y: auto; padding: 12px 16px; max-height: 300px; display: flex; flex-direction: column; gap: 10px; }',
      '#yves-messages .yves-msg { background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.12); border-radius: 14px; border-top-left-radius: 4px; padding: 10px 14px; font-size: 15px; color: #cbd5e1; line-height: 1.5; max-width: 90%; }',
      '#yves-messages .user-msg { background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.2); border-radius: 14px; border-top-right-radius: 4px; padding: 10px 14px; font-size: 15px; color: white; align-self: flex-end; max-width: 85%; }',
      '#yves-messages .yves-msg p { margin-bottom: 6px; } #yves-messages .yves-msg p:last-child { margin-bottom: 0; }',
      '.yves-suggestions { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 16px; }',
      '.yves-sug-btn { background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2); border-radius: 20px; padding: 6px 12px; font-size: 15px; color: #a78bfa; cursor: pointer; transition: all 0.2s; font-family: inherit; }',
      '.yves-sug-btn:hover { background: rgba(139,92,246,0.2); color: white; }',
      '#yves-input-area { padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.05); display: flex; gap: 8px; }',
      '#yves-input { flex: 1; background: #05050a; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 10px 14px; color: white; font-size: 15px; font-family: inherit; outline: none; resize: none; }',
      '#yves-input:focus { border-color: rgba(139,92,246,0.4); }',
      '#yves-input::placeholder { color: #4b5563; }',
      '#yves-send { background: linear-gradient(135deg, #8b5cf6, #7c3aed); border: none; border-radius: 10px; width: 38px; height: 38px; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }',
      '#yves-send:hover { box-shadow: 0 4px 16px rgba(139,92,246,0.4); }',
      '#yves-send:disabled { opacity: 0.4; cursor: not-allowed; }',
      '.yves-typing { display: flex; gap: 4px; padding: 10px 14px; }',
      '.yves-typing span { width: 6px; height: 6px; background: #8b5cf6; border-radius: 50%; animation: yvesTypeDot 1.2s infinite; }',
      '.yves-typing span:nth-child(2) { animation-delay: 0.2s; }',
      '.yves-typing span:nth-child(3) { animation-delay: 0.4s; }',
      '@keyframes yvesTypeDot { 0%,60% { opacity: 0.3; } 30% { opacity: 1; } }',
      '@media (max-width: 440px) { #yves-panel { right: 8px; left: 8px; width: auto; bottom: 88px; } }'
    ].join('\n');
    document.head.appendChild(style);
  }

  function injectHTML() {
    // Floating button
    var fab = document.createElement('div');
    fab.id = 'yves-fab';
    fab.innerHTML = '<img src="/yves-avatar.png" alt="Yves"><div class="fab-pulse"></div>';
    fab.onclick = togglePanel;
    document.body.appendChild(fab);

    // Panel
    var panel = document.createElement('div');
    panel.id = 'yves-panel';
    panel.innerHTML = [
      '<div id="yves-panel-header">',
      '  <img src="/yves-avatar.png" alt="Yves">',
      '  <div><div class="name">Yves</div><div class="status">● En ligne</div></div>',
      '  <div class="close-btn" onclick="document.getElementById(\'yves-panel\').classList.remove(\'open\')">&times;</div>',
      '</div>',
      '<div id="yves-messages"></div>',
      '<div class="yves-suggestions" id="yves-suggestions"></div>',
      '<div id="yves-input-area">',
      '  <input id="yves-input" placeholder="Demandez à Yves..." onkeydown="if(event.key===\'Enter\'){event.preventDefault();document.getElementById(\'yves-send\').click();}">',
      '  <button id="yves-send" onclick="window._yvesSend()">&#x27A4;</button>',
      '</div>'
    ].join('');
    document.body.appendChild(panel);

    // Show welcome + suggestions
    showWelcome();
    renderSuggestions();
  }

  function showWelcome() {
    var welcomeMap = {
      'landing': 'Salut! Je suis Yves. Tu veux en savoir plus sur M3 Style ou tu es prêt à commencer?',
      'index': 'Salut! Je suis Yves. Tu veux en savoir plus sur M3 Style ou tu es prêt à commencer?',
      'dashboard': 'Hey! Content de te voir. Par où veux-tu commencer? Je peux te guider.',
      'profile': 'Ici tu entres tes mensurations. Ça me permet de te faire des recommandations sur mesure. Besoin d\'aide?',
      'wardrobe': 'C\'est ici que tu photographies tes vêtements. Plus j\'en connais sur ta garde-robe, meilleures seront mes suggestions!',
      'stylist': 'Prêt pour une session? Décris-moi l\'occasion et ton budget, je m\'occupe du reste!',
      'marketplace': 'Voici les designers M3. Des créateurs montréalais triés sur le volet. Tu cherches quelque chose en particulier?',
      'looks': 'Tes looks sauvegardés sont ici. Tu veux qu\'on en crée un nouveau?'
    };
    var msg = welcomeMap[page] || welcomeMap['dashboard'];
    addYvesMessage(msg);
  }

  function renderSuggestions() {
    var container = document.getElementById('yves-suggestions');
    if (!container) return;
    container.innerHTML = '';
    suggestions.forEach(function(s) {
      var btn = document.createElement('button');
      btn.className = 'yves-sug-btn';
      btn.textContent = s;
      btn.onclick = function() { sendMessage(s); };
      container.appendChild(btn);
    });
  }

  function togglePanel() {
    var panel = document.getElementById('yves-panel');
    isOpen = !isOpen;
    if (isOpen) { panel.classList.add('open'); } else { panel.classList.remove('open'); }
  }

  function addYvesMessage(text) {
    var container = document.getElementById('yves-messages');
    if (!container) return;
    // Format: strip markdown, create paragraphs
    var formatted = text.replace(/^#{1,4}\s+/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#e2e8f0;font-weight:600">$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/^[\-•]\s+/gm, '→ ');
    var paragraphs = formatted.split(/\n{2,}/);
    var html = paragraphs.map(function(p) {
      p = p.trim();
      if (!p) return '';
      p = p.replace(/\n/g, '<br>');
      return '<p>' + p + '</p>';
    }).filter(Boolean).join('');

    var div = document.createElement('div');
    div.className = 'yves-msg';
    div.innerHTML = html;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    messages.push({ role: 'assistant', content: text });
  }

  function addUserMessage(text) {
    var container = document.getElementById('yves-messages');
    if (!container) return;
    var div = document.createElement('div');
    div.className = 'user-msg';
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    messages.push({ role: 'user', content: text });
  }

  function showTyping() {
    var container = document.getElementById('yves-messages');
    var div = document.createElement('div');
    div.className = 'yves-msg';
    div.id = 'yves-typing-indicator';
    div.innerHTML = '<div class="yves-typing"><span></span><span></span><span></span></div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function hideTyping() {
    var el = document.getElementById('yves-typing-indicator');
    if (el) el.remove();
  }

  function sendMessage(text) {
    if (!text.trim()) return;

    // Hide suggestions after first real message
    var sugContainer = document.getElementById('yves-suggestions');
    if (sugContainer) sugContainer.style.display = 'none';

    addUserMessage(text);
    document.getElementById('yves-input').value = '';
    document.getElementById('yves-send').disabled = true;
    showTyping();

    var token = localStorage.getItem('auth_token');

    // Build context-aware message
    var contextMsg = 'L\'utilisateur est actuellement sur ' + pageContext + '. Sa question: ' + text;

    fetch('/api/stylist/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? 'Bearer ' + token : ''
      },
      body: JSON.stringify({
        message: contextMsg,
        occasion: 'aide-navigation',
        budget_min: 0,
        budget_max: 0
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      hideTyping();
      if (data.response) {
        addYvesMessage(data.response);
        if (data.conversation_id) conversationId = data.conversation_id;
      } else {
        addYvesMessage('Désolé, j\'ai un petit problème technique. Réessaie dans un moment!');
      }
    })
    .catch(function(err) {
      hideTyping();
      addYvesMessage('Hmm, je n\'arrive pas à me connecter. Vérifie ta connexion et réessaie!');
    })
    .finally(function() {
      document.getElementById('yves-send').disabled = false;
    });
  }

  // Expose send function globally
  window._yvesSend = function() {
    var input = document.getElementById('yves-input');
    sendMessage(input.value);
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { injectStyles(); injectHTML(); });
  } else {
    injectStyles();
    injectHTML();
  }
})();
