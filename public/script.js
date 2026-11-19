// бегущие часы: по ним видно, отвечает страница или замерла
setInterval(function () {
  const now = new Date();
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  document.getElementById('clock').textContent =
    now.toLocaleTimeString() + '.' + ms;
}, 50);

// Сколько карточек видно на первом экране. У них картинки грузим сразу,
// у остальных ставим loading="lazy" (загрузка при прокрутке).
const FIRST_SCREEN = 4;

// сколько товаров просим у сервера за раз
const LIMIT = 20;

const catalog = document.getElementById('catalog');
const moreButton = document.getElementById('more');

// какая страница уже загружена, сколько их всего и что ищем
let page = 0;
let pages = 1;
let loading = false;
let query = '';

// счётчики для панели справа внизу
let filterRuns = 0;
let scrollRuns = 0;
let cartCount = 0;

// номера товаров, которые уже лежат в корзине
const inCart = new Set();

// закрепляет за каждой карточкой её текущую высоту
function fixHeights(cards) {
  console.time('Высота карточек');
  // сначала только читаем все высоты
  const heights = [];
  for (let i = 0; i < cards.length; i++) {
    heights.push(cards[i].offsetHeight);
  }
  // потом только записываем
  for (let i = 0; i < cards.length; i++) {
    cards[i].style.minHeight = heights[i] + 'px';
  }
  console.timeEnd('Высота карточек');
}

// дописывает карточки в конец каталога
function addCards(items) {
  console.time('Построение карточек');
  const start = performance.now();
  const already = catalog.children.length;
  let html = '';

  items.forEach(function (item, index) {
    // Отложенная загрузка - только для картинок ниже первого экрана
    const lazy = already + index >= FIRST_SCREEN ? ' loading="lazy"' : '';
    // товар уже в корзине: кнопка сразу неактивная
    const taken = inCart.has(String(item.id));
    const button = taken
      ? '<button class="btn-primary" data-id="' + item.id + '" disabled>В корзине</button>'
      : '<button class="btn-primary" data-id="' + item.id + '">Хочу забрать!</button>';

    html +=
      '<article class="card">' +
        '<img src="' + item.img + '" alt="' + item.name + '"' +
           ' width="' + item.width + '" height="' + item.height + '"' + lazy + '>' +
        '<h2>' + item.name + '</h2>' +
        '<p class="price">' + item.price.toLocaleString('ru-RU') + ' ₽</p>' +
        button +
      '</article>';
  });

  catalog.insertAdjacentHTML('beforeend', html);
  console.timeEnd('Построение карточек');
  const time = Math.round(performance.now() - start);

  // закрепляем высоту только за новыми карточками
  fixHeights(Array.from(catalog.children).slice(already));

  document.querySelector('#nodes').textContent =
    'Элементов на странице: ' + document.querySelectorAll('*').length;
  return time;
}

// загружает следующую страницу и дописывает её карточки
function loadMore() {
  if (loading || page >= pages) {
    return;
  }

  loading = true;
  page = page + 1;

  fetch('/api/products?page=' + page + '&limit=' + LIMIT +
        '&search=' + encodeURIComponent(query))
    .then(function (response) {
      return response.json();
    })
    .then(function (answer) {
      pages = answer.pages;
      const time = addCards(answer.items);

      document.querySelector('#total').textContent =
        'Найдено: ' + answer.total + ' (порция построена за ' + time + ' мс)';

      // последняя страница: кнопка больше не нужна
      if (page >= pages) {
        moreButton.style.display = 'none';
      }

      loading = false;
    })
    .catch(function (error) {
      loading = false;
      catalog.textContent = 'Не удалось загрузить каталог: ' + error.message;
    });
}

// новый поиск: очищаем каталог и грузим первую страницу заново
function filterCards() {
  filterRuns = filterRuns + 1;
  document.querySelector('#filterRuns').textContent =
    'Поиск запускался: ' + filterRuns;

  query = document.querySelector('#search').value;
  catalog.innerHTML = '';
  page = 0;
  pages = 1;
  moreButton.style.display = 'block';

  // заново запускаем наблюдатель: кнопка снова «появилась» на экране
  watcher.unobserve(moreButton);
  watcher.observe(moreButton);
  loadMore();
}

// кладёт товар в корзину
function addToCart(id) {
  inCart.add(String(id));
  cartCount = cartCount + 1;
  document.querySelector('#cart').textContent = 'В корзине: ' + cartCount;
  console.log('Добавлен товар № ' + id);
}

// показывает кнопку «Наверх», когда страница прокручена вниз
function onScroll() {
  scrollRuns = scrollRuns + 1;
  document.querySelector('#scrollRuns').textContent =
    'Прокрутка обработана: ' + scrollRuns;
  const up = document.querySelector('#up');
  if (window.scrollY > 1000) {
    up.style.display = 'block';
  } else {
    up.style.display = 'none';
  }
}

// кнопка «Показать ещё»
moreButton.addEventListener('click', loadMore);

// кнопка показалась на экране: загружаем следующую страницу
const watcher = new IntersectionObserver(function (entries) {
  if (entries[0].isIntersecting) {
    loadMore();
  }
}, { rootMargin: '300px' });

watcher.observe(moreButton);

// ждём паузу в наборе и только потом ищем
let searchTimer;
document.querySelector('#search').addEventListener('input', function () {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(filterCards, 300);
});

// пропускаем вызовы прокрутки, если с прошлого прошло меньше 200 мс
let lastScroll = 0;
window.addEventListener('scroll', function () {
  const now = Date.now();
  if (now - lastScroll < 200) {
    return;
  }
  lastScroll = now;
  onScroll();
});

// кнопка «Наверх»
document.querySelector('#up').addEventListener('click', function () {
  window.scrollTo(0, 0);
});

// один обработчик на весь каталог
catalog.addEventListener('click', function (event) {
  if (event.target.classList.contains('btn-primary')) {
    addToCart(event.target.dataset.id);
    event.target.textContent = 'В корзине';
    event.target.disabled = true;
  }
});
document.querySelector('#handlers').textContent = 'Обработчиков кнопок: 1';

// раз в секунду считаем, какие файлы пришли по сети, а какие из кеша
setInterval(function () {
  const files = performance.getEntriesByType('resource');
  let fromCache = 0;
  let bytes = 0;
  for (let i = 0; i < files.length; i++) {
    bytes = bytes + files[i].transferSize;
    if (files[i].transferSize === 0) {
      fromCache = fromCache + 1;
    }
  }
  document.querySelector('#fromCache').textContent =
    'Из кеша: ' + fromCache + ' из ' + files.length;
  document.querySelector('#loaded').textContent =
    'Скачано: ' + Math.round(bytes / 1024) + ' кБ';
}, 1000);

// первая страница при открытии сайта
loadMore();
