class ElementorDXCssSnippets {
  constructor() {
    this.init();
  }

  init() {
    this.injectStyles();
    this.setupDynamicPanelObserver();
  }

  injectStyles() {
    if (document.getElementById("dx-css-snippets-styles")) return;

    const style = document.createElement("style");
    style.id = "dx-css-snippets-styles";
    style.textContent = `
      .dx-css-toolbar {
        display: flex;
        gap: 5px;
        margin-bottom: 8px;
        flex-wrap: wrap;
      }
      .dx-css-btn {
        background: #f4f6f7;
        border: 1px solid #d5dadf;
        padding: 4px 8px;
        font-size: 11px;
        cursor: pointer;
        border-radius: 3px;
      }
      .dx-css-btn:hover {
        background: #e1e8ed;
      }
    `;
    document.head.appendChild(style);
  }

  setupDynamicPanelObserver() {
    const panel = document.getElementById("elementor-panel");
    if (!panel) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          const codeEditors = document.querySelectorAll(
            ".elementor-control-type-code",
          );
          codeEditors.forEach((editorControl) => {
            this.injectCssToolbar(editorControl);
          });
        }
      });
    });

    observer.observe(panel, { childList: true, subtree: true });
  }

  injectCssToolbar(controlElement) {
    if (controlElement.querySelector(".dx-css-toolbar")) return;

    const inputWrapper = controlElement.querySelector(
      ".elementor-control-input-wrapper",
    );
    const aceEditorElement = controlElement.querySelector(".ace_editor");

    if (!inputWrapper || !aceEditorElement) return;

    const toolbar = document.createElement("div");
    toolbar.className = "dx-css-toolbar";
    toolbar.innerHTML = `
      <span class="dx-css-btn" data-type="block" data-snippet="\\nselector {\\n  \\n}">{} selector</span>
      <span class="dx-css-btn" data-type="block" data-snippet="\\n@media (max-width: 767px) {\\n  selector {\\n    \\n  }\\n}">@767</span>
      <span class="dx-css-btn" data-type="block" data-snippet="\\n@media (max-width: 880px) {\\n  selector {\\n    \\n  }\\n}">@880</span>
      <span class="dx-css-btn" data-type="block" data-snippet="\\n@media (max-width: 1024px) {\\n  selector {\\n    \\n  }\\n}">@1024</span>
      <span class="dx-css-btn" data-type="block" data-snippet="\\n@media (max-width: 1366px) {\\n  selector {\\n    \\n  }\\n}">@1366</span>
      <span class="dx-css-btn" data-type="inline" data-snippet="flex: 0 0 100%;\\n">@flex-full</span>
    `;

    inputWrapper.parentNode.insertBefore(toolbar, inputWrapper);

    const buttons = toolbar.querySelectorAll(".dx-css-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const snippet = btn.dataset.snippet.replace(/\\n/g, "\n");
        const type = btn.dataset.type;
        this.insertIntoAceEditor(aceEditorElement, snippet, type);
      });
    });
  }

  insertIntoAceEditor(aceDomElement, text, type = "block") {
    if (typeof window.ace !== "undefined") {
      const editor = window.ace.edit(aceDomElement);
      const session = editor.getSession();

      if (type === "inline") {
        const cursorPos = editor.getCursorPosition();
        session.insert(cursorPos, text);
        editor.focus();
      } else {
        const lastRow = session.getLength();
        session.insert({ row: lastRow, column: 0 }, text);
        editor.focus();

        const newLastRow = session.getLength();
        editor.gotoLine(newLastRow - 1, 2);
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ElementorDXCssSnippets();
});
