const segmenter = typeof Intl !== "undefined" && Intl.Segmenter 
    ? new Intl.Segmenter("ja", { granularity: "word" }) 
    : null;

function tokenize(text) {
    if (!text || !segmenter) return [];
    const words = [];
    for (const seg of segmenter.segment(text)) {
        if (seg.isWordLike) words.push(seg.segment);
    }
    return words;
}

function analyzeTranscript(segments) {
    if (!segments || segments.length === 0 || !segmenter || typeof JLPT_DICT === "undefined") return null;

    const fullText = segments.map(s => s.text).join(" ");
    const words = tokenize(fullText);
    if (words.length === 0) return null;

    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let recognized = 0;

    for (const w of words) {
        const lvl = JLPT_DICT[w];
        if (lvl) {
            counts[lvl]++;
            recognized++;
        }
    }

    if (recognized < 5) return null;

    const totalWords = words.length;
    const ratios = {
        n1: counts[1] / recognized,
        n2: counts[2] / recognized,
        n3: counts[3] / recognized,
        n4: counts[4] / recognized,
        n5: counts[5] / recognized,
        advanced: (counts[1] + counts[2]) / recognized,
        basic: (counts[4] + counts[5]) / recognized
    };

    // Точный расчет уровня JLPT по оригинальной формуле донора (sL)
    let jlptLevel = 5;
    if (ratios.n1 >= 0.16 || ratios.advanced >= 0.28) {
        jlptLevel = 1;
    } else if (ratios.n1 >= 0.10 || ratios.advanced >= 0.18 || ratios.n2 >= 0.16) {
        jlptLevel = 2;
    } else if (ratios.basic < 0.58 && (ratios.n3 >= 0.20 || ratios.advanced >= 0.11)) {
        jlptLevel = 3;
    } else if (ratios.n5 < 0.46 && (ratios.n4 >= 0.22 || ratios.basic >= 0.52)) {
        jlptLevel = 4;
    } else {
        jlptLevel = 5;
    }

    // Расчет WPM (слов в минуту)
    let durationMs = 0;
    if (segments[segments.length - 1].endMs && segments[0].startMs) {
        durationMs = segments[segments.length - 1].endMs - segments[0].startMs;
    }
    const durationMin = durationMs > 0 ? durationMs / 60000 : 1;
    const wpm = Math.round(totalWords / durationMin);

    // Подсчет символов и плотности строк
    const charCount = fullText.replace(/\s+/g, '').length;
    const lineDensity = Math.round(charCount / Math.max(1, segments.length));

    return {
        jlptLevel,
        totalWords,
        wpm,
        charCount,
        lineDensity,
        distribution: { n1: counts[1], n2: counts[2], n3: counts[3], n4: counts[4], n5: counts[5] },
        ratios: { n1: ratios.n1, n2: ratios.n2, n3: ratios.n3, n4: ratios.n4, n5: ratios.n5 }
    };
}