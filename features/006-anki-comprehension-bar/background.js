const ANKI_URL = 'http://localhost:8765';

async function invokeAnki(action, params = {}) {
    try {
        const response = await fetch(ANKI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, version: 6, params })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        return data.result;
    } catch (error) {
        console.warn('Anki-Connect connection error:', error.message);
        return null;
    }
}

async function fetchAllDecks() {
    const decks = await invokeAnki('deckNames');
    return decks || [];
}

async function fetchAnkiDeckVocabulary(deckName) {
    try {
        // 1. Ищем ID заметок в выбранной колоде
        const noteIds = await invokeAnki('findNotes', { query: `deck:"${deckName}"` });
        if (!noteIds || noteIds.length === 0) return [];

        const words = new Set();
        const chunkSize = 500; // Обрабатываем чанками, чтобы не перегружать память на гигантских колодах

        for (let i = 0; i < noteIds.length; i += chunkSize) {
            const chunk = noteIds.slice(i, i + chunkSize);
            const notesInfo = await invokeAnki('notesInfo', { notes: chunk });
            
            if (notesInfo) {
                notesInfo.forEach(note => {
                    const fields = note.fields;
                    // Проходим по всем полям заметки, чтобы гарантированно поймать слово
                    for (const key in fields) {
                        if (fields[key] && fields[key].value) {
                            const cleanText = fields[key].value.replace(/<[^>]*>?/gm, '').trim();
                            // Проверяем, что текст содержит японские символы
                            if (cleanText && /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(cleanText)) {
                                words.add(cleanText);
                            }
                        }
                    }
                });
            }
        }

        const wordArray = Array.from(words);
        
        // Сохраняем в локальное хранилище
        await chrome.storage.local.set({ 
            'naminori_anki_vocab': wordArray,
            'naminori_selected_deck': deckName,
            'naminori_anki_last_sync': Date.now()
        });

        return wordArray;
    } catch (e) {
        console.error("Error fetching Anki deck vocabulary:", e);
        return [];
    }
}

// Коммуникация с content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'GET_DECKS') {
        fetchAllDecks().then(decks => sendResponse({ decks }));
        return true;
    }

    if (request.action === 'SYNC_ANKI') {
        fetchAnkiDeckVocabulary(request.deckName).then(words => {
            sendResponse({ success: true, count: words.length });
        });
        return true;
    }
});