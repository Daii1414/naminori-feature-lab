console.log("[Naminori Lab] 004-filter-non-japanese-comments (Оптимизированная версия)!");

let isRevealed = false;
let lastVideoId = "";
let isProcessingScheduled = false;

/**
 * Определение японского языка
 */
function isJapaneseText(text) {
    if (!text) return false;

    let clean = text
        .replace("fypシ゚", "")
        .replace("fypシ", "")
        .replace("ミックスリスト", "");

    if (/[≧≦°ಠ●◕◯⊙▽△_∩∪ﾟ∇♪ω◇◆◎⌒※☆★♡♥︶︸ಥ¬╯╰┻┳━┛┗┓┏┫┣╋╂┃━─┌┐└┘├┤┴┬╱╲╳]/u.test(clean)) {
        const hasHiragana = /[\p{Script=Hiragana}]/u.test(clean);
        const hasKatakana = /[\p{Script=Katakana}]/u.test(clean);
        const hasKanji = /[\p{Script=Han}]/u.test(clean);
        return hasHiragana && hasKatakana && hasKanji;
    }

    return /[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(clean);
}

/**
 * Главная функция фильтрации
 */
function processComments() {
    if (!window.location.pathname.startsWith("/watch")) return;

    // Сброс состояния при переходе на другое видео
    const currentVideoId = new URL(window.location.href).searchParams.get("v") || "";
    if (currentVideoId !== lastVideoId) {
        lastVideoId = currentVideoId;
        isRevealed = false;
        document.body.classList.remove("naminori-reveal-comments");
        removeExistingButton();
    }

    const commentThreads = document.querySelectorAll("ytd-comment-thread-renderer");
    if (commentThreads.length === 0) return;

    commentThreads.forEach(thread => {
        const textElement = thread.querySelector("#content-text, yt-formatted-string#content-text");
        if (!textElement) return;

        const commentText = textElement.textContent?.trim() || "";
        if (!commentText) return;

        // Если комментарий уже проверен с этим текстом — пропускаем
        if (thread.dataset.ntCommentText === commentText) return;
        thread.dataset.ntCommentText = commentText;

        if (!isJapaneseText(commentText)) {
            thread.classList.add("naminori-comment-hidden");
        } else {
            thread.classList.remove("naminori-comment-hidden");
        }
    });

    updateRevealButton();
}

/**
 * Безопасное обновление кнопки без зацикливания
 */
function updateRevealButton() {
    const hiddenCount = document.querySelectorAll("ytd-comment-thread-renderer.naminori-comment-hidden").length;
    const titleContainer = document.querySelector("#comments #title, ytd-comments-header-renderer #title");
    if (!titleContainer) return;

    let btn = document.querySelector(".naminori-reveal-btn");

    if (hiddenCount === 0) {
        if (btn) btn.remove();
        return;
    }

    if (!btn) {
        btn = document.createElement("button");
        btn.className = "naminori-reveal-btn";
        btn.type = "button";
        btn.addEventListener("click", () => {
            isRevealed = !isRevealed;
            document.body.classList.toggle("naminori-reveal-comments", isRevealed);
            updateRevealButton();
        });
        titleContainer.appendChild(btn);
    }

    const eyeIconOpen = `<svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
    const eyeIconClosed = `<svg viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.44-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>`;

    btn.innerHTML = isRevealed 
        ? `${eyeIconClosed} Hide Non-Japanese` 
        : `${eyeIconOpen} Reveal Comments (${hiddenCount})`;
}

function removeExistingButton() {
    const btn = document.querySelector(".naminori-reveal-btn");
    if (btn) btn.remove();
}

/**
 * Ограничитель скорости (Троттлинг):
 * Даже если YouTube вставит 100 элементов сразу,
 * функция выполнится всего 1 раз на следующем кадре анимации.
 */
function scheduleProcessing() {
    if (isProcessingScheduled) return;
    isProcessingScheduled = true;
    requestAnimationFrame(() => {
        isProcessingScheduled = false;
        processComments();
    });
}

/**
 * Наблюдатель: слушает ТОЛЬКО изменения внутри комментариев,
 * полностью игнорируя плеер и остальную страницу!
 */
const observer = new MutationObserver(mutations => {
    if (!window.location.pathname.startsWith("/watch")) return;

    for (const m of mutations) {
        const target = m.target;
        // Игнорируем собственную кнопку Reveal, чтобы не вызывать бесконечный цикл
        if (target.classList?.contains("naminori-reveal-btn")) continue;

        // Реагируем только на изменения внутри секции комментариев
        if (target.closest?.("#comments, ytd-comments")) {
            scheduleProcessing();
            break;
        }
    }
});

observer.observe(document.documentElement, { childList: true, subtree: true });

// Первичный запуск
scheduleProcessing();