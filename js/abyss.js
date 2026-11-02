import "./abyss-background.js";

const grid = document.querySelector("#abyss-grid");
const darkness = document.querySelector("#darkness");
const threat = document.querySelector("#threat");
const fear = document.querySelector("#fear");
const resolved = { darkness: false, threat: false, fear: false };
let escapeFound = false;

console.info("공격자 해체 시도 중 오류로 인해 심연에 갇혔습니다. element() 함수를 사용하여 탈출구를 조사하십시오");

function checkEscape() {
    if (escapeFound || !Object.values(resolved).every(Boolean)) return;
    escapeFound = true;
    const root = document.querySelector("#abyss-root");
    // 게임이 여는 근원의 새 이름을 먼저 등록하여 id 보호가 되돌리지 않게 합니다.
    protectedElements.get(root).id = "core";
    root.id = "core";
    // 원이 완전히 열린 뒤에 조사하면 다음 장소의 단서를 찾을 수 있습니다.
    root.addEventListener("transitionend", (event) => {
        if (event.target !== root || event.propertyName !== "width") return;
        root.setAttribute("aria-label", "열린 심연의 근원, core");
        root.dataset.hint = "심연의 근원을 찾았습니다. 주소창의 `/abyss/` 뒤에 `Y29yZQ.html`을 추가로 입력하여 계속하십시오.";
        root.querySelector("#core-description").textContent = root.dataset.hint;
    });
    document.body.classList.add("abyss-resolved");
}

function resolveDarkness(light) {
    if (resolved.darkness) return;
    light.id = "light-source";
    light.setAttribute("role", "img");
    light.setAttribute("aria-label", "어둠을 밝히는 빛");
    grid.append(light);
    darkness.classList.add("is-resolved");
    const message = "빛이 어둠 속의 길을 밝혔습니다. darkness는 해결되었습니다.";
    darkness.dataset.hint = message;
    darkness.querySelector(".node-hint").textContent = message;
    resolved.darkness = true;
    document.body.classList.add("darkness-resolved");
    console.info(message);
    checkEscape();
}

class LightSource extends HTMLElement {
    constructor() {
        super();
        // 생성자가 끝난 뒤 배치하므로 create()는 네이티브 DOM 생성과 동일하게 동작합니다.
        queueMicrotask(() => resolveDarkness(this));
    }
}

customElements.define("light-source", LightSource);

// 원래 부모와 id를 기록하고, 허용된 조작만 퍼즐의 진행으로 처리합니다.
const protectedElements = new Map();

function rememberElement(node) {
    if (protectedElements.has(node)) return;
    protectedElements.set(node, {
        parent: node.parentNode,
        nextSibling: node.nextSibling,
        id: node.getAttribute("id")
    });
}

for (const node of document.querySelectorAll("*")) rememberElement(node);

function observePuzzle() {
    observer.observe(document, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["id"]
    });
}

const observer = new MutationObserver(changes => {
    // 복원 작업을 다시 금지된 조작으로 판정하지 않도록 잠시 관측을 멈춥니다.
    observer.disconnect();
    let removalBlocked = false;
    let idChangeBlocked = false;

    // 부모를 먼저 복원하여 부모의 삭제를 threat 자체의 삭제로 오인하지 않습니다.
    for (const [node, original] of protectedElements) {
        if (node === threat || (!threat.isConnected && threat.contains(node))) continue;
        if (node.parentNode === original.parent) continue;
        const nextSibling = original.nextSibling?.parentNode === original.parent ? original.nextSibling : null;
        original.parent.insertBefore(node, nextSibling);
        removalBlocked = true;
    }

    const renamedElements = new Set(changes.filter(change => change.type === "attributes").map(change => change.target));
    for (const node of renamedElements) {
        const original = protectedElements.get(node);
        if (!original || node.getAttribute("id") === original.id) continue;
        if (node === fear && node.id === "confidence") {
            original.id = "confidence";
            fear.querySelector(".node-name").textContent = "confidence";
            const message = "두려움이 자신감으로 바뀌었습니다.";
            fear.dataset.hint = message;
            fear.querySelector(".node-hint").textContent = message;
            fear.classList.add("is-resolved");
            resolved.fear = true;
            document.body.classList.add("fear-resolved");
            console.info(message);
        } else {
            if (original.id === null) node.removeAttribute("id");
            else node.setAttribute("id", original.id);
            idChangeBlocked = true;
        }
    }

    // 새로 배치된 빛도 이후에는 같은 보호를 받습니다.
    for (const node of document.querySelectorAll("*")) rememberElement(node);
    if (removalBlocked) console.error("오류: 이 객체를 제거할 수 있는 권한이 없습니다.");
    if (idChangeBlocked) console.error("오류: 이 객체의 id를 변경할 수 없습니다.");

    if (!resolved.threat && !threat.isConnected) {
        resolved.threat = true;
        document.body.classList.add("threat-resolved");
        console.info("위협이 제거되었습니다.");
    }
    checkEscape();
    observePuzzle();
});

observePuzzle();
