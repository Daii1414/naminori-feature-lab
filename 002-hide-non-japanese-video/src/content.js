console.log("[NihongoTube] Запущен обновленный фильтр (Главная + Боковая панель)!");

/**
 * Определение японского языка (Хирагана / Катакана + исключение шума)
 */
function isJapaneseTitle(title) {
    if (!title) return false;

    let cleanTitle = title
        .replace("fypシ゚", "")
        .replace("fypシ", "")
        .replace("ミックスリスト", "");

    if (/[≧≦°ಠ●◕○◯⊙▽△_∩∪ﾟ∇♪ω◇◆◎⌒※☆★♡♥︶︸ಥ¬╯╰┻┳━┛┗┓┏┫┣╋╂┃━─┌┐└┘├┤┴┬╱╲╳]/u.test(cleanTitle)) {
        const hasHiragana = /[\p{Script=Hiragana}]/u.test(cleanTitle);
        const hasKatakana = /[\p{Script=Katakana}]/u.test(cleanTitle);
        const hasKanji = /[\p{Script=Han}]/u.test(cleanTitle);
        return hasHiragana && hasKatakana && hasKanji;
    }

    return /[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(cleanTitle);
}

/**
 * Селекторы названий (Главная, Поиск, Боковая панель, Shorts)
 */
const TITLE_SELECTORS = [
    '#video-title',
    '#video-title-link',
    'a.yt-lockup-metadata-view-model-wiz__title',
    'a.yt-lockup-metadata-view-model__title',
    'a.ytLockupMetadataViewModelTitle',
    '.yt-lockup-metadata-view-model-wiz__title',
    '.shortsLockupViewModelHostMetadataTitle',
    'h3.shortsLockupViewModelHostMetadataTitle',
    'a.shortsLockupViewModelHostEndpoint',
    'h3.media-item-headline',
    'ytd-compact-video-renderer h3',
    '#movie-title'
];

/**
 * Находит правильный родительский элемент для скрытия:
 * 1. На главной — удаляет всю ячейку сетки (ytd-rich-item-renderer)
 * 2. В боковой панели — удаляет компактный блок видео
 * 3. В Shorts — удаляет конкретный шортс
 */
function getTargetCard(titleEl) {
    // Если на главной странице — берем большую ячейку сетки
    const richItem = titleEl.closest('ytd-rich-item-renderer');
    if (richItem) return richItem;

    // В поиске
    const videoRenderer = titleEl.closest('ytd-video-renderer');
    if (videoRenderer) return videoRenderer;

    // На странице канала
    const gridVideo = titleEl.closest('ytd-grid-video-renderer');
    if (gridVideo) return gridVideo;

    // В боковой колонке (классический вид)
    const compactVideo = titleEl.closest('ytd-compact-video-renderer');
    if (compactVideo) return compactVideo;

    // В боковой колонке нового интерфейса и в Shorts
    const modernLockup = titleEl.closest([
        'yt-lockup-view-model',
        'ytm-shorts-lockup-view-model-v2',
        'ytm-shorts-lockup-view-model',
        'yt-reel-item-view-model',
        'ytd-reel-item-renderer',
        '.ytGridShelfViewModelGridShelfItem'
    ].join(', '));

    return modernLockup || null;
}

function processVideos() {
    const titleElements = document.querySelectorAll(TITLE_SELECTORS.join(', '));

    titleElements.forEach(titleEl => {
        const card = getTargetCard(titleEl);
        if (!card) return;

        const titleText = titleEl.textContent?.trim() 
                       || titleEl.getAttribute('title')?.trim() 
                       || titleEl.getAttribute('aria-label')?.trim() 
                       || "";

        if (!titleText) return;

        // Если это видео уже проверяли и его название не изменилось — пропускаем
        if (card.dataset.ntTitle === titleText) return;

        card.dataset.ntTitle = titleText;

        // Проверяем японский язык
        if (!isJapaneseTitle(titleText)) {
            card.classList.add('nihongotube-hidden');
        } else {
            card.classList.remove('nihongotube-hidden');
        }
    });

    // Очищаем пустые полки (например, если скрылись все Shorts в блоке)
    cleanupEmptyShelves();

    // Если на экране осталось слишком мало видео — заставляем YouTube догрузить еще
    triggerAutoFillIfNeeded();
}

/**
 * Скрывает полку (Shorts или Рекомендации), если внутри неё не осталось видимых видео
 */
function cleanupEmptyShelves() {
    const shelves = document.querySelectorAll([
        'ytd-rich-section-renderer',
        'ytd-reel-shelf-renderer',
        'grid-shelf-view-model'
    ].join(', '));

    shelves.forEach(shelf => {
        const items = shelf.querySelectorAll([
            'ytd-rich-item-renderer',
            'yt-lockup-view-model',
            'yt-reel-item-view-model',
            'ytd-reel-item-renderer',
            'ytm-shorts-lockup-view-model'
        ].join(', '));

        if (items.length > 0) {
            const allHidden = Array.from(items).every(item => item.classList.contains('nihongotube-hidden'));
            if (allHidden) {
                shelf.classList.add('nihongotube-hidden');
            } else {
                shelf.classList.remove('nihongotube-hidden');
            }
        }
    });
}

/**
 * Если после скрытия лента полупустая — мягко триггерим догрузку новой порции видео
 */
let isAutoFilling = false;
function triggerAutoFillIfNeeded() {
    if (isAutoFilling) return;

    // Проверяем главную страницу
    if (window.location.pathname === '/') {
        const visibleVideos = document.querySelectorAll('ytd-rich-item-renderer:not(.nihongotube-hidden)');
        if (visibleVideos.length > 0 && visibleVideos.length < 8) {
            isAutoFilling = true;
            window.scrollBy(0, 2);
            setTimeout(() => {
                window.scrollBy(0, -2);
                isAutoFilling = false;
            }, 500);
        }
    }
}

// Наблюдаем за изменениями DOM
const observer = new MutationObserver(() => {
    processVideos();
});

observer.observe(document.documentElement, { childList: true, subtree: true });

// Запуск при загрузке
processVideos();