import { I18N } from './i18n.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* =====================================================
   1. CONTACTO
===================================================== */

const CONTACT_EMAIL = 'lehbusiness8@gmail.com';

document.querySelectorAll('[data-email]').forEach((a) => {
  a.textContent = CONTACT_EMAIL;
  a.href = `mailto:${CONTACT_EMAIL}`;
});

document.querySelectorAll('[data-email-link]').forEach((a) => {
  a.href = `mailto:${CONTACT_EMAIL}`;
});


/* =====================================================
   2. ÍCONES DAS TECNOLOGIAS E FERRAMENTAS
===================================================== */

const DEVICON = 'https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/';

const svg = (body) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${body}</svg>`
  )}`;

// Ícones genéricos com iniciais.
// Não representam logótipos oficiais das aplicações.
const badgeSvg = (text, background, foreground = '#ffffff') =>
  svg(`
    <rect x="2" y="2" width="28" height="28" rx="7" fill="${background}"/>
    <text
      x="16"
      y="20"
      text-anchor="middle"
      font-family="Arial, sans-serif"
      font-size="${text.length > 3 ? 8 : text.length > 2 ? 10 : 13}"
      font-weight="700"
      fill="${foreground}"
    >${text}</text>
  `);

const TECH = {

  /* ---------- Programação e desenvolvimento web ---------- */

  python: [
    'Python',
    DEVICON + 'python/python-original.svg'
  ],

  c: [
    'C',
    DEVICON + 'c/c-original.svg'
  ],

  html: [
    'HTML',
    DEVICON + 'html5/html5-original.svg'
  ],

  css: [
    'CSS',
    DEVICON + 'css3/css3-original.svg'
  ],

  sql: [
    'SQL',
    svg(`
      <g fill="none" stroke="#3b82f6" stroke-width="2.4">
        <ellipse cx="16" cy="7" rx="10" ry="4"/>
        <path d="M6 7v18c0 2.2 4.5 4 10 4s10-1.8 10-4V7"/>
        <path d="M6 16c0 2.2 4.5 4 10 4s10-1.8 10-4"/>
      </g>
    `)
  ],

  git: [
    'Git',
    DEVICON + 'git/git-original.svg'
  ],

  github: [
    'GitHub',
    DEVICON + 'github/github-original.svg'
  ],

  vscode: [
    'VS Code',
    DEVICON + 'vscode/vscode-original.svg'
  ],


  /* ---------- Redes e manutenção ---------- */

  redes: [
    'Redes informáticas',
    badgeSvg('NET', '#1769aa')
  ],

  manutencao: [
    'Manutenção de computadores',
    badgeSvg('PC', '#475569')
  ],


  /* ---------- Edição de vídeo ---------- */

  alightmotion: [
    'Alight Motion',
    badgeSvg('AM', '#1768e5')
  ],

  capcut: [
    'CapCut',
    badgeSvg('CC', '#171717')
  ],

  effectcraft: [
    'EffectCraft',
    badgeSvg('EC', '#6d28d9')
  ],


  /* ---------- Motion Design ---------- */

  // Alight Motion e EffectCraft já estão definidos acima.


  /* ---------- Design gráfico ---------- */

  canva: [
    'Canva',
    badgeSvg('C', '#00a9e0')
  ],

  photocraft: [
    'PhotoCraft',
    badgeSvg('P', '#7c3aed')
  ]

};


/* ---------- Gerar os elementos das tecnologias ---------- */

function renderTech(list, withBubble) {
  list.innerHTML = '';

  const keys = list.dataset.tech
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  keys.forEach((key, index) => {
    const [label, src] = TECH[key] ?? [
      key,
      badgeSvg('?', '#64748b')
    ];

    const li = document.createElement('li');
    li.style.setProperty('--i', index);

    const img = document.createElement('img');
    img.className = 'ticon';
    img.src = src;
    img.alt = '';
    img.loading = 'lazy';

    if (withBubble) {
      const bubble = document.createElement('span');
      bubble.className = 'tech-bubble';
      bubble.append(img);
      li.append(bubble);
    } else {
      li.append(img);
    }

    const name = document.createElement('span');
    name.textContent = label;

    li.append(name);
    list.append(li);
  });
}

// Tecnologias da secção principal
document.querySelectorAll('.tech-grid').forEach((ul) => {
  renderTech(ul, true);
});

// Tecnologias dos cartões de projetos
document.querySelectorAll('.ptech').forEach((ul) => {
  renderTech(ul, false);
});


/* =====================================================
   3. VÍDEOS DOS PROJETOS
===================================================== */

