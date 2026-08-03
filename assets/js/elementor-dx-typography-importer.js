class ElementorDXTypographyImporter {
  constructor() {
    this.apiUrl = elementorDxSettings.root + "elementordx/v1/typography";
    this.nonce = elementorDxSettings.nonce;
    this.originalTypography = null;
    this.originalTokenMap = new Map();
    this.currentView = "ui";
    this.previewedVars = new Set();
    this.isOpen = localStorage.getItem("dx_typo_importer_open") === "true";
    this.host = null;
    this.shadow = null;
    this.statusTimer = null;

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        if (this.isOpen) this.open();
      });
    } else {
      if (this.isOpen) this.open();
    }
  }

  open() {
    this.isOpen = true;
    localStorage.setItem("dx_typo_importer_open", "true");
    if (!this.host) {
      this.injectFloatingUI();
      this.fetchInitialData();
    } else {
      this.shadow.getElementById("dx-typo-importer-wrapper").style.display =
        "flex";
    }
  }

  close() {
    this.isOpen = false;
    localStorage.setItem("dx_typo_importer_open", "false");
    if (this.shadow) {
      this.shadow.getElementById("dx-typo-importer-wrapper").style.display =
        "none";
    }
  }

  injectFloatingUI() {
    if (document.getElementById("dx-typo-host")) return;

    this.host = document.createElement("div");
    this.host.id = "dx-typo-host";
    this.host.style.cssText =
      "position: fixed; z-index: 99998; top: 0; left: 0; width: 0; height: 0; overflow: visible;";
    document.body.appendChild(this.host);
    this.shadow = this.host.attachShadow({ mode: "open" });

    const styles = document.createElement("style");
    styles.innerHTML = `
      /* Theme Immunity Reset */
      :host { all: initial; font-family: sans-serif; }
      * { box-sizing: border-box; }
      button, input, textarea { 
        appearance: none; -webkit-appearance: none; background: transparent; 
        border: none; border-radius: 0; padding: 0; margin: 0; 
        box-shadow: none; outline: none; text-transform: none; font-family: inherit;
      }

      /* Specific UI Styles */
      .dx-wrapper {
        position: fixed; top: 80px; left: 40px; width: 360px; background: #2b2b2b; color: #fff;
        border: 1px solid #444; border-radius: 6px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        display: flex; flex-direction: column;
      }
      
      .dx-header {
        cursor: grab; background: #1e1e1e; padding: 10px 12px; border-radius: 6px 6px 0 0; 
        border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center;
      }
      .dx-header h4 { margin: 0; color: #fff; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; pointer-events: none; font-weight: normal; }
      
      .dx-body { padding: 12px; }

      .dx-typo-icon-btn { cursor: pointer; border: 1px solid #444; color: #aaa; padding: 6px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
      .dx-typo-icon-btn:hover { background: #2A0624; color: #F2ADF3; border-color: #620856; }
      .dx-typo-icon-btn:active { transform: scale(0.95); }
      
      .dx-typo-min-btn { cursor: pointer; color: #aaa; padding: 6px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; margin-right: -4px; }
      .dx-typo-min-btn:hover { background: #333; color: #fff; }
      
      .dx-tab-btn { background: #222; color: #aaa; padding: 6px 10px; border-radius: 3px; font-weight: bold; cursor: pointer; transition: all 0.2s; font-size: 10px; }
      .dx-tab-btn:hover { background: #333; color: #fff; }
      .dx-tab-btn.is-active { background: #F2ADF3; color: #2A0624; }
      
      .dx-typo-pill { padding: 8px 12px; background: #222; border: 1px solid #444; border-radius: 20px; font-size: 11px; color: #ddd; cursor: pointer; transition: all 0.2s; user-select: none; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2); margin: 0; }
      .dx-typo-pill:hover { background: #2A0624; border-color: #F2ADF3; color: #F2ADF3; transform: translateY(-1px); box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
      .dx-typo-pill:active { transform: translateY(1px); box-shadow: none; }
      
      .dx-primary-btn { background: #F2ADF3; color: #2A0624; border-radius: 4px; padding: 10px; font-size: 11px; font-weight: bold; text-transform: uppercase; cursor: pointer; transition: all 0.2s; width: 100%; display: flex; justify-content: center; align-items: center; letter-spacing: 0.5px; }
      .dx-primary-btn:hover:not(:disabled) { background: #620856; color: #F2ADF3; }
      .dx-primary-btn:active:not(:disabled) { transform: scale(0.98); }
      .dx-primary-btn:disabled { background: #333; color: #666; border: 1px solid #444; cursor: not-allowed; }

      textarea { width: 100%; background: #1e1e1e; color: #d4d4d4; border: 1px solid #444; border-radius: 4px; padding: 8px; font-family: monospace; font-size: 10px; resize: vertical; box-sizing: border-box; }
      svg { display: block; }
    `;
    this.shadow.appendChild(styles);

    const wrapper = document.createElement("div");
    wrapper.id = "dx-typo-importer-wrapper";
    wrapper.className = "dx-wrapper";

    wrapper.innerHTML = `
      <div id="dx-typo-drag-handle" class="dx-header">
        <h4>Custom Typography</h4>
        <div style="display:flex; gap:4px; align-items:center;">
          <button id="dx-typo-btn-minimize" class="dx-typo-min-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
          <button id="dx-typo-btn-close" class="dx-typo-min-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
      </div>
      <div id="dx-typo-body" class="dx-body">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div style="display:flex; gap:6px;">
            <button id="dx-typo-btn-prompt" class="dx-typo-icon-btn" title="Copy AI Prompt"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg></button>
            <button id="dx-typo-btn-refresh" class="dx-typo-icon-btn" title="Refresh"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg></button>
            <button id="dx-typo-btn-clear" class="dx-typo-icon-btn" title="Clear"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
            <button id="dx-typo-btn-backup" class="dx-typo-icon-btn" title="Backup"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></button>
          </div>
          <div style="display:flex; gap:4px;">
            <button id="dx-typo-tab-ui" class="dx-tab-btn is-active">UI</button>
            <button id="dx-typo-tab-raw" class="dx-tab-btn">RAW</button>
          </div>
        </div>
        <div id="dx-typo-workspace" style="margin-bottom:12px;">
          <div id="dx-typo-view-ui" style="display:block;">
            <div style="display:flex; align-items:center; justify-content:center; background:#1e1e1e; padding:8px; border:1px solid #444; border-radius:4px; margin-bottom:12px;">
              <div style="color:#aaa; font-size: 11px; display:flex; align-items:center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                <span>Click a style below to copy its CSS variables</span>
              </div>
            </div>
            <div id="dx-typo-grid" style="display:flex; flex-wrap:wrap; gap:8px; max-height:220px; overflow-y:auto; padding: 4px 2px;"></div>
          </div>
          <div id="dx-typo-view-raw" style="display:none;">
            <textarea id="dx-typo-json-input" rows="10"></textarea>
          </div>
        </div>
        <button id="dx-typo-btn-update" class="dx-primary-btn">Apply Typography</button>
        <div id="dx-typo-status" style="margin-top:8px; font-size:10px; color:#F2ADF3; display:none; text-align:center;"></div>
      </div>
    `;

    this.shadow.appendChild(wrapper);
    this.makeDraggable(
      wrapper,
      this.shadow.getElementById("dx-typo-drag-handle"),
    );
    this.bindEvents();

    this.shadow
      .getElementById("dx-typo-json-input")
      .addEventListener("input", () => {
        this.evaluateApplyButtonState();
        this.livePreviewTypography();
      });
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
    };
    const closeDragElement = () => {
      document.onmouseup = null;
      document.onmousemove = null;
      handle.style.cursor = "grab";
    };
  }

  bindEvents() {
    const tabUi = this.shadow.getElementById("dx-typo-tab-ui");
    const tabRaw = this.shadow.getElementById("dx-typo-tab-raw");
    const viewUi = this.shadow.getElementById("dx-typo-view-ui");
    const viewRaw = this.shadow.getElementById("dx-typo-view-raw");

    this.shadow.getElementById("dx-typo-btn-close").onclick = (e) => {
      e.preventDefault();
      this.close();
    };
    this.shadow.getElementById("dx-typo-btn-minimize").onclick = (e) => {
      e.preventDefault();
      const body = this.shadow.getElementById("dx-typo-body");
      const isHidden = body.style.display === "none";
      body.style.display = isHidden ? "block" : "none";
      this.shadow.getElementById("dx-typo-btn-minimize").innerHTML = isHidden
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>';
    };

    this.shadow.getElementById("dx-typo-btn-prompt").onclick = (e) => {
      e.preventDefault();
      navigator.clipboard
        .writeText("Generate a complete responsive typography token system...")
        .then(() => this.showStatus("Prompt copied!", "success"));
    };
    this.shadow.getElementById("dx-typo-btn-refresh").onclick = async (e) => {
      e.preventDefault();
      await this.fetchInitialData();
      this.showStatus("Reloaded", "success");
    };
    this.shadow.getElementById("dx-typo-btn-clear").onclick = (e) => {
      e.preventDefault();
      if (confirm("Clear all typography?")) this.setWorkspaceTypography([]);
    };
    this.shadow.getElementById("dx-typo-btn-backup").onclick = (e) => {
      e.preventDefault();
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(
          JSON.stringify(
            this.parseTypography() || this.originalTypography,
            null,
            4,
          ),
        );
      const anchor = document.createElement("a");
      anchor.setAttribute("href", dataStr);
      anchor.setAttribute("download", "typography-backup.json");
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    };

    tabUi.onclick = (e) => {
      e.preventDefault();
      this.currentView = "ui";
      viewUi.style.display = "block";
      viewRaw.style.display = "none";
      tabUi.className = "dx-tab-btn is-active";
      tabRaw.className = "dx-tab-btn";
      const typo = this.parseTypography();
      if (typo) {
        this.processTypographyArray(typo);
        this.renderGrid();
      }
      this.evaluateApplyButtonState();
      this.livePreviewTypography();
    };
    tabRaw.onclick = (e) => {
      e.preventDefault();
      this.currentView = "raw";
      viewUi.style.display = "none";
      viewRaw.style.display = "block";
      tabRaw.className = "dx-tab-btn is-active";
      tabUi.className = "dx-tab-btn";
    };

    this.shadow.getElementById("dx-typo-btn-update").onclick = (e) => {
      e.preventDefault();
      const typo = this.processTypographyArray(this.parseTypography());
      if (typo) this.updateElementor(typo);
    };
  }

  buildOriginalTokenMap(typography) {
    this.originalTokenMap.clear();
    if (!Array.isArray(typography)) return;
    typography.forEach((t) => {
      if (!t._id) return;
      const prefix = `--e-global-typography-${t._id}`;
      if (t.typography_font_family)
        this.originalTokenMap.set(
          `${prefix}-font-family`,
          `"${t.typography_font_family}"`,
        );
      if (t.typography_font_weight)
        this.originalTokenMap.set(
          `${prefix}-font-weight`,
          String(t.typography_font_weight),
        );
      if (t.typography_font_size && t.typography_font_size.size)
        this.originalTokenMap.set(
          `${prefix}-font-size`,
          t.typography_font_size.unit === "custom"
            ? t.typography_font_size.size
            : `${t.typography_font_size.size}${t.typography_font_size.unit || "px"}`,
        );
      if (t.typography_line_height && t.typography_line_height.size)
        this.originalTokenMap.set(
          `${prefix}-line-height`,
          t.typography_line_height.unit === "custom"
            ? t.typography_line_height.size
            : `${t.typography_line_height.size}${t.typography_line_height.unit || "em"}`,
        );
    });
  }

  livePreviewTypography() {
    const typography = this.parseTypography();
    if (!Array.isArray(typography)) return;
    const allNodes = [document.documentElement, document.body];
    const kitElement = document.querySelector('[class*="elementor-kit-"]');
    if (kitElement) allNodes.push(kitElement);
    const iframe = document.getElementById("elementor-preview-iframe");
    if (iframe && iframe.contentDocument) {
      allNodes.push(
        iframe.contentDocument.documentElement,
        iframe.contentDocument.body,
      );
      const iframeKit = iframe.contentDocument.querySelector(
        '[class*="elementor-kit-"]',
      );
      if (iframeKit) allNodes.push(iframeKit);
    }
    const currentVars = new Set(),
      usedIds = new Set();
    typography.forEach((t) => {
      if (t && t._id) usedIds.add(t._id.trim());
    });
    typography.forEach((t) => {
      if (!t) return;
      let varId =
        t._id && t._id.trim() !== ""
          ? t._id.trim()
          : `typo-${Math.random().toString(36).substr(2, 5)}`;
      const prefix = `--e-global-typography-${varId}`;
      const varsToApply = [];
      if (t.typography_font_family)
        varsToApply.push({
          prop: `${prefix}-font-family`,
          val: `"${t.typography_font_family}"`,
        });
      if (t.typography_font_weight)
        varsToApply.push({
          prop: `${prefix}-font-weight`,
          val: String(t.typography_font_weight),
        });
      if (t.typography_font_size && t.typography_font_size.size)
        varsToApply.push({
          prop: `${prefix}-font-size`,
          val:
            t.typography_font_size.unit === "custom"
              ? t.typography_font_size.size
              : `${t.typography_font_size.size}${t.typography_font_size.unit || "px"}`,
        });
      if (t.typography_line_height && t.typography_line_height.size)
        varsToApply.push({
          prop: `${prefix}-line-height`,
          val:
            t.typography_line_height.unit === "custom"
              ? t.typography_line_height.size
              : `${t.typography_line_height.size}${t.typography_line_height.unit || "em"}`,
        });
      varsToApply.forEach((v) => {
        currentVars.add(v.prop);
        if (this.originalTokenMap.get(v.prop) !== v.val) {
          allNodes.forEach((node) =>
            node.style.setProperty(v.prop, v.val, "important"),
          );
        } else {
          allNodes.forEach((node) => node.style.removeProperty(v.prop));
        }
      });
    });
    this.previewedVars.forEach((oldVar) => {
      if (!currentVars.has(oldVar))
        allNodes.forEach((node) => node.style.removeProperty(oldVar));
    });
    this.previewedVars = currentVars;
  }

  evaluateApplyButtonState() {
    const btn = this.shadow.getElementById("dx-typo-btn-update");
    if (!btn) return;
    const currentTypo = this.parseTypography();
    if (
      currentTypo !== null &&
      JSON.stringify(currentTypo) !== JSON.stringify(this.originalTypography)
    ) {
      btn.disabled = false;
    } else {
      btn.disabled = true;
    }
  }

  parseTypography() {
    try {
      const raw = this.shadow.getElementById("dx-typo-json-input").value;
      if (!raw.trim()) return [];
      let data = JSON.parse(raw);
      if (data && typeof data === "object" && !Array.isArray(data)) {
        if (data.custom_typography) data = data.custom_typography;
      }
      return Array.isArray(data) ? data : null;
    } catch (e) {
      return null;
    }
  }

  processTypographyArray(typography) {
    if (!Array.isArray(typography)) return typography;
    let modified = false;
    const usedIds = new Set();
    typography.forEach((t) => {
      if (t && t._id && t._id.trim() !== "") usedIds.add(t._id.trim());
    });
    const processed = typography.map((t) => {
      if (t && typeof t === "object") {
        if (!t._id || t._id.trim() === "") {
          let baseId =
            (t.title || "typo")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "") || "typo";
          let counter = 1,
            newId = baseId;
          while (usedIds.has(newId)) {
            newId = `${baseId}-${counter}`;
            counter++;
          }
          t._id = newId;
          usedIds.add(newId);
          modified = true;
        }
      }
      return t;
    });
    if (modified)
      this.shadow.getElementById("dx-typo-json-input").value = JSON.stringify(
        processed,
        null,
        4,
      );
    return processed;
  }

  setWorkspaceTypography(typography) {
    this.shadow.getElementById("dx-typo-json-input").value =
      Array.isArray(typography) && typography.length > 0
        ? JSON.stringify(typography, null, 4)
        : "[]";
    this.renderGrid();
    this.evaluateApplyButtonState();
    this.livePreviewTypography();
  }

  async fetchInitialData() {
    try {
      const res = await fetch(this.apiUrl, {
        method: "GET",
        headers: { "X-WP-Nonce": this.nonce },
      });
      if (res.ok) {
        const data = await res.json();
        this.originalTypography = data.custom_typography || data;
        this.buildOriginalTokenMap(this.originalTypography);
        this.setWorkspaceTypography(this.originalTypography);
      }
    } catch (e) {
      this.showStatus("Failed to load data.", "error");
    }
  }

  renderGrid() {
    const grid = this.shadow.getElementById("dx-typo-grid");
    if (!grid) return;
    grid.innerHTML = "";
    const typography = this.parseTypography();
    if (!Array.isArray(typography) || typography.length === 0) {
      grid.innerHTML =
        '<div style="color:#777; font-size:11px; width: 100%;">No typography found.</div>';
      return;
    }
    typography.forEach((t) => {
      if (!t || !t.title) return;
      const pill = document.createElement("div");
      pill.className = "dx-typo-pill";
      pill.innerText = t.title;
      pill.title = `ID: ${t._id || "pending"}`;
      pill.onclick = () => {
        const prefix = `--e-global-typography-${t._id || "pending"}`;
        let cssLines = [];
        if (t.typography_font_family)
          cssLines.push(`font-family: var(${prefix}-font-family);`);
        if (t.typography_font_weight)
          cssLines.push(`font-weight: var(${prefix}-font-weight);`);
        if (t.typography_font_size)
          cssLines.push(`font-size: var(${prefix}-font-size);`);
        if (t.typography_line_height)
          cssLines.push(`line-height: var(${prefix}-line-height);`);
        navigator.clipboard
          .writeText(cssLines.join("\n"))
          .then(() => this.showStatus(`Copied CSS`, "success"));
      };
      grid.appendChild(pill);
    });
  }

  async updateElementor(custom_typography) {
    const btn = this.shadow.getElementById("dx-typo-btn-update");
    if (btn) {
      btn.innerText = "Applying...";
      btn.disabled = true;
    }
    try {
      const res = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": this.nonce,
        },
        body: JSON.stringify({ custom_typography }),
      });
      if (res.ok) {
        this.originalTypography = custom_typography;
        this.buildOriginalTokenMap(this.originalTypography);
        this.evaluateApplyButtonState();
        this.showStatus("Applied! Reloading...", "success");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error("Server error");
      }
    } catch (e) {
      this.showStatus("Failed.", "error");
      if (btn) {
        btn.innerText = "Apply Typography";
        this.evaluateApplyButtonState();
      }
    }
  }

  showStatus(msg, type) {
    const el = this.shadow.getElementById("dx-typo-status");
    el.style.display = "block";
    el.style.color = type === "error" ? "#e74c3c" : "#F2ADF3";
    el.innerText = msg;
    clearTimeout(this.statusTimer);
    this.statusTimer = setTimeout(() => {
      el.style.display = "none";
    }, 3500);
  }
}
