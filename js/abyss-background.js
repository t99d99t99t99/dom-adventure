import "./shared/element.js";
import { randomErrorCharacter } from "./shared/random-text.js";

const background = document.querySelector("[data-abyss-background]");
const text = document.createTextNode("");
background.append(text);
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let characters = [];
let columns = 0;
let lastUpdateAt = 0;

function fillBackground() {
    const style = window.getComputedStyle(background);
    const context = document.createElement("canvas").getContext("2d");
    context.font = `${style.fontSize} ${style.fontFamily}`;
    const characterWidth = context.measureText("M").width + parseFloat(style.letterSpacing);
    columns = Math.ceil(window.innerWidth / characterWidth);
    const rows = Math.ceil(window.innerHeight / parseFloat(style.lineHeight)) + 1;
    characters = Array.from({ length: rows * (columns + 1) }, (_, index) =>
        (index + 1) % (columns + 1) === 0 ? "\n" : randomErrorCharacter()
    );
    text.data = characters.join("");
}

function animate(now) {
    if (!reducedMotion.matches && now - lastUpdateAt >= 60) {
        lastUpdateAt = now;
        // 배경을 통째로 바꾸지 않고 일부 글자만 조용히 변형합니다.
        const changes = Math.ceil(characters.length * 0.01);
        for (let index = 0; index < changes; index += 1) {
            const position = Math.floor(Math.random() * characters.length);
            if (characters[position] !== "\n") characters[position] = randomErrorCharacter();
        }
        text.data = characters.join("");
    }
    window.requestAnimationFrame(animate);
}

fillBackground();
window.addEventListener("resize", fillBackground);
window.requestAnimationFrame(animate);
