const STYLE_ID = 'three-renderstats-style';

const CSS = `
.three-renderstats {
  position: fixed;
  z-index: 10000;
  padding: 8px 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  line-height: 1.45;
  letter-spacing: 0.02em;
  color: rgb(255 255 255 / 88%);
  background-color: rgb(0 0 0 / 55%);
  border-radius: 4px;
  pointer-events: none;
  white-space: pre;
  user-select: none;
}
.three-renderstats--contained {
  position: absolute;
}
.three-renderstats--top-left { top: 12px; left: 12px; }
.three-renderstats--top-right { top: 12px; right: 12px; }
.three-renderstats--bottom-left { bottom: 12px; left: 12px; }
.three-renderstats--bottom-right { bottom: 12px; right: 12px; }
`.trim();

export function injectDefaultStyles(): void {
    if (typeof document === 'undefined') {
        return;
    }

    if (document.getElementById(STYLE_ID)) {
        return;
    }

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
}
