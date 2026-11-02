import "./abyss-background.js";

const errorWords = document.querySelector("#error-words");
const backButton = document.querySelector("#back-button");
const backLabel = document.querySelector("#back-label");
const text = document.createTextNode("");
errorWords.append(text);
const words = ["null", "NaN", "undefined"];
const combiningMarks = ["\u0300", "\u0301", "\u0302", "\u0308", "\u0310", "\u0334", "\u0336", "\u0323", "\u0325"];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let lines = [];
let lastWordUpdateAt = 0;
let lastLabelUpdateAt = 0;

function glitchText(value, maxMarks) {
    // 결합 문자를 덧붙여 원래 글자를 유지하면서 위아래로 번지는 오류를 만듭니다.
    return Array.from(value, character => {
        if (character === " " || Math.random() > 0.45) return character;
        const count = 1 + Math.floor(Math.random() * maxMarks);
        const marks = Array.from({ length: count }, () =>
            combiningMarks[Math.floor(Math.random() * combiningMarks.length)]
        );
        return character + marks.join("");
    }).join("");
}

function randomWord() {
    const word = words[Math.floor(Math.random() * words.length)];
    // 기호가 늘어나도 각 단어가 차지하는 가로 폭은 일정하게 유지합니다.
    return glitchText(word.padEnd(10, " "), 5);
}

function printWords() {
    text.data = lines.map(line => line.join("")).join("\n");
}

function fillScreen() {
    const style = window.getComputedStyle(errorWords);
    const context = document.createElement("canvas").getContext("2d");
    context.font = `${style.fontSize} ${style.fontFamily}`;
    const columns = Math.ceil(window.innerWidth / context.measureText("undefined ").width) + 1;
    const rows = Math.ceil(window.innerHeight / parseFloat(style.lineHeight)) + 1;
    lines = Array.from({ length: rows }, () => Array.from({ length: columns }, randomWord));
    printWords();
}

function animate(now) {
    if (!reducedMotion.matches && now - lastWordUpdateAt >= 120) {
        lastWordUpdateAt = now;
        for (const line of lines) {
            const column = Math.floor(Math.random() * line.length);
            line[column] = randomWord();
        }
        printWords();
    }
    if (!reducedMotion.matches && now - lastLabelUpdateAt >= 450) {
        lastLabelUpdateAt = now;
        backLabel.textContent = glitchText("이전 페이지로", 2);
    }
    window.requestAnimationFrame(animate);
}

backButton.addEventListener("click", () => {
    if (window.history.length > 1) window.history.back();
    else window.location.assign("/");
});

fillScreen();
window.addEventListener("resize", fillScreen);
window.requestAnimationFrame(animate);
