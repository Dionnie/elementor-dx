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
      :host { all: initial; font-family: sans-serif; }
      * { box-sizing: border-box; }
      button, input, textarea { 
        appearance: none; -webkit-appearance: none; background: transparent; 
        border: none; border-radius: 0; padding: 0; margin: 0; 
        box-shadow: none; outline: none; text-transform: none; font-family: inherit;
      }

      /* Classic Dark Mode Wrapper */
      .dx-wrapper {
        position: fixed; top: 80px; left: 40px; width: 380px; background: #2b2b2b; color: #fff;
        border: 1px solid #444; border-radius: 6px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        display: flex; flex-direction: column;
      }
      
      .dx-header {
        cursor: grab; background: #1e1e1e; padding: 10px 12px; border-radius: 6px 6px 0 0; 
        border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center;
      }
      .dx-header h4 { margin: 0; color: #fff; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; pointer-events: none; font-weight: normal; }
      
      .dx-body { padding: 12px; }

      .dx-icon-btn { cursor: pointer; border: 1px solid #444; color: #aaa; padding: 6px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
      .dx-icon-btn:hover { background: #333; color: #fff; border-color: #ED01EE; }
      .dx-icon-btn:active { transform: scale(0.95); }
      
      .dx-min-btn { cursor: pointer; color: #aaa; padding: 6px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; margin-right: -4px; }
      .dx-min-btn:hover { background: #333; color: #fff; }
      
      .dx-tab-btn { background: #222; color: #aaa; padding: 6px 10px; border-radius: 3px; font-weight: bold; cursor: pointer; transition: all 0.2s; font-size: 10px; }
      .dx-tab-btn:hover:not(.is-active) { background: #333; color: #fff; }
      .dx-tab-btn.is-active { background: #ED01EE; color: #fff; }

      .dx-typo-pill { padding: 8px 12px; background: #222; border: 1px solid #444; border-radius: 20px; font-size: 11px; color: #ddd; cursor: pointer; transition: all 0.2s; user-select: none; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
      .dx-typo-pill:hover { background: #333; border-color: #ED01EE; color: #fff; transform: translateY(-1px); box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
      
      .dx-primary-btn { background: #ED01EE; color: #fff; border-radius: 4px; padding: 10px; font-size: 11px; font-weight: bold; text-transform: uppercase; cursor: pointer; transition: all 0.2s; width: 100%; display: flex; justify-content: center; align-items: center; letter-spacing: 0.5px; }
      .dx-primary-btn:hover:not(:disabled) { background: #620856; }
      .dx-primary-btn:active:not(:disabled) { transform: scale(0.98); }
      .dx-primary-btn:disabled { background: #333; color: #666; border: 1px solid #444; cursor: not-allowed; filter: none; }

      textarea { width: 100%; background: #1e1e1e; color: #d4d4d4; border: 1px solid #444; border-radius: 4px; padding: 8px; font-family: monospace; font-size: 10px; resize: vertical; box-sizing: border-box; outline: none;}
      svg { display: block; }
    `;
    this.shadow.appendChild(styles);

    const wrapper = document.createElement("div");
    wrapper.id = "dx-typo-importer-wrapper";
    wrapper.className = "dx-wrapper";

    wrapper.innerHTML = `
      <div id="dx-drag-handle" class="dx-header">
        <h4>Custom Typography</h4>
        <div style="display:flex; gap:4px; align-items:center;">
          <button id="dx-btn-minimize" class="dx-min-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
          <button id="dx-btn-close" class="dx-min-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
      </div>
      <div id="dx-typo-body" class="dx-body">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div style="display:flex; gap:6px;">
            <button id="dx-btn-prompt" class="dx-icon-btn" title="Copy AI Prompt"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg></button>
            <button id="dx-btn-refresh" class="dx-icon-btn" title="Refresh"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg></button>
            <button id="dx-btn-clear" class="dx-icon-btn" title="Clear"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
            <button id="dx-btn-backup" class="dx-icon-btn" title="Backup"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></button>
          </div>
          <div style="display:flex; gap:4px;">
            <button id="dx-tab-ui" class="dx-tab-btn is-active">UI</button>
            <button id="dx-tab-raw" class="dx-tab-btn">RAW</button>
          </div>
        </div>
        <div id="dx-workspace" style="margin-bottom:12px;">
          <div id="dx-view-ui" style="display:block;">
            <div style="display:flex; align-items:center; justify-content:center; background:#1e1e1e; padding:8px; border:1px solid #444; border-radius:4px; margin-bottom:12px;">
              <div style="color:#aaa; font-size: 11px; display:flex; align-items:center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                <span>Click a style below to copy its CSS variables</span>
              </div>
            </div>
            <div id="dx-typo-grid" style="display:flex; flex-wrap:wrap; gap:8px; max-height:220px; overflow-y:auto; padding: 4px 2px;"></div>
          </div>
          <div id="dx-view-raw" style="display:none;">
            <textarea id="dx-typo-json-input" rows="10"></textarea>
          </div>
        </div>
        <button id="dx-btn-update" class="dx-primary-btn">Apply Typography</button>
        <div id="dx-typo-status" style="margin-top:8px; font-size:10px; color:#61ce70; display:none; text-align:center;"></div>
      </div>
    `;

    this.shadow.appendChild(wrapper);
    this.makeDraggable(wrapper, this.shadow.getElementById("dx-drag-handle"));
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

  // ==========================================
  // BULLETPROOF MERGE & SYNC TRANSACTION
  // ==========================================
  async prepareAndSaveTypography() {
    const btn = this.shadow.getElementById("dx-btn-update");
    if (btn) {
      btn.innerText = "Syncing & Merging...";
      btn.disabled = true;
    }

    let uiTypo = this.processTypographyArray(this.parseTypography());

    if (!uiTypo) {
      this.showStatus("Invalid JSON format.", "error");
      if (btn) {
        btn.innerText = "Invalid JSON Format";
        this.evaluateApplyButtonState();
      }
      return;
    }

    try {
      const cacheBuster = "?t=" + new Date().getTime();
      const res = await fetch(this.apiUrl + cacheBuster, {
        method: "GET",
        headers: { "X-WP-Nonce": this.nonce },
      });

      let dbTypo = [];
      if (res.ok) {
        const data = await res.json();
        dbTypo = data.custom_typography || data || [];
      }

      const mergedMap = new Map();
      const usedIds = new Set();

      const getSafeId = (desiredId, fallbackTitle) => {
        if (desiredId && desiredId.trim() !== "" && !usedIds.has(desiredId)) {
          return desiredId.trim();
        }
        let baseId =
          (fallbackTitle || "typo")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") || "typo";
        let newId = baseId;
        let counter = 1;
        while (usedIds.has(newId)) {
          newId = `${baseId}-${counter}`;
          counter++;
        }
        return newId;
      };

      const uiMap = new Map();
      uiTypo.forEach((t) => {
        if (t._id) uiMap.set(t._id, t);
      });

      // A. Process DB Typography (Tag Orphans & Merge Edits)
      dbTypo.forEach((dbT) => {
        if (!dbT._id) return;
        let finalTitle = dbT.title || "Typography";
        let finalTypoObj = { ...dbT };

        const existsInUI = uiMap.has(dbT._id);
        if (existsInUI) {
          const updated = uiMap.get(dbT._id);
          Object.keys(updated).forEach((key) => {
            finalTypoObj[key] = updated[key];
          });

          if (updated.title && !updated.title.includes(`(${dbT._id})`)) {
            finalTitle = updated.title;
          } else if (updated.title) {
            finalTitle = updated.title;
          }
        } else {
          if (!finalTitle.includes(`(${dbT._id})`)) {
            finalTitle = `${finalTitle} (${dbT._id})`;
          }
        }

        finalTypoObj.title = finalTitle;
        const finalId = getSafeId(dbT._id, finalTitle);
        finalTypoObj._id = finalId;
        usedIds.add(finalId);
        mergedMap.set(finalId, finalTypoObj);
      });

      // B. Process entirely new typography added in the UI
      uiTypo.forEach((uiT) => {
        if (uiT._id && dbTypo.some((db) => db._id === uiT._id)) return;

        const finalId = getSafeId(uiT._id, uiT.title);
        uiT._id = finalId;
        if (!uiT.title) uiT.title = "New Typography";
        usedIds.add(finalId);
        mergedMap.set(finalId, uiT);
      });

      const finalMergedTypo = Array.from(mergedMap.values());

      this.originalTypography = finalMergedTypo;
      this.setWorkspaceTypography(finalMergedTypo);
      await this.updateElementor(finalMergedTypo);
    } catch (e) {
      this.showStatus("Merge & Sync failed.", "error");
      if (btn) {
        btn.innerText = "Apply Typography";
        this.evaluateApplyButtonState();
      }
    }
  }

  bindEvents() {
    const tabUi = this.shadow.getElementById("dx-tab-ui");
    const tabRaw = this.shadow.getElementById("dx-tab-raw");
    const viewUi = this.shadow.getElementById("dx-view-ui");
    const viewRaw = this.shadow.getElementById("dx-view-raw");

    this.shadow.getElementById("dx-btn-close").onclick = (e) => {
      e.preventDefault();
      this.close();
    };
    this.shadow.getElementById("dx-btn-minimize").onclick = (e) => {
      e.preventDefault();
      const body = this.shadow.getElementById("dx-typo-body");
      const isHidden = body.style.display === "none";
      body.style.display = isHidden ? "block" : "none";
      this.shadow.getElementById("dx-btn-minimize").innerHTML = isHidden
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>';
    };

    this.shadow.getElementById("dx-btn-prompt").onclick = (e) => {
      e.preventDefault();
      navigator.clipboard
        .writeText(
          `Generate a complete responsive typography token system for Elementor.\nRequirements:\n- Output MUST be a valid JSON array.\n- Each object must include "title" and "typography_typography": "custom".`,
        )
        .then(() => this.showStatus("Prompt copied!", "success"));
    };

    this.shadow.getElementById("dx-btn-refresh").onclick = async (e) => {
      e.preventDefault();
      await this.fetchInitialData();
      this.showStatus("Reloaded", "success");
    };
    this.shadow.getElementById("dx-btn-clear").onclick = (e) => {
      e.preventDefault();
      if (confirm("Clear all typography?")) this.setWorkspaceTypography([]);
    };
    this.shadow.getElementById("dx-btn-backup").onclick = (e) => {
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

    this.shadow.getElementById("dx-btn-update").onclick = (e) => {
      e.preventDefault();
      this.prepareAndSaveTypography();
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
    const btn = this.shadow.getElementById("dx-btn-update");
    if (!btn) return;

    const currentTypo = this.parseTypography();

    // Explicit UI feedback for broken JSON
    if (
      currentTypo === null &&
      this.shadow.getElementById("dx-typo-json-input").value.trim() !== ""
    ) {
      btn.disabled = true;
      btn.innerText = "Invalid JSON Format";
      return;
    }

    if (
      currentTypo !== null &&
      JSON.stringify(currentTypo) !== JSON.stringify(this.originalTypography)
    ) {
      btn.disabled = false;
      btn.innerText = "Apply Typography";
    } else {
      btn.disabled = true;
      btn.innerText = "Apply Typography";
    }
  }

  parseTypography() {
    try {
      let raw = this.shadow.getElementById("dx-typo-json-input").value;
      if (!raw.trim()) return [];

      raw = raw
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

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
    const processed = [];

    typography.forEach((t) => {
      if (t && typeof t === "object") {
        let targetId = t._id && t._id.trim() !== "" ? t._id.trim() : null;

        if (!targetId) {
          let baseId =
            (t.title || "typo")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "") || "typo";
          let newId = baseId;
          let counter = 1;
          while (usedIds.has(newId)) {
            newId = `${baseId}-${counter}`;
            counter++;
          }
          targetId = newId;
          modified = true;
        }

        if (usedIds.has(targetId)) {
          modified = true;
          return;
        }

        t._id = targetId;
        usedIds.add(targetId);
        processed.push(t);
      }
    });

    if (modified) {
      this.shadow.getElementById("dx-typo-json-input").value = JSON.stringify(
        processed,
        null,
        4,
      );
    }
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
      const cacheBuster = "?t=" + new Date().getTime();
      const res = await fetch(this.apiUrl + cacheBuster, {
        method: "GET",
        headers: { "X-WP-Nonce": this.nonce },
      });
      if (res.ok) {
        const data = await res.json();
        this.originalTypography = data.custom_typography || data || [];
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
    if (btn) btn.innerText = "Applying...";

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
    el.style.color = type === "error" ? "#ff7777" : "#61ce70";
    el.innerText = msg;
    clearTimeout(this.statusTimer);
    this.statusTimer = setTimeout(() => {
      el.style.display = "none";
    }, 3500);
  }
}
