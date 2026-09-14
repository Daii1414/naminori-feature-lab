(function() {
    'use strict';

    let knownWordsSet = new Set();
    let topBarEl = null;
    let isAnalyzing = false;

    function createTopBar() {
        if (document.getElementById('naminori-comprehension-bar')) return;

        // Сдвигаем body вниз, чтобы наша панель не перекрывала шапку сайта (например, на X.com или YouTube)
        document.body.style.marginTop = '36px';

        topBarEl = document.createElement('div');
        topBarEl.id = 'naminori-comprehension-bar';
        topBarEl.innerHTML = `
            <div class="naminori-bar-content">
                <span class="naminori-status-dot" id="naminori-dot" title="Disconnected"></span>
                <select id="naminori-deck-select" title="Select Anki Deck">
                    <option value="">Loading decks...</option>
                </select>
                <span class="naminori-metric" id="naminori-known">Anki: 0 words</span>
                <span class="naminori-divider">|</span>
                <span class="naminori-metric" id="naminori-comprehension">Comprehension: --%</span>
                <button id="naminori-sync-btn">Sync</button>
            </div>
        `;
        document.body.prepend(topBarEl);

        loadDecksList();

        document.getElementById('naminori-sync-btn').addEventListener('click', () => {
            const select = document.getElementById('naminori-deck-select');
            const chosenDeck = select.value;
            if (!chosenDeck) {
                alert('Пожалуйста, выберите колоду Anki!');
                return;
            }
            syncWithAnki(chosenDeck);
        });

        // Авто-синхронизация при смене колоды в селекте
        document.getElementById('naminori-deck-select').addEventListener('change', (e) => {
            const deck = e.target.value;
            if (deck) syncWithAnki(deck);
        });
    }

    function loadDecksList() {
        chrome.runtime.sendMessage({ action: 'GET_DECKS' }, (response) => {
            const select = document.getElementById('naminori-deck-select');
            if (!select) return;

            if (response && response.decks && response.decks.length > 0) {
                select.innerHTML = '<option value="">-- Select Anki Deck --</option>';
                
                chrome.storage.local.get(['naminori_selected_deck', 'naminori_anki_vocab'], (saved) => {
                    response.decks.forEach(deck => {
                        const option = document.createElement('option');
                        option.value = deck;
                        option.innerText = deck;
                        if (saved.naminori_selected_deck === deck) {
                            option.selected = true;
                        }
                        select.appendChild(option);
                    });

                    if (saved.naminori_anki_vocab && saved.naminori_anki_vocab.length > 0) {
                        knownWordsSet = new Set(saved.naminori_anki_vocab);
                        updateStatusUI(true, knownWordsSet.size);
                        analyzePageText();
                    } else if (saved.naminori_selected_deck) {
                        // Если колода была выбрана ранее, но кэша нет — пробуем синхронить
                        syncWithAnki(saved.naminori_selected_deck);
                    }
                });
            } else {
                select.innerHTML = '<option value="">Anki not connected / No decks</option>';
                updateStatusUI(false, 0);
            }
        });
    }

    function syncWithAnki(deckName) {
        const dot = document.getElementById('naminori-dot');
        dot.style.background = 'orange';
        dot.title = 'Syncing...';

        chrome.runtime.sendMessage({ action: 'SYNC_ANKI', deckName }, (response) => {
            if (response && response.success && response.count > 0) {
                loadLocalVocabAndAnalyze();
            } else {
                updateStatusUI(false, 0);
                alert('Не удалось загрузить слова. Проверьте, запущен ли Anki и открыта ли нужная колода.');
            }
        });
    }

    function loadLocalVocabAndAnalyze() {
        chrome.storage.local.get(['naminori_anki_vocab'], (data) => {
            if (data.naminori_anki_vocab) {
                knownWordsSet = new Set(data.naminori_anki_vocab);
                updateStatusUI(true, knownWordsSet.size);
                analyzePageText();
            }
        });
    }

    function updateStatusUI(isConnected, count) {
        const dot = document.getElementById('naminori-dot');
        const knownEl = document.getElementById('naminori-known');
        
        if (isConnected) {
            dot.style.background = '#10B981'; // Зеленый
            dot.title = 'Connected to Anki';
            knownEl.innerText = `Anki: ${count} words`;
        } else {
            dot.style.background = '#EF4444'; // Красный
            dot.title = 'Disconnected';
            knownEl.innerText = `Anki: 0 words`;
        }
    }

    // Высокопроизводительный сборщик текста через TreeWalker
    function analyzePageText() {
        if (knownWordsSet.size === 0 || isAnalyzing) return;
        isAnalyzing = true;

        requestIdleCallback(() => {
            try {
                const segmenter = new Intl.Segmenter('ja', { granularity: 'word' });
                const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
                    acceptNode(node) {
                        const parent = node.parentElement;
                        if (!parent) return NodeFilter.FILTER_REJECT;
                        const tag = parent.tagName.toLowerCase();
                        if (['script', 'style', 'noscript', 'iframe', 'code', 'pre'].includes(tag)) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        if (parent.closest('#naminori-comprehension-bar')) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        return NodeFilter.FILTER_ACCEPT;
                    }
                });

                const pageWords = new Set();
                let node;
                while (node = walker.nextNode()) {
                    const text = node.nodeValue;
                    if (!text || !/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) continue;

                    for (const segment of segmenter.segment(text)) {
                        if (segment.isWordLike) {
                            const word = segment.segment.trim();
                            // Фильтруем мусор, цифры и знаки препинания
                            if (word.length > 0 && /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(word)) {
                                pageWords.add(word);
                            }
                        }
                    }
                }

                if (pageWords.size > 0) {
                    let knownCount = 0;
                    for (const word of pageWords) {
                        if (knownWordsSet.has(word)) {
                            knownCount++;
                        }
                    }
                    const percentage = Math.round((knownCount / pageWords.size) * 100);
                    const compEl = document.getElementById('naminori-comprehension');
                    if (compEl) {
                        compEl.innerText = `Comprehension: ${percentage}%`;
                    }
                }
            } catch (e) {
                console.error("Text analysis error:", e);
            } finally {
                isAnalyzing = false;
            }
        }, { timeout: 1000 });
    }

    // Инициализация
    createTopBar();

    // Отслеживание смены контента (динамический скролл / SPA навигация вроде X.com)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(analyzePageText, 1500);
    }, { passive: true });

})();