class ElementorDXGodMode {
  constructor() {
    this.apiUrl = elementorDxSettings.root + "elementordx/v1/kit";
    this.nonce = elementorDxSettings.nonce;
    this.flatTokens = [];
    this.originalTokenMap = new Map();
    this.previewedVars = new Set();
    this.currentView = "ui";
    this.init();
  }

  init() {
    this.injectFloatingUI();
    this.bindEvents();
    this.fetchKitData();
  }

  injectFloatingUI() {
    if (document.getElementById("dx-godmode-wrapper")) return;

    // Inject minimal scoped styles
    const styles = document.createElement("style");
    styles.id = "dx-godmode-styles";
    styles.innerHTML = `
      .dx-gm-icon-btn {
        background: transparent; border: 1px solid #444; color: #aaa; 
        padding: 6px; cursor: pointer; border-radius: 4px; 
        display: flex; align-items: center; justify-content: center;
        transition: all 0.2s;
      }
      .dx-gm-icon-btn:hover { background: #333; color: #fff; border-color: #666; }
      
      .dx-gm-min-btn {
        background: transparent; border: none; color: #aaa; 
        padding: 6px; cursor: pointer; border-radius: 4px; 
        display: flex; align-items: center; justify-content: center;
        transition: all 0.2s; margin-right: -4px;
      }
      .dx-gm-min-btn:hover { background: #333; color: #fff; }

      .dx-gm-search-wrapper {
        position: relative; margin-bottom: 10px;
      }
      .dx-gm-search-wrapper svg {
        position: absolute; left: 8px; top: 50%; transform: translateY(-50%); color: #888;
      }
      .dx-gm-search-input {
        width: 100%; background: #1e1e1e; color: #fff; border: 1px solid #444; 
        border-radius: 4px; padding: 6px 8px 6px 26px; font-size: 11px;
        box-sizing: border-box; outline: none; transition: border-color 0.2s;
      }
      .dx-gm-search-input:focus { border-color: #3498db; }

      .dx-gm-row {
        display: flex; align-items: center; justify-content: space-between;
        background: #222; border: 1px solid #333; border-radius: 4px;
        padding: 4px 6px; margin-bottom: 4px; gap: 8px;
      }
      .dx-gm-row-left {
        display: flex; flex-direction: column; overflow: hidden;
      }
      .dx-gm-label {
        font-size: 10px; font-weight: bold; color: #ddd; white-space: nowrap; 
        overflow: hidden; text-overflow: ellipsis; cursor: pointer;
        transition: color 0.2s;
      }
      .dx-gm-label:hover { color: #3498db; }
      .dx-gm-var {
        font-size: 9px; color: #777; font-family: monospace;
      }
      .dx-gm-input {
        width: 110px; background: #111; color: #00ffcc; border: 1px solid #444;
        border-radius: 3px; padding: 4px 6px; font-size: 10px; font-family: monospace;
        outline: none; text-align: right; transition: border-color 0.2s; flex-shrink: 0;
      }
      .dx-gm-input:focus { border-color: #61ce70; }
    `;
    document.head.appendChild(styles);

    const wrapper = document.createElement("div");
    wrapper.id = "dx-godmode-wrapper";
    // Centered bottom placement for global tool
    wrapper.style.cssText = `
      position: fixed; bottom: 40px; right: 40px; width: 380px; background: #2b2b2b;
      border: 1px solid #444; border-radius: 6px; box-shadow: 0 15px 40px rgba(0,0,0,0.6);
      z-index: 999999; font-family: sans-serif; display: flex; flex-direction: column;
    `;

    wrapper.innerHTML = `
      <!-- Draggable Header -->
      <div id="dx-gm-drag-handle" style="cursor: grab; background: #1e1e1e; padding: 10px 12px; border-radius: 6px 6px 0 0; border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center;">
        <h4 style="margin:0; color:#fff; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; pointer-events: none;">⚡ God Mode Explorer</h4>
        <div style="display:flex; align-items:center; gap: 8px;">
          <span id="dx-gm-status" style="font-size: 9px; font-weight: bold; color: #61ce70; text-transform: uppercase; pointer-events: none;">Live</span>
          <button id="dx-gm-btn-minimize" class="dx-gm-min-btn" title="Toggle Panel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </div>
      </div>

      <!-- Main Body Content -->
      <div id="dx-gm-body" style="padding: 12px; display: none;"> <!-- Hidden by default to save space -->
        
        <!-- Action Buttons -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div style="display:flex; gap:6px;">
            <button id="dx-gm-btn-refresh" class="dx-gm-icon-btn" title="Sync from Database">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
            </button>
            <button id="dx-gm-btn-copy-css" class="dx-gm-icon-btn" title="Copy Edits as Root CSS">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
            </button>
          </div>
          
          <!-- Workspace Tabs -->
          <div id="dx-gm-workspace-tabs" style="display:flex; gap:4px; font-size:10px;">
            <button id="dx-gm-tab-ui" style="background:#444; border:none; color:#fff; padding:4px 8px; cursor:pointer; border-radius:3px;">UI</button>
            <button id="dx-gm-tab-raw" style="background:#222; border:none; color:#aaa; padding:4px 8px; cursor:pointer; border-radius:3px;">RAW</button>
          </div>
        </div>

        <!-- Workspace Container -->
        <div id="dx-gm-workspace" style="display:block;">
          
          <!-- Workspace: UI -->
          <div id="dx-gm-view-ui" style="display:block;">
            <div class="dx-gm-search-wrapper">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" id="dx-gm-search" class="dx-gm-search-input" placeholder="Search tokens by name, value, or variable...">
            </div>
            <div id="dx-gm-list" style="max-height: 280px; overflow-y: auto; padding-right: 4px;"></div>
          </div>

          <!-- Workspace: RAW -->
          <div id="dx-gm-view-raw" style="display:none;">
            <textarea id="dx-gm-json-input" spellcheck="false" rows="18" style="width:100%; background:#121212; color:#00ffcc; border:1px solid #444; border-radius:4px; padding:8px; font-family:monospace; font-size:10px; resize:vertical; box-sizing: border-box;" placeholder="Edit raw token JSON here..."></textarea>
          </div>
        </div>

      </div>
    `;

    document.body.appendChild(wrapper);

    this.makeDraggable(wrapper, document.getElementById("dx-gm-drag-handle"));
  }

