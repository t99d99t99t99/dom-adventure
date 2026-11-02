// 공격자와 심연의 배경에서 공통으로 사용하는 무작위 기호입니다.
export function randomErrorCharacter() {
    const ranges = [[33, 47], [58, 64], [91, 96], [123, 126]];
    const [first, last] = ranges[Math.floor(Math.random() * ranges.length)];
    return String.fromCharCode(first + Math.floor(Math.random() * (last - first + 1)));
}

export function randomErrorText(length = 13 + Math.floor(Math.random() * 8)) {
    return Array.from({ length }, randomErrorCharacter).join("");
}
