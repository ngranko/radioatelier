/* Shared mock scaffolding: data, icons, faux map + top bar, and the
   light/dark + phone/desktop chrome. Mock-only — not part of the app. */

const ICON = {
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    sliders:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    chevron:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>',
    rotate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/></svg>',
};

/* category colors map to --cat-* tokens in shared.css */
const CATEGORIES = [
    {id: 'sign', name: 'Вывески', c: 'var(--cat-7)', n: 42},
    {id: 'mosaic', name: 'Мозаики', c: 'var(--cat-2)', n: 18},
    {id: 'plaque', name: 'Таблички', c: 'var(--cat-3)', n: 27},
    {id: 'relief', name: 'Барельефы', c: 'var(--cat-4)', n: 15},
    {id: 'graffiti', name: 'Граффити', c: 'var(--cat-5)', n: 21},
    {id: 'manhole', name: 'Люки', c: 'var(--cat-6)', n: 9},
    {id: 'stained', name: 'Витражи', c: 'var(--cat-1)', n: 5},
];

const TAGS = [
    'советское',
    'модерн',
    'конструктивизм',
    'кириллица',
    'металл',
    'керамика',
    'дореволюционное',
    'неон',
    'утрачено',
];

const PRIVATE_TAGS = ['надо снять заново', 'под угрозой сноса', 'мой район', 'избранное'];

const TOTAL = 137;

/* place pins on the faux map, colored by category */
function renderPins(root) {
    const spots = [
        [22, 28, 0], [38, 18, 1], [55, 34, 2], [70, 22, 3], [83, 40, 4],
        [18, 55, 5], [33, 64, 6], [48, 52, 0], [62, 70, 1], [77, 60, 2],
        [27, 80, 3], [44, 86, 4], [60, 88, 5], [73, 80, 6], [88, 72, 0],
        [12, 38, 1], [90, 20, 2], [50, 14, 3],
    ];
    const map = root.querySelector('.map');
    spots.forEach(([x, y, ci], i) => {
        const cat = CATEGORIES[ci % CATEGORIES.length];
        const pin = document.createElement('div');
        pin.className = 'pin';
        pin.dataset.cat = cat.id;
        pin.style.setProperty('--pin', cat.c);
        pin.style.left = x + '%';
        pin.style.top = y + '%';
        pin.innerHTML = ICON.map;
        map.appendChild(pin);
    });
}

/* dim pins whose category isn't in the active set (empty set = show all) */
function applyPinFilter(activeCats) {
    const show = !activeCats || activeCats.size === 0;
    document.querySelectorAll('.pin').forEach(p => {
        p.classList.toggle('dim', !show && !activeCats.has(p.dataset.cat));
    });
}

/* build map + top bar + mock chrome into <body>; returns the stage element */
function buildScaffold({title}) {
    const stage = document.createElement('div');
    stage.className = 'stage';
    stage.innerHTML = `
        <div class="map"></div>
        <div class="topbar">
            <div class="searchpill">
                <span class="sicon">${ICON.search}</span>
                <input placeholder="Искать..." />
            </div>
            <button class="avatar glass" aria-label="Меню">🥷</button>
        </div>
        <div class="layer"></div>`;
    document.body.appendChild(stage);
    renderPins(stage);

    const label = document.createElement('div');
    label.className = 'mocklabel';
    label.textContent = title;
    document.body.appendChild(label);

    const bar = document.createElement('div');
    bar.className = 'mockbar glass';
    bar.innerHTML = `
        <a href="index.html" title="Все макеты">← Макеты</a>
        <span class="sep"></span>
        <button data-act="light" class="active">Светлая</button>
        <button data-act="dark">Тёмная</button>
        <span class="sep"></span>
        <button data-act="desktop" class="active">Десктоп</button>
        <button data-act="phone">Телефон</button>`;
    document.body.appendChild(bar);

    bar.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        const act = b.dataset.act;
        if (act === 'light' || act === 'dark') {
            document.body.classList.toggle('dark', act === 'dark');
            bar.querySelector('[data-act=light]').classList.toggle('active', act === 'light');
            bar.querySelector('[data-act=dark]').classList.toggle('active', act === 'dark');
        } else {
            document.body.classList.toggle('phone', act === 'phone');
            bar.querySelector('[data-act=desktop]').classList.toggle('active', act === 'desktop');
            bar.querySelector('[data-act=phone]').classList.toggle('active', act === 'phone');
        }
    });

    return stage.querySelector('.layer');
}