  makeDraggable(element, handle) {
    let pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0;
    handle.onmousedown = (e) => {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      handle.style.cursor = "grabbing";
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    };
    const elementDrag = (e) => {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      element.style.top = element.offsetTop - pos2 + "px";
      element.style.left = element.offsetLeft - pos1 + "px";
      element.style.right = "auto";
      element.style.bottom = "auto";
    };
    const closeDragElement = () => {
      document.onmouseup = null;
      document.onmousemove = null;
      handle.style.cursor = "grab";
    };
  }

  bindEvents() {
    const tabUi = document.getElementById("dx-gm-tab-ui");
    const tabRaw = document.getElementById("dx-gm-tab-raw");
    const viewUi = document.getElementById("dx-gm-view-ui");
    const viewRaw = document.getElementById("dx-gm-view-raw");
    const btnRefresh = document.getElementById("dx-gm-btn-refresh");
    const btnCopyCss = document.getElementById("dx-gm-btn-copy-css");
    const btnMinimize = document.getElementById("dx-gm-btn-minimize");
    const bodyContent = document.getElementById("dx-gm-body");
    const searchInput = document.getElementById("dx-gm-search");
    const textarea = document.getElementById("dx-gm-json-input");

    // Minimize Toggle
    btnMinimize.onmousedown = (e) => e.stopPropagation();
    btnMinimize.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (bodyContent.style.display === "none") {
        bodyContent.style.display = "block";
        btnMinimize.innerHTML =
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
      } else {
        bodyContent.style.display = "none";
        btnMinimize.innerHTML =
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>';
      }
    };

    // Tabs
    tabUi.onclick = (e) => {
      e.preventDefault();
      this.currentView = "ui";
      viewUi.style.display = "block";
      viewRaw.style.display = "none";
      tabUi.style.background = "#444";
      tabUi.style.color = "#fff";
      tabRaw.style.background = "#222";
      tabRaw.style.color = "#aaa";
      this.renderUIList(); // Re-render to catch any valid RAW changes
    };