const videos = document.querySelectorAll('video[data-autoplay]');

if ('IntersectionObserver' in window) {
  const videoIO = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.play().catch(() => {});
      } else {
        entry.target.pause();
      }
    }
  }, { threshold: 0.4 });

  videos.forEach((video) => videoIO.observe(video));
}


/* =====================================================
   4. ANIMAÇÕES DE ENTRADA
===================================================== */

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');

        if (entry.target.classList.contains('svc-list')) {
          [...entry.target.children].forEach((card) => {
            card.classList.add('in');
          });
        }

        io.unobserve(entry.target);
      }
    }
  }, { threshold: 0.2 });

  document.querySelectorAll('.reveal, .svc-list, .tech-grid')
    .forEach((element) => io.observe(element));
}


/* =====================================================
   5. SERVIÇOS — ACORDEÃO
===================================================== */

const cards = [...document.querySelectorAll('.svc')];

function openCard(card, open = true) {
  cards.forEach((currentCard) => {
    const isOpen = currentCard === card && open;

    currentCard.classList.toggle('open', isOpen);

    const button = currentCard.querySelector('.svc-head');

    if (button) {
      button.setAttribute('aria-expanded', String(isOpen));
    }
  });
}

cards.forEach((card) => {
  const button = card.querySelector('.svc-head');

  if (!button) return;

  // Computador: abrir ao passar o rato.
  card.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'mouse') {
      openCard(card);
    }
  });

  // Telemóvel e teclado: abrir ou fechar ao clicar.
  button.addEventListener('click', () => {
    openCard(card, !card.classList.contains('open'));
  });
});


/* =====================================================
   6. SOBRE — ANIMAÇÃO DAS PALAVRAS
===================================================== */

const about = document.querySelector('.about');
const aboutText = document.querySelector('[data-words]');

let words = [];

function splitWords() {
  if (!aboutText) return;

  const parts = [];

  for (const node of [...aboutText.childNodes]) {

    if (node.nodeType === Node.TEXT_NODE) {
      const textParts = node.textContent.split(/\s+/);

      for (const word of textParts) {
        if (!word) continue;

        const span = document.createElement('span');
        span.className = 'word';
        span.textContent = word;

        parts.push(span, ' ');
      }

    } else if (node.nodeType === Node.ELEMENT_NODE) {
      node.classList.add('word');
      parts.push(node, ' ');
    }
  }

  aboutText.replaceChildren(...parts);

  words = [...aboutText.querySelectorAll('.word')];
}

// Garante o texto mesmo se main.js ainda não tiver aplicado o idioma.
if (aboutText && !aboutText.textContent.trim()) {
  let lang = 'pt';

  try {
    lang = localStorage.getItem('lang') || 'pt';
  } catch {}

  const translations = I18N[lang] || I18N.pt;

  if (translations && translations['about.text']) {
    aboutText.innerHTML = translations['about.text'];
  }
}

splitWords();

// Atualizar a animação quando o idioma mudar.
window.addEventListener('langchange', () => {
  splitWords();
  measureProjects();
  onScroll();
});


/* =====================================================
   7. CARREIRA — LINHA DO TEMPO
===================================================== */

const timeline = document.querySelector('.timeline');
const jobs = [...document.querySelectorAll('.job')];


/* =====================================================
   8. PROJETOS — CARROSSEL HORIZONTAL
===================================================== */

const projects = document.querySelector('.projects');
const track = document.querySelector('.projects-track');

const pcards = track ? [...track.children] : [];

const counter = document.querySelector('[data-counter]');
const total = document.querySelector('[data-total]');

if (total) {
  total.textContent = String(pcards.length).padStart(2, '0');
}

let travel = 0;

function measureProjects() {
  if (!projects || !track) return;

  travel = Math.max(0, track.scrollWidth - window.innerWidth);

  track.classList.toggle('fits', travel === 0);
  projects.classList.toggle('fits', travel === 0);

  projects.style.setProperty(
    '--projects-h',
    `${window.innerHeight + travel}px`
  );
}


/* =====================================================
   9. NAVEGAÇÃO
===================================================== */

const navLinks = [...document.querySelectorAll('.nav a')];

const navTargets = navLinks.map((link) => {
  return document.querySelector(link.getAttribute('href'));
});


/* =====================================================
   10. ANIMAÇÕES DURANTE A ROLAGEM
===================================================== */

