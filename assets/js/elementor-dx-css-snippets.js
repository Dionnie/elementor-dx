class ElementorDXCssSnippets {
  constructor() {
    this.snippets = [
      {
        label: "{}",
        title: "Base Selector",
        type: "block",
        code: "\nselector {\n  \n}",
      },
      {
        label: ":hover",
        title: "Hover State",
        type: "block",
        code: "\nselector:hover {\n  \n}",
      },
      {
        label: "@767",
        title: "Mobile",
        type: "block",
        code: "\n@media (max-width: 767px) {\n  selector {\n    \n  }\n}",
      },
      {
        label: "@880",
        title: "Tablet Portrait",
        type: "block",
        code: "\n@media (max-width: 880px) {\n  selector {\n    \n  }\n}",
      },
      {
        label: "@1024",
        title: "Tablet Landscape",
        type: "block",
        code: "\n@media (max-width: 1024px) {\n  selector {\n    \n  }\n}",
      },
      {
        label: "@1366",
        title: "Laptop",
        type: "block",
        code: "\n@media (max-width: 1366px) {\n  selector {\n    \n  }\n}",
      },
      {
        label: "flex: 100%",
        title: "Full Width Flex Child",
        type: "inline",
        code: "flex: 0 0 100%;\n",
      },
      {
        label: "flex: fit",
        title: "Flex Basis Fit Content",
        type: "inline",
        code: "flex-basis: fit-content;\n",
      },
      {
        label: "grid-auto",
        title: "Responsive Auto-Fit Grid",
        type: "inline",
        code: "display: grid;\ngrid-template-columns: repeat(auto-fit, minmax(250px, 1fr));\ngap: 1rem;\n",
      },
      {
        label: "abs-center",
        title: "Absolute Center",
        type: "inline",
        code: "position: absolute;\ntop: 50%;\nleft: 50%;\ntransform: translate(-50%, -50%);\n",
      },
      {
        label: "line-clamp",
        title: "Truncate text to 3 lines",
        type: "inline",
        code: "display: -webkit-box;\n-webkit-line-clamp: 3;\n-webkit-box-orient: vertical;\noverflow: hidden;\n",
      },
      {
        label: "glass",
        title: "Glassmorphism Blur Effect",
        type: "inline",
        code: "background: rgba(255, 255, 255, 0.05);\nbackdrop-filter: blur(10px);\n-webkit-backdrop-filter: blur(10px);\nborder: 1px solid rgba(255, 255, 255, 0.1);\n",
      },
      {
        label: "hide-scroll",
        title: "Hide Scrollbars",
        type: "block",
        code: "\nselector::-webkit-scrollbar {\n  display: none;\n}\nselector {\n  -ms-overflow-style: none;\n  scrollbar-width: none;\n}",
      },
    ];

    this.init();
  }

  init() {
    this.setupDynamicPanelObserver();
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
    if (controlElement.querySelector(".dx-snippets-host")) return;

    const inputWrapper = controlElement.querySelector(
      ".elementor-control-input-wrapper",
    );
    const aceEditorElement = controlElement.querySelector(".ace_editor");

    if (!inputWrapper || !aceEditorElement) return;

    // 1. Create the Shadow Host
    const host = document.createElement("div");
    host.className = "dx-snippets-host";
    host.style.cssText = "width: 100%; margin-bottom: 8px;";

    const shadow = host.attachShadow({ mode: "open" });

    // 2. Inject Styles
    const styles = document.createElement("style");
    styles.innerHTML = `
      :host { all: initial; font-family: sans-serif; }
      * { box-sizing: border-box; }
      button { appearance: none; -webkit-appearance: none; border: none; padding: 0; margin: 0; outline: none; }

      .dx-css-toolbar-wrapper {
        background: #1e1e1e; border: 1px solid #444; border-radius: 4px;
        padding: 8px; display: flex; flex-direction: column; gap: 8px;
      }
      .dx-css-toolbar-header {
        display: flex; align-items: center; gap: 6px; font-size: 9px;
        color: #888; text-transform: uppercase; letter-spacing: 0.5px;
        font-weight: bold; pointer-events: none;
      }
      .dx-css-toolbar { display: flex; gap: 6px; flex-wrap: wrap; }
      
      .dx-css-btn {
        background: #222; color: #aaa; border: 1px solid #444;
        padding: 6px 8px; font-size: 10px; font-family: monospace; font-weight: bold;
        cursor: pointer; border-radius: 3px; transition: all 0.2s; line-height: 1;
      }
      .dx-css-btn:hover {
        background: #2A0624; color: #F2ADF3; border-color: #620856;
        transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      }
      .dx-css-btn:active { transform: scale(0.95); box-shadow: none; }
      svg { display: block; }
    `;
    shadow.appendChild(styles);

    // 3. Inject UI
    const wrapper = document.createElement("div");
    wrapper.className = "dx-css-toolbar-wrapper";

    const header = document.createElement("div");
    header.className = "dx-css-toolbar-header";
    header.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
      </svg>
      DX Snippets
    `;

    const toolbar = document.createElement("div");
    toolbar.className = "dx-css-toolbar";

    this.snippets.forEach((snip) => {
      const btn = document.createElement("button");
      btn.className = "dx-css-btn";
      btn.title = snip.title;
      btn.innerText = snip.label;

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        this.insertIntoAceEditor(aceEditorElement, snip.code, snip.type);
      });

      toolbar.appendChild(btn);
    });

    wrapper.appendChild(header);
    wrapper.appendChild(toolbar);
    shadow.appendChild(wrapper);

    inputWrapper.parentNode.insertBefore(host, inputWrapper);
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
        editor.gotoLine(newLastRow - 1, 4);
      }
    }
  }
}
