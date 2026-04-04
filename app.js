// ===== YOUR DICTIONARY - app.js =====

const API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

const WORDS_OF_DAY = [
  { word: 'serendipity', phonetic: '/ˌserənˈdɪpɪti/', def: 'The occurrence of finding pleasant or useful things by chance.' },
  { word: 'ephemeral', phonetic: '/ɪˈfem(ə)r(ə)l/', def: 'Lasting for a very short time; transitory.' },
  { word: 'melancholy', phonetic: '/ˈmelənkɒli/', def: 'A feeling of pensive sadness, typically with no obvious cause.' },
  { word: 'eloquent', phonetic: '/ˈeləkwənt/', def: 'Fluent or persuasive in speaking or writing.' },
  { word: 'perseverance', phonetic: '/ˌpɜːsɪˈvɪərəns/', def: 'Continued effort to do or achieve something despite difficulty or failure.' },
  { word: 'luminous', phonetic: '/ˈluːmɪnəs/', def: 'Full of or shedding light; bright or shining, especially in the dark.' },
  { word: 'wanderlust', phonetic: '/ˈwɒndəlʌst/', def: 'A strong desire to travel and explore the world.' },
];

let currentWord = null;
let recentSearches = JSON.parse(localStorage.getItem('yd_recent') || '[]');
let favorites = JSON.parse(localStorage.getItem('yd_favorites') || '[]');

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadWordOfDay();
  loadRecent();
  setupSearch();
  setupCategories();
  setupMobileMenu();

  // Auto-search from URL param (e.g. ?q=word)
  const params = new URLSearchParams(location.search);
  const q = params.get('q');
  if (q) searchWord(q);
});

