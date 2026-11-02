import "./element.js";
import {
    randomErrorCharacter,
    randomErrorText,
    pulseBarrierNearNode,
    shatterBarrier,
    dropPageElements,
    revealAttacker
} from "./report-effects.js";

const reportMessages = document.querySelector("#report-messages");
let attackerIsCracked = false;
let domGraphObserver = null;

class SnakeAttacker extends HTMLElement {
    crack() {
        return crackAttacker(this);
    }

    disconnectedCallback() {
        // 다른 위치로 이동한 경우를 제외하고, 삭제된 요소를 DOM에 되돌립니다.
        queueMicrotask(() => {
            if (this.isConnected) return;
            document.body.append(this);
            console.error("오류: 이 객체를 제거할 수 있는 권한이 없습니다.");
        });
    }
}

customElements.define("snake-attacker", SnakeAttacker);

function scrambleErrorText() {
    document.title = randomErrorText();
}

scrambleErrorText();
window.setInterval(scrambleErrorText, 300);

const abyssCharacters = [...randomErrorText(18)];
const abyssText = document.querySelector("#abyss-link").firstChild;
window.setInterval(() => {
    const position = Math.floor(Math.random() * abyssCharacters.length);
    abyssCharacters[position] = randomErrorCharacter();
    abyssText.data = abyssCharacters.join("");
}, 40);