function onScroll() {
  const vh = window.innerHeight;

  document.body.classList.toggle(
    'scrolled',
    window.scrollY > 40
  );

  /* ---------- Sobre ---------- */

  if (about && aboutText) {
    const rect = about.getBoundingClientRect();

    const progress = clamp(
      -rect.top / Math.max(1, rect.height - vh),
      0,
      1
    );

    about.style.setProperty(
      '--about-in',
      clamp((vh - rect.top) / vh * 1.4 - 0.4, 0, 1).toFixed(3)
    );

    const lit = Math.round(
      clamp(progress * 1.35, 0, 1) * words.length
    );

    words.forEach((word, index) => {
      word.classList.toggle('lit', index < lit);
    });
  }


  /* ---------- Carreira ---------- */

  if (timeline) {
    const rect = timeline.getBoundingClientRect();

    timeline.style.setProperty(
      '--grow',
      clamp(
        (vh * 0.55 - rect.top) / Math.max(1, rect.height),
        0,
        1
      ).toFixed(3)
    );
  }

  let best = null;
  let bestDist = Infinity;

  for (const job of jobs) {
    const rect = job.getBoundingClientRect();

    const distance = Math.abs(
      rect.top + rect.height / 2 - vh * 0.5
    );

    if (distance < bestDist) {
      bestDist = distance;
      best = job;
    }
  }

  jobs.forEach((job) => {
    job.classList.toggle(
      'active',
      job === best && bestDist < vh * 0.45
    );
  });


  /* ---------- Projetos ---------- */

  if (projects && track && counter) {
    const rect = projects.getBoundingClientRect();

    const progress = clamp(
      -rect.top / Math.max(1, rect.height - vh),
      0,
      1
    );

    track.style.setProperty('--x', (progress * travel).toFixed(1));

    projects.style.setProperty('--p', progress.toFixed(3));

    const current = Math.min(
      pcards.length,
      Math.floor(progress * (pcards.length - 1) + 0.5) + 1
    );

    counter.textContent = String(current).padStart(2, '0');
  }


  /* ---------- Menu ---------- */

  let current = -1;

  navTargets.forEach((section, index) => {
    if (section && section.getBoundingClientRect().top < vh * 0.5) {
      current = index;
    }
  });

  navLinks.forEach((link, index) => {
    link.classList.toggle('active', index === current);
  });
}


/* =====================================================
   11. NAVEGAÇÃO COM ROLAGEM SUAVE
===================================================== */

function navTarget(hash) {
  const vh = window.innerHeight;

  const maxY = document.documentElement.scrollHeight - vh;

  if (hash === '#inicio') return 0;

  if (hash === '#sobre' && about) {
    return about.offsetTop + (about.offsetHeight - vh) * 0.75;
  }

  if (hash === '#contato') {
    return maxY;
  }

  const element = document.querySelector(hash);

  return element
    ? Math.min(
        maxY,
        element.getBoundingClientRect().top + window.scrollY
      )
    : null;
}

const easeInOutCubic = (t) => {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - (-2 * t + 2) ** 3 / 2;
};

let scrollAnim = 0;

function smoothScrollTo(y) {
  cancelAnimationFrame(scrollAnim);

  const startY = window.scrollY;
  const distance = y - startY;

  if (Math.abs(distance) < 2) return;

  const duration = clamp(
    500 + Math.abs(distance) * 0.12,
    700,
    1600
  );

  const startTime = performance.now();

  const step = (now) => {
    const progress = clamp(
      (now - startTime) / duration,
      0,
      1
    );

    window.scrollTo(
      0,
      startY + distance * easeInOutCubic(progress)
    );

    if (progress < 1) {
      scrollAnim = requestAnimationFrame(step);
    }
  };

  scrollAnim = requestAnimationFrame(step);
}

// Se a pessoa interagir durante a animação,
// devolvemos o controlo da rolagem.
for (const eventName of ['wheel', 'touchstart', 'keydown']) {
  window.addEventListener(
    eventName,
    () => cancelAnimationFrame(scrollAnim),
    { passive: true }
  );
}


/* =====================================================
   12. CLIQUES NOS LINKS INTERNOS
===================================================== */

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#"]');

  if (!link) return;

  const hash = link.getAttribute('href');
  const destination = navTarget(hash);

  if (destination == null) return;

  event.preventDefault();

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo(0, destination);
  } else {
    smoothScrollTo(destination);
  }

  history.replaceState(null, '', hash);
});


/* =====================================================
   13. INICIALIZAÇÃO
===================================================== */

measureProjects();

window.addEventListener('scroll', onScroll, {
  passive: true
});

window.addEventListener('resize', () => {
  measureProjects();
  onScroll();
});

onScroll();