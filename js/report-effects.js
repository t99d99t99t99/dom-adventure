import { randomErrorCharacter, randomErrorText } from "./shared/random-text.js";

let barrierPulseFrame = 0;
let barrierIsBreaking = false;

export function pulseBarrierNearNode(node) {
    const barrier = document.querySelector("#barrier");
    if (!barrier || barrierIsBreaking) return;

    window.cancelAnimationFrame(barrierPulseFrame);
    const bounds = node.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const pixelRatio = window.devicePixelRatio || 1;
    const context = barrier.getContext("2d");
    barrier.width = Math.ceil(window.innerWidth * pixelRatio);
    barrier.height = Math.ceil(window.innerHeight * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const startedAt = performance.now();

    function animate(now) {
        if (!barrier.isConnected || barrierIsBreaking) return;
        const progress = Math.min((now - startedAt) / 650, 1);
        context.clearRect(0, 0, window.innerWidth, window.innerHeight);
        if (progress === 1) return;

        const radius = 180;
        const glow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        glow.addColorStop(0, `rgba(255, 45, 70, ${Math.sin(progress * Math.PI) * 0.85})`);
        glow.addColorStop(1, "rgba(255, 45, 70, 0)");
        context.fillStyle = glow;
        context.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
        barrierPulseFrame = window.requestAnimationFrame(animate);
    }

    barrierPulseFrame = window.requestAnimationFrame(animate);
}

export function shatterBarrier(barrier) {
    if (barrierIsBreaking) return;
    barrierIsBreaking = true;
    window.cancelAnimationFrame(barrierPulseFrame);
    document.body.append(barrier);

    const width = window.innerWidth;
    const height = window.innerHeight;
    const context = barrier.getContext("2d");
    const surface = document.createElement("canvas");
    surface.width = width;
    surface.height = height;
    const surfaceContext = surface.getContext("2d");
    surfaceContext.fillStyle = window.getComputedStyle(barrier).backgroundColor;
    surfaceContext.fillRect(0, 0, width, height);
    surfaceContext.fillStyle = "#111923";
    for (let x = 0; x < width; x += 24) surfaceContext.fillRect(x, 0, 1, height);
    for (let y = 0; y < height; y += 24) surfaceContext.fillRect(0, y, width, 1);

    barrier.width = width;
    barrier.height = height;
    barrier.style.background = "none";
    barrier.style.pointerEvents = "none";
    barrier.classList.add("is-shattering");

    // 이웃한 삼각형이 꼭짓점을 공유하도록 만들어 유리판 전체를 빈틈없이 나눕니다.
    const columns = Math.ceil(width / 110);
    const rows = Math.ceil(height / 110);
    const points = [];
    for (let row = 0; row <= rows; row += 1) {
        const line = [];
        for (let column = 0; column <= columns; column += 1) {
            const jitterX = column === 0 || column === columns ? 0 : (Math.random() - 0.5) * 55;
            const jitterY = row === 0 || row === rows ? 0 : (Math.random() - 0.5) * 55;
            line.push({ x: column * width / columns + jitterX, y: row * height / rows + jitterY });
        }
        points.push(line);
    }

    const shards = [];
    function addShard(vertices) {
        const centerX = vertices.reduce((sum, point) => sum + point.x, 0) / 3;
        const centerY = vertices.reduce((sum, point) => sum + point.y, 0) / 3;
        shards.push({
            vertices, centerX, centerY,
            velocityX: (centerX - width * 0.6) * 0.55 + (Math.random() - 0.5) * 130,
            velocityY: -80 - Math.random() * 180,
            rotation: (Math.random() - 0.5) * 3,
            delay: 180 + Math.hypot(centerX - width * 0.6, centerY - height * 0.45) * 0.15
        });
    }

    for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
            const topLeft = points[row][column];
            const topRight = points[row][column + 1];
            const bottomLeft = points[row + 1][column];
            const bottomRight = points[row + 1][column + 1];
            if (Math.random() < 0.5) {
                addShard([topLeft, topRight, bottomRight]);
                addShard([topLeft, bottomRight, bottomLeft]);
            } else {
                addShard([topLeft, topRight, bottomLeft]);
                addShard([topRight, bottomRight, bottomLeft]);
            }
        }
    }

    const startedAt = performance.now();
    function animate(now) {
        const elapsed = now - startedAt;
        context.clearRect(0, 0, width, height);
        if (elapsed > 2000) {
            barrier.remove();
            const link = document.querySelector("#abyss-link");
            link.removeAttribute("aria-hidden");
            link.removeAttribute("tabindex");
            return;
        }

        for (const shard of shards) {
            const time = Math.max(0, elapsed - shard.delay) / 1000;
            context.save();
            context.globalAlpha = Math.max(0, 1 - time / 1.6);
            context.translate(
                shard.centerX + shard.velocityX * time,
                shard.centerY + shard.velocityY * time + height * time * time
            );
            context.rotate(shard.rotation * time);
            context.beginPath();
            shard.vertices.forEach((point, index) => {
                const x = point.x - shard.centerX;
                const y = point.y - shard.centerY;
                if (index === 0) context.moveTo(x, y);
                else context.lineTo(x, y);
            });
            context.closePath();
            context.save();
            context.clip();
            context.drawImage(surface, -shard.centerX, -shard.centerY);
            context.restore();
            context.strokeStyle = "#b4c9d58c";
            context.lineWidth = 1;
            context.stroke();
            context.restore();
        }
        window.requestAnimationFrame(animate);
    }

    window.requestAnimationFrame(animate);
}

