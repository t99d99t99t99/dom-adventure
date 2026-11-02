// 긴 DOM 조회 명령 대신 게임의 여러 페이지에서 사용할 수 있는 짧은 명령입니다.
export function element(id) {
    return document.getElementById(id);
}

// 사용자 정의 요소의 생성자도 document.createElement()와 똑같이 실행됩니다.
export function create(tagName, options) {
    return document.createElement(tagName, options);
}

// ES 모듈에서 내보낸 함수들을 개발자 도구의 콘솔에서도 사용할 수 있게 합니다.
window.element = element;
window.create = create;