function watchForBarrierRemoval() {
    const barrier = document.querySelector("#barrier");
    const observer = new MutationObserver(() => {
        if (barrier.isConnected) return;
        observer.disconnect();
        shatterBarrier(barrier);
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

watchForBarrierRemoval();

async function crackAttacker(attacker) {
    if (attackerIsCracked) return;
    attackerIsCracked = true;
    domGraphObserver?.disconnect();
    document.body.classList.add("attacker-cracked");
    const startFillingScreen = revealAttacker(attacker);
    document.querySelector("#barrier")?.remove();
    await dropPageElements();
    startFillingScreen();
}

const pseudoDiagnoses = [
    "마이크로태스크 체크포인트에서 프로미스 반응 작업의 순서가 뒤집혀, 초기화 이전의 어휘 환경을 참조했습니다.",
    "재진입 호출이 실행 문맥을 연쇄적으로 누적해, 호출 스택과 작업 큐의 진행이 함께 정체되었습니다.",
    "이터러블 프로토콜을 따르지 않는 값이 구조 분해 경로에 유입되어, 후속 바인딩의 일관성이 붕괴했습니다.",
    "토큰 경계의 불일치가 자동 세미콜론 삽입과 충돌해, 모듈 전체의 구문 분석이 중단되었습니다.",
    "스타일 변경과 관측자 콜백이 상호 재진입하며 레이아웃 무효화가 반복되어, 렌더링 프레임이 복구 불가능하게 지연되었습니다."
];

function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

function addParagraph(parent, text, className = "report-message") {
    const paragraph = document.createElement("p");
    paragraph.className = className;
    paragraph.textContent = text;
    parent.append(paragraph);
    return paragraph;
}

function describeElement(element) {
    const label = `${element.localName}${element.id ? ` #${element.id}` : ""}`;
    const descriptionsById = {
        barrier: "페이지를 덮고 있는 보호막입니다.",
        "board-frame": "게임 보드를 감싸던 영역입니다. 현재는 표시되지 않습니다.",
        "report-title": "오류 분석 보고서의 제목입니다.",
        "report-messages": "오류 메시지의 출력을 담당하는 오브젝트입니다.",
        "repair-button": "문제 해결사를 불러오는 버튼입니다.",
        "dom-inspector": "현재 페이지의 DOM 구조를 조사하는 영역입니다.",
        "dom-heading": "DOM 구조 그래프의 제목입니다.",
        "dom-graph": "실제 DOM 요소의 부모와 자식 관계를 그리는 영역입니다.",
        "element-details": "선택한 요소의 조사 결과를 표시하는 영역입니다."
    };
    const descriptionsByTag = {
        html: "페이지의 모든 HTML 요소를 포함하는 최상위 요소입니다.",
        head: "페이지의 제목과 설정, 스타일 및 스크립트 정보를 담는 영역입니다.",
        body: "페이지 본문을 담는 영역입니다.",
        meta: "문자 인코딩, 화면 크기 등 페이지의 설정을 지정하는 요소입니다.",
        title: "브라우저 탭에 표시되는 제목입니다.",
        link: "페이지에서 사용하는 스타일시트를 연결하는 요소입니다.",
        script: "페이지의 동작을 담당하는 JavaScript 파일을 불러오는 요소입니다.",
        main: "오류 보고서와 문제 해결사를 담는 본문 영역입니다.",
        section: "서로 관련된 내용을 묶는 영역입니다.",
        header: "보고서의 제목과 머리말을 담는 영역입니다.",
        p: "안내 문장이나 오류 분석 결과를 표시하는 요소입니다.",
        div: "페이지의 요소들을 묶는 영역입니다.",
        button: "클릭하여 동작을 실행하는 버튼입니다.",
        canvas: "그림을 그리는 화면입니다.",
        aside: "본문과 함께 표시되는 보조 영역입니다."
    };

    if (element.id === "game-board") {
        return "canvas #game-board: 알 수 없는 공격에 의해 파괴됨";
    }

    const description = descriptionsById[element.id] || descriptionsByTag[element.localName]
        || "페이지를 구성하는 HTML 요소입니다.";
    return `${label}: ${description}`;
}

function inspectElement(element, node) {
    console.log("────────────────────────────────────────");
    const details = document.querySelector("#element-details");
    const isAttacker = element.id === "snake-attacker";
    const isRestore = element.id === "snake-restore";
    const isDestroyed = element.id === "game-board";
    const restoreDescription = 'snake-restore: SNAKE 게임을 복구하기 위한 파편입니다.. `element("snake-restore")`을 입력하여 자세한 정보를 확인하십시오.';
    const description = isAttacker ? "오류: 이 객체에 접근할 수 없습니다."
        : isRestore ? restoreDescription : describeElement(element);

    details.textContent = description;
    details.classList.toggle("report-error", isAttacker || isDestroyed);

    if (isAttacker) {
        pulseBarrierNearNode(node);
        console.error(description);
        return;
    }

    if (isRestore) {
        console.info(description);
        return;
    }

    // 콘솔에서 펼쳐 볼 수 있도록 문자열 대신 실제 요소를 출력합니다.
    console.log(element);
    if (isDestroyed) {
        console.error(description);
    } else {
        console.info(description);
    }
}

function createSvgElement(tagName, attributes = {}) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tagName);
    for (const [name, value] of Object.entries(attributes)) {
        element.setAttribute(name, value);
    }
    return element;
}

function startDomGraph() {
    const graphHost = document.querySelector("#dom-graph");
    // 그래프 자체가 다시 그래프에 포함되지 않도록 시각화만 Shadow DOM에 그립니다.
    // 원본 페이지의 숨겨진 요소를 포함하여 모든 일반 DOM 요소를 순회합니다.
    const graphRoot = graphHost.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
        :host { display: block; overflow: auto; max-height: 65vh; scrollbar-color: #42647d transparent; }
        svg { display: block; font-family: "Courier New", monospace; }
        .dom-edge { fill: none; stroke: #3c6585; stroke-width: 1.5; }
        .attacker-edge { stroke: #b44b63; }
        .restore-edge { stroke: #4ca77c; }
        .dom-node { cursor: pointer; outline: none; }
        .dom-node rect { fill: #142536; stroke: #527f9e; stroke-width: 1.5; }
        .dom-node text { fill: #b4dcf8; font-size: 12px; pointer-events: none; }
        .dom-node .node-detail {
            color: #87afcc; font-size: 11px; line-height: 17px;
            overflow: hidden; white-space: nowrap; text-overflow: ellipsis; pointer-events: none;
        }
        .dom-node:hover rect, .dom-node:focus-visible rect, .dom-node[aria-pressed="true"] rect {
            fill: #203b52; stroke: #b6e2ff; stroke-width: 2;
        }
        .is-attacker rect { fill: #3b1824; stroke: #f2768b; }
        .is-attacker text, .is-attacker .node-detail { fill: #ffb1bd; color: #ffb1bd; }
        .is-attacker:hover rect, .is-attacker:focus-visible rect, .is-attacker[aria-pressed="true"] rect {
            fill: #581e30; stroke: #ffb1bd;
        }
        .is-restore rect { fill: #15372b; stroke: #6dd7a1; }
        .is-restore text, .is-restore .node-detail { fill: #a4f1c6; color: #a4f1c6; }
        .is-restore:hover rect, .is-restore:focus-visible rect, .is-restore[aria-pressed="true"] rect {
            fill: #20513d; stroke: #b9ffda;
        }
    `;
    graphRoot.append(style);
    let selectedElement = null;
    let graph = null;

    function renderGraph() {
        const entries = [];

        function visit(element, depth, parent) {
            const entry = { element, depth, parent, x: 16 + depth * 28, y: 16 + entries.length * 58 };
            entries.push(entry);
            for (const child of element.children) {
                visit(child, depth + 1, entry);
            }
        }

        visit(document.documentElement, 0, null);
        const maxDepth = Math.max(...entries.map((entry) => entry.depth));
        const nextGraph = createSvgElement("svg", {
            width: 276 + maxDepth * 28,
            height: entries.length * 58 + 16,
            role: "group",
            "aria-label": "HTML 요소의 부모와 자식 관계"
        });

        for (const entry of entries) {
            const { element, parent, x, y } = entry;
            const isAttacker = element.id === "snake-attacker";
            const isRestore = element.id === "snake-restore";
            if (parent) {
                nextGraph.append(createSvgElement("path", {
                    d: `M ${parent.x + 12} ${parent.y + 42} V ${y + 21} H ${x}`,
                    class: `dom-edge${isAttacker ? " attacker-edge" : isRestore ? " restore-edge" : ""}`
                }));
            }

            const label = `${element.tagName}${element.id ? ` #${element.id}` : ""}`;
            const node = createSvgElement("g", {
                class: `dom-node${isAttacker ? " is-attacker" : isRestore ? " is-restore" : ""}`,
                transform: `translate(${x}, ${y})`,
                role: "button",
                tabindex: "0",
                "aria-label": `${label} 조사`,
                "aria-pressed": String(element === selectedElement)
            });
            const title = createSvgElement("text", { x: 12, y: 17 });
            title.textContent = element.tagName;
            // 긴 URL은 노드 안에서 줄이고, 전체 내용은 마우스를 올리면 보여 줍니다.
            const detailBox = createSvgElement("foreignObject", { x: 12, y: 22, width: 220, height: 17 });
            const detail = document.createElement("div");
            detail.className = "node-detail";
            detail.textContent = element.id ? `#${element.id}` : element.getAttribute("src")
                || element.getAttribute("href") || (element.hidden ? "hidden" : "");
            const tooltip = createSvgElement("title");
            tooltip.textContent = `${label}${detail.textContent ? `\n${detail.textContent}` : ""}`;
            detailBox.append(detail);
            node.append(tooltip, createSvgElement("rect", { width: 244, height: 42, rx: 6 }), title, detailBox);

            function selectNode() {
                selectedElement = element;
                for (const otherNode of nextGraph.querySelectorAll(".dom-node")) {
                    otherNode.setAttribute("aria-pressed", String(otherNode === node));
                }
                inspectElement(element, node);
            }

            node.addEventListener("click", selectNode);
            node.addEventListener("keydown", (event) => {
                if (event.code !== "Enter" && event.code !== "Space") return;
                event.preventDefault();
                selectNode();
            });
            nextGraph.append(node);
        }

        if (graph) graph.replaceWith(nextGraph);
        else graphRoot.append(nextGraph);
        graph = nextGraph;
    }

    renderGraph();
    domGraphObserver = new MutationObserver((changes) => {
        // 제목이나 조사 결과의 글자만 바뀌면 노드 구조를 다시 그리지 않습니다.
        const structureChanged = changes.some((change) => change.type === "attributes"
            || [...change.addedNodes, ...change.removedNodes].some((node) => node.nodeType === Node.ELEMENT_NODE));
        if (structureChanged) renderGraph();
    });
    domGraphObserver.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["id"] });
}

async function showDomInspector() {
    const inspector = document.querySelector("#dom-inspector");
    const button = document.querySelector("#repair-button");
    if (!button || !inspector.hidden) return;

    button.remove();
    const loadingMessage = addParagraph(reportMessages, "문제 해결사를 불러오는 중입니다...", "report-message report-status");
    console.info(loadingMessage.textContent);
    await wait(3000);
    if (attackerIsCracked) return;

    const message = "비정상적인 HTML 요소가 DOM에 삽입되었습니다. 문제를 자세히 조사하기 위해서 해당 요소에 접근해야 합니다.";
    addParagraph(reportMessages, message);
    console.info(message);
    inspector.hidden = false;
    document.querySelector(".report-shell").classList.add("is-inspecting");
    startDomGraph();
}

async function showDiagnosis() {
    await wait(350);
    addParagraph(reportMessages, "오류를 분석하는 중입니다...", "report-message report-status");

    const remainingDiagnoses = [...pseudoDiagnoses];
    for (let index = 0; index < 3; index += 1) {
        await wait(700);
        const randomIndex = Math.floor(Math.random() * remainingDiagnoses.length);
        const [diagnosis] = remainingDiagnoses.splice(randomIndex, 1);
        addParagraph(reportMessages, diagnosis, "report-message report-diagnosis");
    }

    await wait(800);
    addParagraph(reportMessages, "알 수 없는 공격에 의해 DOM이 오염되었습니다.", "report-message report-alert");

    await wait(700);
    addParagraph(reportMessages, "개발자 도구를 이용해 DOM을 복구하십시오.");

    await wait(500);
    const repairButton = document.createElement("button");
    repairButton.id = "repair-button";
    repairButton.className = "report-action";
    repairButton.type = "button";
    repairButton.textContent = "문제 해결사 불러오기";
    repairButton.setAttribute("aria-controls", "dom-inspector");
    repairButton.setAttribute("aria-expanded", "false");
    repairButton.addEventListener("click", showDomInspector);
    reportMessages.append(repairButton);
}

showDiagnosis();