    tabRaw.onclick = (e) => {
      e.preventDefault();
      this.currentView = "raw";
      viewUi.style.display = "none";
      viewRaw.style.display = "block";
      tabRaw.style.background = "#444";
      tabRaw.style.color = "#fff";
      tabUi.style.background = "#222";
      tabUi.style.color = "#aaa";
    };

    // Actions
    btnRefresh.onclick = async (e) => {
      e.preventDefault();
      await this.fetchKitData();
      this.setStatus("Synced", "success");
    };

    btnCopyCss.onclick = (e) => {
      e.preventDefault();
      let cssOutput = ":root {\n";
      this.flatTokens.forEach((t) => {
        const baseline = this.originalTokenMap.get(t.css_var);
        if (t.value !== baseline) {
          // Only copy changed values
          cssOutput += `  ${t.css_var}: ${t.value};\n`;
        }
      });
      cssOutput += "}";
      navigator.clipboard
        .writeText(cssOutput)
        .then(() => this.setStatus("CSS Copied", "success"));
    };

    // Search Engine
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase();
      const rows = document.querySelectorAll(".dx-gm-row");
      rows.forEach((row) => {
        const text = row.dataset.search.toLowerCase();
        row.style.display = text.includes(query) ? "flex" : "none";
      });
    });

    // RAW Editor Live Engine
    textarea.addEventListener("input", () => {
      try {
        const parsed = JSON.parse(textarea.value);
        if (Array.isArray(parsed)) {
          this.flatTokens = parsed;
          this.livePreview();
          this.setStatus("Live", "success");
        }
      } catch (err) {
        this.setStatus("Syntax Error", "error");
      }
    });
  }

  async fetchKitData() {
    try {
      const res = await fetch(this.apiUrl, {
        method: "GET",
        headers: { "X-WP-Nonce": this.nonce },
      });
      if (res.ok) {
        const data = await res.json();
        this.flattenKitData(data);
      }
    } catch (e) {
      this.setStatus("API Error", "error");
    }
  }

  flattenKitData(kit) {
    this.flatTokens = [];
    this.originalTokenMap.clear();

    const allColors = [
      ...(kit.system_colors || []),
      ...(kit.custom_colors || []),
    ];
    allColors.forEach((c) => {
      if (c._id && c.color) {
        this.flatTokens.push({
          label: c.title || "Color",
          css_var: `--e-global-color-${c._id}`,
          value: c.color,
        });
      }
    });

    const allTypo = [
      ...(kit.system_typography || []),
      ...(kit.custom_typography || []),
    ];
    allTypo.forEach((t) => {
      if (!t._id) return;
      const prefix = `--e-global-typography-${t._id}`;
      const label = t.title || "Typography";

      if (t.typography_font_family) {
        this.flatTokens.push({
          label: `${label} (Font)`,
          css_var: `${prefix}-font-family`,
          value: `"${t.typography_font_family}"`,
        });
      }
      if (t.typography_font_weight) {
        this.flatTokens.push({
          label: `${label} (Weight)`,
          css_var: `${prefix}-font-weight`,
          value: t.typography_font_weight.toString(),
        });
      }
      if (t.typography_font_size && t.typography_font_size.size) {
        const unit = t.typography_font_size.unit || "px";
        const val =
          unit === "custom"
            ? t.typography_font_size.size
            : `${t.typography_font_size.size}${unit}`;
        this.flatTokens.push({
          label: `${label} (Size)`,
          css_var: `${prefix}-font-size`,
          value: val,
        });
      }
      if (t.typography_line_height && t.typography_line_height.size) {
        const unit = t.typography_line_height.unit || "em";
        const val =
          unit === "custom"
            ? t.typography_line_height.size
            : `${t.typography_line_height.size}${unit}`;
        this.flatTokens.push({
          label: `${label} (Line Height)`,
          css_var: `${prefix}-line-height`,
          value: val,
        });
      }
    });

    this.flatTokens.forEach((t) =>
      this.originalTokenMap.set(t.css_var, t.value),
    );

    this.syncTextarea();
    this.renderUIList();
  }

  renderUIList() {
    const listContainer = document.getElementById("dx-gm-list");
    if (!listContainer) return;
    listContainer.innerHTML = "";

    this.flatTokens.forEach((token, index) => {
      const row = document.createElement("div");
      row.className = "dx-gm-row";
      // Data attribute for high-performance searching
      row.dataset.search = `${token.label} ${token.css_var} ${token.value}`;

      // Left Side: Label & Var
      const left = document.createElement("div");
      left.className = "dx-gm-row-left";

      const label = document.createElement("div");
      label.className = "dx-gm-label";
      label.title = "Click to copy var()";
      label.innerText = token.label;
      label.onclick = () => {
        const v = `var(${token.css_var})`;
        navigator.clipboard
          .writeText(v)
          .then(() => this.setStatus("Copied!", "success"));
      };

      const cssVar = document.createElement("div");
      cssVar.className = "dx-gm-var";
      cssVar.innerText = token.css_var;

      left.appendChild(label);
      left.appendChild(cssVar);

      // Right Side: Input
      const input = document.createElement("input");
      input.type = "text";
      input.className = "dx-gm-input";
      input.value = token.value;

      // Highlight modified values
      if (token.value !== this.originalTokenMap.get(token.css_var)) {
        input.style.borderColor = "#e67e22";
        input.style.color = "#e67e22";
      }

      input.addEventListener("input", (e) => {
        // 1. Update master state
        this.flatTokens[index].value = e.target.value;

        // 2. Update search string
        row.dataset.search = `${token.label} ${token.css_var} ${e.target.value}`;

        // 3. Highlight changes
        if (e.target.value !== this.originalTokenMap.get(token.css_var)) {
          input.style.borderColor = "#e67e22";
          input.style.color = "#e67e22";
        } else {
          input.style.borderColor = "#444";
          input.style.color = "#00ffcc";
        }

        // 4. Sync RAW tab and Live Preview
        this.syncTextarea();
        this.livePreview();
      });

      row.appendChild(left);
      row.appendChild(input);
      listContainer.appendChild(row);
    });

    // Re-apply current search filter if any
    const searchInput = document.getElementById("dx-gm-search");
    if (searchInput && searchInput.value) {
      searchInput.dispatchEvent(new Event("input"));
    }
  }

  syncTextarea() {
    const textarea = document.getElementById("dx-gm-json-input");
    if (textarea) {
      textarea.value = JSON.stringify(this.flatTokens, null, 2);
    }
  }

  livePreview() {
    const targetNodes = [document.documentElement, document.body];
    const kitElement = document.querySelector('[class*="elementor-kit-"]');
    if (kitElement) targetNodes.push(kitElement);

    const iframe = document.getElementById("elementor-preview-iframe");
    if (iframe && iframe.contentDocument) {
      const iframeDoc = iframe.contentDocument;
      targetNodes.push(iframeDoc.documentElement, iframeDoc.body);
      const iframeKit = iframeDoc.querySelector('[class*="elementor-kit-"]');
      if (iframeKit) targetNodes.push(iframeKit);
    }

    const currentVars = new Set();

    this.flatTokens.forEach((token) => {
      if (!token.css_var) return;

      currentVars.add(token.css_var);
      const originalValue = this.originalTokenMap.get(token.css_var);

      // Delta Check: Only inject if changed
      if (token.value !== originalValue) {
        targetNodes.forEach((node) =>
          node.style.setProperty(token.css_var, token.value, "important"),
        );
      } else {
        // Revert to native CSS if it matches baseline
        targetNodes.forEach((node) => node.style.removeProperty(token.css_var));
      }
    });

    // Cleanup: Remove inline styles for vars totally removed from JSON
    this.previewedVars.forEach((oldVar) => {
      if (!currentVars.has(oldVar)) {
        targetNodes.forEach((node) => node.style.removeProperty(oldVar));
      }
    });

    this.previewedVars = currentVars;
  }

  setStatus(msg, type) {
    const status = document.getElementById("dx-gm-status");
    if (!status) return;
    status.innerText = msg;
    status.style.color = type === "error" ? "#e74c3c" : "#61ce70";
    clearTimeout(this.statusTimer);
    this.statusTimer = setTimeout(() => {
      status.innerText = "Live";
      status.style.color = "#61ce70";
    }, 2000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ElementorDXGodMode();
});
