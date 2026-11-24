/* Язык и фильтры. Движок частиц живёт отдельно в app.js и об этом слое не знает. */
(() => {
'use strict';

/* ---------------- язык ---------------- */
const KEY = 'liza-lang';
let saved = null; try { saved = localStorage.getItem(KEY); } catch (e) {}
const q = new URLSearchParams(location.search).get('lang');
let lang = (q === 'en' || q === 'ru') ? q : (saved === 'en' ? 'en' : 'ru');

function applyLang(l) {
  lang = l;
  document.documentElement.lang = l;
  document.querySelectorAll('[data-ru],[data-en]').forEach(el => {
    const v = el.getAttribute('data-' + l);
    if (v === null) return;
    if (el.tagName === 'TITLE') document.title = v;
    else el.textContent = v;
  });
  document.querySelectorAll('.lang button').forEach(b => b.classList.toggle('on', b.dataset.lang === l));
  try { localStorage.setItem(KEY, l); } catch (e) {}
  updateEnd();
}
document.querySelectorAll('.lang button').forEach(b =>
  b.addEventListener('click', () => applyLang(b.dataset.lang)));

/* ---------------- фильтры ---------------- */
const list = document.getElementById('list');
const cards = [...list.querySelectorAll('.card')];
const counter = document.getElementById('counter');
const listEnd = document.getElementById('listEnd');
let filter = 'all';
let remeasureBg = () => {};

function updateEnd() {
  const shown = cards.filter(c => !c.hidden).length;
  if (counter) counter.textContent = String(shown).padStart(2, '0');
  if (listEnd) listEnd.textContent = lang === 'en'
    ? shown + ' of ' + cards.length + ' shown'
    : 'показано ' + shown + ' из ' + cards.length;
}

function applyFilter(f) {
  filter = f;
  cards.forEach(c => {
    const match = f === 'all' || (c.dataset.tags || '').split(/\s+/).includes(f);
    c.hidden = !match;
    /* видео в скрытой карточке незачем крутить */
    const v = c.querySelector('video');
    if (v) { if (match) { v.play().catch(() => {}); } else { v.pause(); } }
  });
  document.querySelectorAll('.chip').forEach(ch => ch.classList.toggle('is-active', ch.dataset.f === f));
  list.scrollTop = 0;
  updateEnd();
  remeasureBg();
}
document.getElementById('tags').addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (chip && chip.dataset.f) applyFilter(chip.dataset.f);
});

/* ---------- Vimeo ----------
   Превью в карточке — немой шестисекундный луп. По клику он подменяется
   плеером Vimeo со звуком: iframe грузится только когда его попросили. */
document.querySelectorAll('.card[data-vimeo]').forEach(card => {
  const thumb = card.querySelector('.thumb');
  if (!thumb) return;
  thumb.classList.add('is-playable');
  thumb.addEventListener('click', () => {
    if (thumb.dataset.open) return;
    thumb.dataset.open = '1';
    thumb.style.height = 'auto';
    thumb.style.aspectRatio = card.dataset.ratio || '16 / 9';
    thumb.innerHTML = '<iframe src="https://player.vimeo.com/video/' + card.dataset.vimeo +
      '?autoplay=1&autopause=0&title=0&byline=0&portrait=0" frameborder="0" ' +
      'allow="autoplay; fullscreen; picture-in-picture" ' +
      'style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe>';
  });
});

/* ---------- фото в «обо мне» ----------
   На тачскрине наведения нет, поэтому кадры переключаются по тапу. */
const aboutPhoto = document.querySelector('.about .photo');
if (aboutPhoto && window.matchMedia('(hover:none)').matches) {
  aboutPhoto.addEventListener('click', () => aboutPhoto.classList.toggle('is-on'));
}

/* ---------- фон ----------
   Каракули гаснут по мере прокрутки и к блоку «обо мне» исчезают.
   Считаем долю пути до него и крутим прозрачность закреплённого слоя. */
const aboutBlock = document.getElementById('about');
if (aboutBlock) {
  let fadeStart = 0, fadeEnd = 1;
  const measure = () => {
    const top = aboutBlock.getBoundingClientRect().top + window.scrollY;
    /* гаснут не всю дорогу, а только на подходе: полный свет до последнего
       экрана перед «обо мне», к самому блоку — ноль */
    fadeEnd = Math.max(1, top - window.innerHeight * 0.45);
    fadeStart = Math.max(0, fadeEnd - window.innerHeight * 0.8);
  };
  const paint = () => {
    const span = Math.max(1, fadeEnd - fadeStart);
    const v = Math.max(0, Math.min(1, 1 - (window.scrollY - fadeStart) / span));
    document.body.style.setProperty('--bgfade', v.toFixed(3));
  };
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; paint(); });
  };
  remeasureBg = () => { measure(); paint(); };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', remeasureBg);
  /* картинки догружаются и меняют высоту страницы — пересчитываем */
  window.addEventListener('load', remeasureBg);
  remeasureBg();
}

applyLang(lang);
applyFilter('all');
})();
