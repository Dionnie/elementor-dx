class ElementorDXTypographyImporter {
  constructor() {
    this.apiUrl = elementorDxSettings.root + "elementordx/v1/typography";
    this.nonce = elementorDxSettings.nonce;
    this.originalTypography = null;
    this.originalTokenMap = new Map();
    this.currentView = "ui";
    this.previewedVars = new Set();
    this.isOpen = localStorage.getItem("dx_typo_importer_open") === "true";

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
    const wrapper = document.getElementById("dx-typo-importer-wrapper");
    if (!wrapper) {
      this.injectFloatingUI();
      this.fetchInitialData();
    } else {
      wrapper.style.setProperty("display", "flex", "important");
    }
  }

  close() {
    this.isOpen = false;
    localStorage.setItem("dx_typo_importer_open", "false");
    const wrapper = document.getElementById("dx-typo-importer-wrapper");
    if (wrapper) wrapper.style.setProperty("display", "none", "important");
  }

  injectFloatingUI() {
    if (document.getElementById("dx-typo-importer-wrapper")) return;

    const styles = document.createElement("style");
    styles.id = "dx-typo-styles";
    styles.innerHTML = `
      /* Theme Immunity Reset */
      #dx-typo-importer-wrapper, #dx-typo-importer-wrapper * { box-sizing: border-box !important; font-family: sans-serif !important; letter-spacing: normal !important; line-height: 1.5 !important; }
      #dx-typo-importer-wrapper button, #dx-typo-importer-wrapper input, #dx-typo-importer-wrapper textarea { appearance: none !important; -webkit-appearance: none !important; background: transparent !important; border: none !important; border-radius: 0 !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; outline: none !important; text-transform: none !important; }
      #dx-typo-importer-wrapper button::before, #dx-typo-importer-wrapper button::after { display: none !important; }

      .dx-typo-icon-btn { cursor: pointer !important; border: 1px solid #444 !important; color: #aaa !important; padding: 6px !important; border-radius: 4px !important; display: flex !important; align-items: center !important; justify-content: center !important; transition: all 0.2s !important; }
      .dx-typo-icon-btn:hover { background: #2A0624 !important; color: #F2ADF3 !important; border-color: #620856 !important; }
      .dx-typo-min-btn { cursor: pointer !important; color: #aaa !important; padding: 6px !important; border-radius: 4px !important; display: flex !important; align-items: center !important; justify-content: center !important; transition: all 0.2s !important; margin-right: -4px !important; }
      .dx-typo-min-btn:hover { background: #333 !important; color: #fff !important; }
      
      .dx-typo-pill { padding: 8px 12px !important; background: #222 !important; border: 1px solid #444 !important; border-radius: 20px !important; font-size: 11px !important; color: #ddd !important; cursor: pointer !important; transition: all 0.2s !important; user-select: none !important; white-space: nowrap !important; box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important; }
      .dx-typo-pill:hover { background: #2A0624 !important; border-color: #F2ADF3 !important; color: #F2ADF3 !important; transform: translateY(-1px) !important; box-shadow: 0 4px 6px rgba(0,0,0,0.3) !important; }
      
      .dx-primary-btn { background: #F2ADF3 !important; color: #2A0624 !important; border-radius: 4px !important; padding: 10px !important; font-size: 11px !important; font-weight: bold !important; text-transform: uppercase !important; cursor: pointer !important; transition: 0.2s !important; width: 100% !important; display: flex !important; justify-content: center !important; letter-spacing: 0.5px !important;}
      .dx-primary-btn:hover { background: #620856 !important; color: #F2ADF3 !important; }
      .dx-primary-btn:disabled { opacity: 0.5 !important; cursor: not-allowed !important; filter: grayscale(100%) !important; }
    `;
    document.head.appendChild(styles);

    const wrapper = document.createElement("div");
    wrapper.id = "dx-typo-importer-wrapper";
    wrapper.style.cssText = `
      position: fixed !important; top: 80px !important; left: 40px !important; width: 360px !important; background: #2b2b2b !important;
      border: 1px solid #444 !important; border-radius: 6px !important; box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
      z-index: 99998 !important; font-family: sans-serif !important; display: flex !important; flex-direction: column !important;
    `;

    wrapper.innerHTML = `
      <div id="dx-typo-drag-handle" style="cursor: grab !important; background: #1e1e1e !important; padding: 10px 12px !important; border-radius: 6px 6px 0 0 !important; border-bottom: 1px solid #444 !important; display: flex !important; justify-content: space-between !important; align-items: center !important;">
        <h4 style="margin:0 !important; color:#fff !important; font-size:11px !important; text-transform:uppercase !important; letter-spacing:0.5px !important; pointer-events: none !important;">Custom Typography</h4>
        <div style="display:flex !important; gap:4px !important; align-items:center !important;">
          <button id="dx-typo-btn-minimize" class="dx-typo-min-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
          <button id="dx-typo-btn-close" class="dx-typo-min-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
      </div>
      <div id="dx-typo-body" style="padding: 12px !important;">
        <div style="display:flex !important; justify-content:space-between !important; align-items:center !important; margin-bottom:12px !important;">
          <div style="display:flex !important; gap:6px !important;">
            <button id="dx-typo-btn-prompt" class="dx-typo-icon-btn" title="Copy AI Prompt"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg></button>
            <button id="dx-typo-btn-refresh" class="dx-typo-icon-btn" title="Refresh"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg></button>
            <button id="dx-typo-btn-clear" class="dx-typo-icon-btn" title="Clear"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
            <button id="dx-typo-btn-backup" class="dx-typo-icon-btn" title="Backup"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></button>
          </div>
          <div style="display:flex !important; gap:4px !important; font-size:10px !important;">
            <button id="dx-typo-tab-ui" style="background:#F2ADF3 !important; color:#2A0624 !important; padding:6px 10px !important; border-radius:3px !important; font-weight:bold !important; cursor:pointer !important;">UI</button>
            <button id="dx-typo-tab-raw" style="background:#222 !important; color:#aaa !important; padding:6px 10px !important; border-radius:3px !important; font-weight:bold !important; cursor:pointer !important;">RAW</button>
          </div>
        </div>
        <div id="dx-typo-workspace" style="margin-bottom:12px !important;">
          <div id="dx-typo-view-ui" style="display:block !important;">
            <div style="display:flex !important; align-items:center !important; justify-content:center !important; background:#1e1e1e !important; padding:8px !important; border:1px solid #444 !important; border-radius:4px !important; margin-bottom:12px !important;">
              <div style="color:#aaa !important; font-size: 11px !important; display:flex !important; align-items:center !important; gap: 6px !important;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                <span>Click a style below to copy its CSS variables</span>
              </div>
            </div>
            <div id="dx-typo-grid" style="display:flex !important; flex-wrap:wrap !important; gap:8px !important; max-height:220px !important; overflow-y:auto !important; padding: 4px 2px !important;"></div>
          </div>
          <div id="dx-typo-view-raw" style="display:none !important;">
            <textarea id="dx-typo-json-input" rows="10" style="width:100% !important; background:#1e1e1e !important; color:#d4d4d4 !important; border:1px solid #444 !important; border-radius:4px !important; padding:8px !important; font-family:monospace !important; font-size:10px !important; resize:vertical !important; box-sizing: border-box !important; outline:none !important;"></textarea>
          </div>
        </div>
        <button id="dx-typo-btn-update" class="dx-primary-btn">Apply Typography</button>
        <div id="dx-typo-status" style="margin-top:8px !important; font-size:10px !important; color:#F2ADF3 !important; display:none !important; text-align:center !important;"></div>
      </div>
    `;

    document.body.appendChild(wrapper);
    this.makeDraggable(wrapper, document.getElementById("dx-typo-drag-handle"));
    this.bindEvents();

    document
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
      handle.style.setProperty("cursor", "grabbing", "important");
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    };
    const elementDrag = (e) => {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      element.style.setProperty(
        "top",
        element.offsetTop - pos2 + "px",
        "important",
      );
      element.style.setProperty(
        "left",
        element.offsetLeft - pos1 + "px",
        "important",
      );
      element.style.setProperty("right", "auto", "important");
    };
    const closeDragElement = () => {
      document.onmouseup = null;
      document.onmousemove = null;
      handle.style.setProperty("cursor", "grab", "important");
    };
  }

  bindEvents() {
    const tabUi = document.getElementById("dx-typo-tab-ui"),
      tabRaw = document.getElementById("dx-typo-tab-raw"),
      viewUi = document.getElementById("dx-typo-view-ui"),
      viewRaw = document.getElementById("dx-typo-view-raw");

    document.getElementById("dx-typo-btn-close").onclick = (e) => {
      e.preventDefault();
      this.close();
    };
    document.getElementById("dx-typo-btn-minimize").onclick = (e) => {
      e.preventDefault();
      const body = document.getElementById("dx-typo-body");
      body.style.setProperty(
        "display",
        body.style.display === "none" ? "block" : "none",
        "important",
      );
    };

    document.getElementById("dx-typo-btn-prompt").onclick = (e) => {
      e.preventDefault();
      navigator.clipboard
        .writeText("Generate a complete responsive typography token system...")
        .then(() => this.showStatus("Prompt copied!", "success"));
    };
    document.getElementById("dx-typo-btn-refresh").onclick = async (e) => {
      e.preventDefault();
      await this.fetchInitialData();
      this.showStatus("Reloaded", "success");
    };
    document.getElementById("dx-typo-btn-clear").onclick = (e) => {
      e.preventDefault();
      if (confirm("Clear all typography?")) this.setWorkspaceTypography([]);
    };
    document.getElementById("dx-typo-btn-backup").onclick = (e) => {
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
      viewUi.style.setProperty("display", "block", "important");
      viewRaw.style.setProperty("display", "none", "important");
      tabUi.style.setProperty("background", "#F2ADF3", "important");
      tabUi.style.setProperty("color", "#2A0624", "important");
      tabRaw.style.setProperty("background", "#222", "important");
      tabRaw.style.setProperty("color", "#aaa", "important");
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
      viewUi.style.setProperty("display", "none", "important");
      viewRaw.style.setProperty("display", "block", "important");
      tabRaw.style.setProperty("background", "#F2ADF3", "important");
      tabRaw.style.setProperty("color", "#2A0624", "important");
      tabUi.style.setProperty("background", "#222", "important");
      tabUi.style.setProperty("color", "#aaa", "important");
    };

    document.getElementById("dx-typo-btn-update").onclick = (e) => {
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
    const btn = document.getElementById("dx-typo-btn-update");
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
      const raw = document.getElementById("dx-typo-json-input").value;
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
      document.getElementById("dx-typo-json-input").value = JSON.stringify(
        processed,
        null,
        4,
      );
    return processed;
  }

  setWorkspaceTypography(typography) {
    document.getElementById("dx-typo-json-input").value =
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
    const grid = document.getElementById("dx-typo-grid");
    if (!grid) return;
    grid.innerHTML = "";
    const typography = this.parseTypography();
    if (!Array.isArray(typography) || typography.length === 0) {
      grid.innerHTML =
        '<div style="color:#777 !important; font-size:11px !important; width: 100% !important;">No typography found.</div>';
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
    const btn = document.getElementById("dx-typo-btn-update");
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
    const el = document.getElementById("dx-typo-status");
    el.style.setProperty("display", "block", "important");
    el.style.setProperty(
      "color",
      type === "error" ? "#e74c3c" : "#F2ADF3",
      "important",
    );
    el.innerText = msg;
    clearTimeout(this.statusTimer);
    this.statusTimer = setTimeout(() => {
      el.style.setProperty("display", "none", "important");
    }, 3500);
  }
}