// ===== MOBILE MENU =====
function setupMobileMenu() {
  const btn = document.getElementById('menuBtn');
  const nav = document.getElementById('mobileNav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => nav.classList.toggle('open'));
}

// ===== WORD OF THE DAY =====
function loadWordOfDay() {
  const card = document.getElementById('wodCard');
  if (!card) return;
  const today = new Date();
  const idx = (today.getDate() + today.getMonth()) % WORDS_OF_DAY.length;
  const w = WORDS_OF_DAY[idx];
  card.innerHTML = `
    <div class="wod-inner">
      <div class="wod-label">✦ Word of the Day</div>
      <div class="wod-word">${w.word}</div>
      <div class="wod-phonetic">${w.phonetic}</div>
      <div class="wod-def">${w.def}</div>
    </div>
    <button class="wod-search-btn" onclick="searchWord('${w.word}')">Look it up →</button>
  `;
}

// ===== SEARCH SETUP =====
function setupSearch() {
  const input = document.getElementById('heroInput');
  const btn = document.getElementById('heroBtn');
  const sugBox = document.getElementById('suggestions');

  if (btn) btn.addEventListener('click', () => searchWord(input?.value?.trim()));
  if (input) {
    input.addEventListener('keydown', e => { if (e.key === 'Enter') searchWord(input.value.trim()); });
    input.addEventListener('input', () => showSuggestions(input.value.trim(), sugBox));
    input.addEventListener('blur', () => setTimeout(() => { if (sugBox) sugBox.innerHTML = ''; }, 200));
  }
}

const POPULAR = ['beautiful', 'love', 'happy', 'dream', 'peace', 'wisdom', 'courage', 'hope', 'journey', 'passion', 'friend', 'nature', 'freedom', 'success', 'inspire'];

function showSuggestions(q, box) {
  if (!box) return;
  if (!q || q.length < 2) { box.innerHTML = ''; return; }
  const matches = POPULAR.filter(w => w.startsWith(q.toLowerCase())).slice(0, 5);
  if (!matches.length) { box.innerHTML = ''; return; }
  box.innerHTML = matches.map(w => `
    <div class="suggestion-item" onclick="searchWord('${w}')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>
      ${w}
    </div>
  `).join('');
}

// ===== SEARCH WORD =====
async function searchWord(word) {
  if (!word) return;
  word = word.toLowerCase().trim();

  const sugBox = document.getElementById('suggestions');
  if (sugBox) sugBox.innerHTML = '';
  const input = document.getElementById('heroInput');
  if (input) input.value = word;

  const section = document.getElementById('resultsSection');
  const content = document.getElementById('resultsContent');
  const wodSection = document.getElementById('wodSection');

  if (section) section.style.display = 'block';
  if (wodSection) wodSection.style.display = 'none';
  if (content) content.innerHTML = `<div class="loading-state"><div class="spinner"></div><p style="color:var(--text-light);font-weight:600;">Looking up <em>${word}</em>...</p></div>`;

  section?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  try {
    const res = await fetch(API_BASE + encodeURIComponent(word));
    if (!res.ok) throw new Error('Not found');
    const data = await res.json();
    currentWord = word;
    addToRecent(word);
    renderResult(data, content);
  } catch {
    renderNotFound(word, content);
  }
}

// ===== RENDER RESULT =====
function renderResult(data, container) {
  if (!container) return;
  const entry = data[0];
  const isFav = favorites.includes(entry.word);

  let meaningsHTML = '';
  for (const meaning of entry.meanings) {
    const defs = meaning.definitions.slice(0, 4);
    meaningsHTML += `
      <div class="meaning-group">
        <span class="pos-badge">${meaning.partOfSpeech}</span>
        <div>
          ${defs.map((d, i) => `
            <div class="definition-item">
              <span class="def-num">${i + 1}.</span>
              <span class="def-text">${d.definition}</span>
              ${d.example ? `<div class="def-example">"${d.example}"</div>` : ''}
            </div>
          `).join('')}
        </div>
        ${meaning.synonyms && meaning.synonyms.length ? `
          <div class="synonyms-section">
            <div class="synonyms-label">Synonyms</div>
            <div class="synonyms-chips">
              ${meaning.synonyms.slice(0, 8).map(s => `<span class="chip" onclick="searchWord('${s}')">${s}</span>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  const phonetic = entry.phonetics?.find(p => p.text)?.text || entry.phonetic || '';
  const audioUrl = entry.phonetics?.find(p => p.audio)?.audio || '';

  container.innerHTML = `
    <div class="word-card">
      <div class="word-header">
        <div class="word-title-group">
          <div class="word-main">${entry.word}</div>
          ${phonetic ? `<div class="word-phonetic">${phonetic}</div>` : ''}
        </div>
        <div class="word-actions">
          ${audioUrl ? `
            <button class="btn-icon" onclick="playAudio('${audioUrl}')" title="Pronounce">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              </svg>
            </button>
          ` : ''}
          <button class="btn-icon ${isFav ? 'favorited' : ''}" id="favBtn" onclick="toggleFavorite('${entry.word}')" title="Favorite">
            <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="word-body">
        <div class="meanings-list">${meaningsHTML}</div>
      </div>
    </div>
  `;
}

function renderNotFound(word, container) {
  if (!container) return;
  container.innerHTML = `
    <div class="no-result">
      <div class="no-result-emoji">🔍</div>
      <h3>No results for "${word}"</h3>
      <p>Check the spelling, or try a different word.</p>
    </div>
  `;
}

// ===== AUDIO =====
function playAudio(url) {
  if (!url) return;
  const a = new Audio(url);
  a.play().catch(() => {});
}

// ===== FAVORITES =====
function toggleFavorite(word) {
  const idx = favorites.indexOf(word);
  if (idx === -1) favorites.push(word);
  else favorites.splice(idx, 1);
  localStorage.setItem('yd_favorites', JSON.stringify(favorites));

  const btn = document.getElementById('favBtn');
  if (btn) {
    const isFav = favorites.includes(word);
    btn.classList.toggle('favorited', isFav);
    btn.querySelector('path').setAttribute('fill', isFav ? 'currentColor' : 'none');
  }
}

// ===== RECENT =====
function addToRecent(word) {
  recentSearches = [word, ...recentSearches.filter(w => w !== word)].slice(0, 10);
  localStorage.setItem('yd_recent', JSON.stringify(recentSearches));
  loadRecent();
}

function loadRecent() {
  const section = document.getElementById('recentSection');
  const list = document.getElementById('recentList');
  if (!section || !list) return;
  if (!recentSearches.length) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  list.innerHTML = recentSearches.map(w => `<span class="recent-chip" onclick="searchWord('${w}')">${w}</span>`).join('');
}

// ===== CATEGORIES =====
function setupCategories() {
  document.querySelectorAll('.cat-card').forEach(card => {
    card.addEventListener('click', () => {
      const word = card.dataset.word;
      if (word) searchWord(word);
    });
  });
}
