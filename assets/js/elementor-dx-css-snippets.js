class ElementorDXCssSnippets {
  constructor() {
    this.snippets = [
      // Base & States
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

      // Media Queries
      {
        label: "@767",
        title: "Mobile (max-width: 767px)",
        type: "block",
        code: "\n@media (max-width: 767px) {\n  selector {\n    \n  }\n}",
      },
      {
        label: "@880",
        title: "Tablet Portrait (max-width: 880px)",
        type: "block",
        code: "\n@media (max-width: 880px) {\n  selector {\n    \n  }\n}",
      },
      {
        label: "@1024",
        title: "Tablet Landscape (max-width: 1024px)",
        type: "block",
        code: "\n@media (max-width: 1024px) {\n  selector {\n    \n  }\n}",
      },
      {
        label: "@1366",
        title: "Laptop (max-width: 1366px)",
        type: "block",
        code: "\n@media (max-width: 1366px) {\n  selector {\n    \n  }\n}",
      },

      // Layout (Inline)
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

      // Utilities (Inline & Block)
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
        title: "Hide Scrollbars (Cross-browser)",
        type: "block",
        code: "\nselector::-webkit-scrollbar {\n  display: none;\n}\nselector {\n  -ms-overflow-style: none;\n  scrollbar-width: none;\n}",
      },
    ];

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
      .dx-css-toolbar-wrapper {
        background: #1e1e1e;
        border: 1px solid #444;
        border-radius: 4px;
        padding: 6px 8px;
        margin-bottom: 8px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .dx-css-toolbar-header {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 9px;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: bold;
        pointer-events: none;
      }
      .dx-css-toolbar {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
      }
      .dx-css-btn {
        background: #2b2b2b;
        color: #aaa;
        border: 1px solid #444;
        padding: 4px 6px;
        font-size: 10px;
        font-family: monospace;
        cursor: pointer;
        border-radius: 3px;
        transition: all 0.2s;
        line-height: 1;
      }
      .dx-css-btn:hover {
        background: #333;
        color: #fff;
        border-color: #777;
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
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
    // Prevent duplicate injections
    if (controlElement.querySelector(".dx-css-toolbar-wrapper")) return;

    const inputWrapper = controlElement.querySelector(
      ".elementor-control-input-wrapper",
    );
    const aceEditorElement = controlElement.querySelector(".ace_editor");

    if (!inputWrapper || !aceEditorElement) return;

    // Build the master wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "dx-css-toolbar-wrapper";

    // Build the header
    const header = document.createElement("div");
    header.className = "dx-css-toolbar-header";
    header.innerHTML = `
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
      </svg>
      DX Snippets
    `;

    // Build the toolbar grid
    const toolbar = document.createElement("div");
    toolbar.className = "dx-css-toolbar";

    // Inject buttons from snippet library dynamically
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

    // Inject right above the Ace Editor
    inputWrapper.parentNode.insertBefore(wrapper, inputWrapper);
  }

  insertIntoAceEditor(aceDomElement, text, type = "block") {
    if (typeof window.ace !== "undefined") {
      const editor = window.ace.edit(aceDomElement);
      const session = editor.getSession();

      if (type === "inline") {
        // Insert exactly where the cursor is
        const cursorPos = editor.getCursorPosition();
        session.insert(cursorPos, text);
        editor.focus();
      } else {
        // Append block to the very bottom
        const lastRow = session.getLength();
        session.insert({ row: lastRow, column: 0 }, text);
        editor.focus();

        // Move cursor inside the newly generated curly braces for immediate typing
        const newLastRow = session.getLength();
        editor.gotoLine(newLastRow - 1, 4);
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ElementorDXCssSnippets();
});