export async function dropPageElements() {
    const shell = document.querySelector(".report-shell");
    shell.inert = true;
    const graph = document.querySelector("#dom-graph").shadowRoot;
    const pieces = [
        ...shell.querySelectorAll(".report-header > *, #report-messages > *, .dom-inspector > h2, .dom-instructions, #element-details"),
        ...(graph?.querySelectorAll(".dom-node") || [])
    ];

    function drop(piece, delay) {
        const distance = window.innerHeight + piece.getBoundingClientRect().height + 100;
        // 개별 이동과 회전을 사용하여 SVG 노드의 원래 배치를 유지한 채 떨어뜨립니다.
        return piece.animate([
            { translate: "0px 0px", rotate: "0deg", opacity: 1 },
            { translate: "-4px 1px", rotate: "-2deg", offset: 0.06 },
            { translate: "4px -2px", rotate: "2deg", offset: 0.12 },
            { translate: "-3px 2px", rotate: "-1deg", offset: 0.18 },
            { translate: "0px 0px", rotate: "0deg", offset: 0.24, easing: "cubic-bezier(.55, 0, 1, 1)" },
            { translate: `${(Math.random() - 0.5) * 240}px ${distance}px`, rotate: `${(Math.random() - 0.5) * 65}deg`, opacity: 0 }
        ], { duration: 1500, delay, fill: "forwards" });
    }

    const animations = pieces.map(piece => drop(piece, Math.random() * 300));
    animations.push(drop(document.querySelector("#dom-inspector"), 500));
    await Promise.all(animations.map(animation => animation.finished));
    shell.hidden = true;
}

export function revealAttacker(attacker) {
    attacker.hidden = false;
    attacker.setAttribute("aria-hidden", "true");
    const text = document.createTextNode("");
    attacker.replaceChildren(text);
    const characters = [...randomErrorText(60)];
    let fillStartedAt = null;
    let lastUpdateAt = 0;

    function getScreenCapacity() {
        const style = window.getComputedStyle(attacker);
        const context = document.createElement("canvas").getContext("2d");
        context.font = `${style.fontSize} ${style.fontFamily}`;
        const characterWidth = context.measureText("M").width + parseFloat(style.letterSpacing);
        const columns = Math.ceil((window.innerWidth - 32) / characterWidth);
        const rows = Math.ceil((window.innerHeight - 32) / parseFloat(style.lineHeight));
        return columns * (rows + 1);
    }

    let capacity = getScreenCapacity();
    window.addEventListener("resize", () => { capacity = getScreenCapacity(); });

    function animate(now) {
        if (now - lastUpdateAt >= 25) {
            lastUpdateAt = now;
            if (fillStartedAt !== null) {
                const progress = Math.min((now - fillStartedAt) / 8000, 1);
                const length = Math.round(60 + (capacity - 60) * progress);
                while (characters.length < length) characters.push(randomErrorCharacter());
                if (progress === 1) attacker.dataset.filled = "true";
            }

            // 선택한 글자만 하나씩 빠르게 바꿉니다.
            const changes = Math.max(1, Math.ceil(characters.length * 0.01));
            for (let index = 0; index < changes; index += 1) {
                const position = Math.floor(Math.random() * characters.length);
                characters[position] = randomErrorCharacter();
            }
            text.data = characters.join("");
        }
        window.requestAnimationFrame(animate);
    }

    text.data = characters.join("");
    window.requestAnimationFrame(animate);
    return function startFillingScreen() {
        fillStartedAt = performance.now();
    };
}
