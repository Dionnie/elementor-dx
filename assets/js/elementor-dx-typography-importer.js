class ElementorDXTypographyImporter {
  constructor() {
    this.apiUrl = elementorDxSettings.root + "elementordx/v1/typography";
    this.nonce = elementorDxSettings.nonce;
    this.originalTypography = null;
    this.originalTokenMap = new Map(); // Baseline for live preview delta check
    this.currentView = "ui";
    this.previewedVars = new Set();

    // Notice: We no longer call this.init() here. The DOM stays clean until triggered.
  }

  /**
   * SPECIAL TRIGGER FUNCTION
   * Call this to inject (if needed) and show the UI.
   */
  open() {
    const wrapper = document.getElementById("dx-typo-importer-wrapper");
    if (!wrapper) {
      this.injectFloatingUI();
      this.fetchInitialData();
    } else {
      wrapper.style.display = "flex";
    }
  }

  /**
   * Hides the UI without destroying the data or DOM
   */
  close() {
    const wrapper = document.getElementById("dx-typo-importer-wrapper");
    if (wrapper) {
      wrapper.style.display = "none";
    }
  }

  injectFloatingUI() {
    if (document.getElementById("dx-typo-importer-wrapper")) return;

    // Inject minimal scoped styles for the UI components
    const styles = document.createElement("style");
    styles.id = "dx-typo-styles";
    styles.innerHTML = `
      .dx-typo-icon-btn {
        background: transparent; border: 1px solid #444; color: #aaa; 
        padding: 6px; cursor: pointer; border-radius: 4px; 
        display: flex; align-items: center; justify-content: center;
        transition: all 0.2s;
      }
      .dx-typo-icon-btn:hover { background: #333; color: #fff; border-color: #666; }
      
      .dx-typo-min-btn {
        background: transparent; border: none; color: #aaa; 
        padding: 6px; cursor: pointer; border-radius: 4px; 
        display: flex; align-items: center; justify-content: center;
        transition: all 0.2s; margin-right: -4px;
      }
      .dx-typo-min-btn:hover { background: #333; color: #fff; }
      
      .dx-typo-pill {
        padding: 6px 12px; background: #333; border: 1px solid #444; 
        border-radius: 20px; font-size: 11px; color: #ddd; cursor: pointer; 
        transition: all 0.2s; user-select: none; white-space: nowrap;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      .dx-typo-pill:hover { background: #444; border-color: #aaa; color: #fff; transform: translateY(-1px); box-shadow: 0 3px 6px rgba(0,0,0,0.3); }
    `;
    document.head.appendChild(styles);

    const wrapper = document.createElement("div");
    wrapper.id = "dx-typo-importer-wrapper";
    wrapper.style.cssText = `
      position: fixed; top: 80px; left: 40px; width: 360px; background: #2b2b2b;
      border: 1px solid #444; border-radius: 6px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      z-index: 99998; font-family: sans-serif; display: flex; flex-direction: column;
    `;

    wrapper.innerHTML = `
      <!-- Draggable Header -->
      <div id="dx-typo-drag-handle" style="cursor: grab; background: #1e1e1e; padding: 10px 12px; border-radius: 6px 6px 0 0; border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center;">
        <h4 style="margin:0; color:#fff; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; pointer-events: none;">Custom Typography</h4>
        <div style="display:flex; gap:4px; align-items:center;">
          <button id="dx-typo-btn-minimize" class="dx-typo-min-btn" title="Toggle Panel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          <button id="dx-typo-btn-close" class="dx-typo-min-btn" title="Close Panel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <!-- Main Body Content -->
      <div id="dx-typo-body" style="padding: 12px;">
        
        <!-- Action Buttons -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div style="display:flex; gap:6px;">
            <button id="dx-typo-btn-prompt" class="dx-typo-icon-btn" title="Copy AI Prompt to Clipboard">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
            </button>
            <button id="dx-typo-btn-refresh" class="dx-typo-icon-btn" title="Refresh from Database">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
            </button>
            <button id="dx-typo-btn-clear" class="dx-typo-icon-btn" title="Clear Workspace">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
            <button id="dx-typo-btn-backup" class="dx-typo-icon-btn" title="Download Backup">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </button>
          </div>
          
          <!-- Workspace Tabs -->
          <div id="dx-typo-workspace-tabs" style="display:flex; gap:4px; font-size:10px;">
            <button id="dx-typo-tab-ui" style="background:#444; border:none; color:#fff; padding:4px 8px; cursor:pointer; border-radius:3px;">UI</button>
            <button id="dx-typo-tab-raw" style="background:#222; border:none; color:#aaa; padding:4px 8px; cursor:pointer; border-radius:3px;">RAW</button>
          </div>
        </div>

        <!-- Workspace Container -->
        <div id="dx-typo-workspace" style="display:block; margin-bottom:12px;">
          
          <!-- Workspace: UI -->
          <div id="dx-typo-view-ui" style="display:block;">
            
            <!-- Compact Copy on Click Toolbar -->
            <div style="display:flex; align-items:center; justify-content:center; background:#1e1e1e; padding:8px; border:1px solid #444; border-radius:4px; margin-bottom:12px;">
              <div style="color:#aaa; font-size: 11px; display:flex; align-items:center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Click a style below to copy its CSS variables</span>
              </div>
            </div>

            <div id="dx-typo-grid" style="display:flex; flex-wrap:wrap; gap:8px; max-height:220px; overflow-y:auto; padding: 4px 2px;"></div>
          </div>

          <!-- Workspace: RAW -->
          <div id="dx-typo-view-raw" style="display:none;">
            <textarea id="dx-typo-json-input" rows="10" style="width:100%; background:#1e1e1e; color:#d4d4d4; border:1px solid #444; border-radius:4px; padding:8px; font-family:monospace; font-size:10px; resize:vertical; box-sizing: border-box;" placeholder="Paste typography JSON array here..."></textarea>
          </div>
        </div>

        <!-- Final Action to Elementor -->
        <button id="dx-typo-btn-update" class="elementor-button elementor-button-success" style="width:100%; justify-content:center; padding:8px; font-size:11px; background:#39b54a; color:#fff; border:none; border-radius:3px; transition: 0.2s;">Apply</button>
        <div id="dx-typo-status" style="margin-top:8px; font-size:10px; color:#a4afb7; display:none; text-align:center;"></div>
      </div>
    `;

    document.body.appendChild(wrapper);

    this.makeDraggable(wrapper, document.getElementById("dx-typo-drag-handle"));
    this.bindEvents();

    // Evaluate Apply Button and trigger Live Preview on textarea edit
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
    const tabUi = document.getElementById("dx-typo-tab-ui");
    const tabRaw = document.getElementById("dx-typo-tab-raw");
    const viewUi = document.getElementById("dx-typo-view-ui");
    const viewRaw = document.getElementById("dx-typo-view-raw");
    const btnUpdate = document.getElementById("dx-typo-btn-update");
    const btnBackup = document.getElementById("dx-typo-btn-backup");
    const btnRefresh = document.getElementById("dx-typo-btn-refresh");
    const btnClear = document.getElementById("dx-typo-btn-clear");
    const btnPrompt = document.getElementById("dx-typo-btn-prompt");
    const btnMinimize = document.getElementById("dx-typo-btn-minimize");
    const btnClose = document.getElementById("dx-typo-btn-close"); // NEW CLOSE BUTTON
    const bodyContent = document.getElementById("dx-typo-body");

    // Prevent drag interference when clicking the minimize/close buttons
    btnMinimize.onmousedown = (e) => e.stopPropagation();
    btnClose.onmousedown = (e) => e.stopPropagation();

    // Close logic
    btnClose.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.close();
    };

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

    btnPrompt.onclick = (e) => {
      e.preventDefault();
      const aiPrompt = `Generate a complete responsive typography token system for Elementor.

Requirements:
- Output MUST be a valid JSON array of objects.
- Each object represents one typography style.
- The base object MUST include "title" (e.g. "Primary", "H1", "Text Base") and "typography_typography": "custom".
- For font sizes and line heights, use Elementor's nested object structure mapping the value to "size" and setting the "unit" (e.g., "rem", "px", "em", "custom"). Keep "sizes": [].
- If using clamp(), set "unit": "custom" and put the clamp string in "size".
- Do NOT include comments.
- Do NOT include markdown formatting.
- Return ONLY a valid JSON array.

Output format example:
[
  {
    "title": "H1",
    "typography_typography": "custom",
    "typography_font_family": "Manrope",
    "typography_font_weight": "700",
    "typography_font_size": {
      "unit": "custom",
      "size": "clamp(2.4883rem, 1.8465rem + 3.2093vw, 4.7348rem)",
      "sizes": []
    },
    "typography_line_height": {
      "unit": "em",
      "size": 1.1,
      "sizes": []
    }
  }
]

Please generate a full scale including Primary/Secondary styles, H1 through H6 sizes and line-heights, base text, text-sm, text-button, and text-eyebrow.`;

      navigator.clipboard
        .writeText(aiPrompt)
        .then(() => this.showStatus("Prompt copied!", "success"))
        .catch(() => this.showStatus("Failed to copy.", "error"));
    };

    btnRefresh.onclick = async (e) => {
      e.preventDefault();
      await this.fetchInitialData();
      this.showStatus("Reloaded from database.", "success");
    };

    btnClear.onclick = (e) => {
      e.preventDefault();
      if (confirm("Clear all typography? (You must click 'Apply' to save).")) {
        this.setWorkspaceTypography([]);
        this.evaluateApplyButtonState();
      }
    };

    btnBackup.onclick = (e) => {
      e.preventDefault();
      const currentTypo = this.parseTypography() || this.originalTypography;
      if (!currentTypo || currentTypo.length === 0) {
        this.showStatus("No typography to backup.", "error");
        return;
      }
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(currentTypo, null, 4));
      const anchor = document.createElement("a");
      anchor.setAttribute("href", dataStr);
      anchor.setAttribute(
        "download",
        "elementor-custom-typography-backup.json",
      );
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      this.showStatus("Backup downloaded!", "success");
    };

    tabUi.onclick = (e) => {
      e.preventDefault();
      this.currentView = "ui";
      viewUi.style.display = "block";
      viewRaw.style.display = "none";
      tabUi.style.background = "#444";
      tabUi.style.color = "#fff";
      tabRaw.style.background = "#222";
      tabRaw.style.color = "#aaa";

      const typo = this.parseTypography();
      if (typo) {
        this.processTypographyArray(typo);
        this.renderGrid();
      } else if (
        document.getElementById("dx-typo-json-input").value.trim() !== ""
      ) {
        document.getElementById("dx-typo-grid").innerHTML =
          '<div style="color:#ff7777; font-size:10px; width: 100%;">Invalid JSON in RAW tab.</div>';
      }
      this.evaluateApplyButtonState();
      this.livePreviewTypography();
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

    btnUpdate.onclick = (e) => {
      e.preventDefault();
      if (btnUpdate.disabled) return;

      let typo = this.parseTypography();
      if (!typo) {
        this.showStatus("Cannot apply: Invalid JSON.", "error");
        return;
      }

      typo = this.processTypographyArray(typo);
      this.updateElementor(typo);
    };
  }

  buildOriginalTokenMap(typography) {
    this.originalTokenMap.clear();
    if (!Array.isArray(typography)) return;

    typography.forEach((t) => {
      if (!t._id) return;
      const prefix = `--e-global-typography-${t._id}`;

      if (t.typography_font_family) {
        this.originalTokenMap.set(
          `${prefix}-font-family`,
          `"${t.typography_font_family}"`,
        );
      }
      if (t.typography_font_weight) {
        this.originalTokenMap.set(
          `${prefix}-font-weight`,
          String(t.typography_font_weight),
        );
      }
      if (t.typography_font_size && t.typography_font_size.size) {
        const unit = t.typography_font_size.unit || "px";
        const val =
          unit === "custom"
            ? t.typography_font_size.size
            : `${t.typography_font_size.size}${unit}`;
        this.originalTokenMap.set(`${prefix}-font-size`, val);
      }
      if (t.typography_line_height && t.typography_line_height.size) {
        const unit = t.typography_line_height.unit || "em";
        const val =
          unit === "custom"
            ? t.typography_line_height.size
            : `${t.typography_line_height.size}${unit}`;
        this.originalTokenMap.set(`${prefix}-line-height`, val);
      }
    });
  }

  livePreviewTypography() {
    const typography = this.parseTypography();
    if (!Array.isArray(typography)) return;

    // 1. Gather all potential targets in the main document
    const allNodes = [document.documentElement, document.body];
    const kitElement = document.querySelector('[class*="elementor-kit-"]');
    if (kitElement) allNodes.push(kitElement);

    // 2. Gather iframe targets if the editor is active
    const iframe = document.getElementById("elementor-preview-iframe");
    if (iframe && iframe.contentDocument) {
      const iframeDoc = iframe.contentDocument;
      allNodes.push(iframeDoc.documentElement, iframeDoc.body);
      const iframeKit = iframeDoc.querySelector('[class*="elementor-kit-"]');
      if (iframeKit) allNodes.push(iframeKit);
    }

    const currentVars = new Set();
    const usedIds = new Set();

    // Pass 1: Collect Explicit IDs
    typography.forEach((t) => {
      if (t && t._id && t._id.trim() !== "") {
        usedIds.add(t._id.trim());
      }
    });

    // Pass 2: Apply styles
    typography.forEach((t) => {
      if (!t) return;
      let varId = t._id && t._id.trim() !== "" ? t._id.trim() : null;

      // Temporarily generate an ID for preview if it's missing
      if (!varId) {
        let baseId = (t.title || "typo")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        if (!baseId) baseId = "typo";
        let newId = baseId;
        let counter = 1;
        while (usedIds.has(newId)) {
          newId = `${baseId}-${counter}`;
          counter++;
        }
        varId = newId;
        usedIds.add(varId);
      }

      const prefix = `--e-global-typography-${varId}`;
      const varsToApply = [];

      if (t.typography_font_family) {
        varsToApply.push({
          prop: `${prefix}-font-family`,
          val: `"${t.typography_font_family}"`,
        });
      }
      if (t.typography_font_weight) {
        varsToApply.push({
          prop: `${prefix}-font-weight`,
          val: String(t.typography_font_weight),
        });
      }
      if (t.typography_font_size && t.typography_font_size.size) {
        const unit = t.typography_font_size.unit || "px";
        const val =
          unit === "custom"
            ? t.typography_font_size.size
            : `${t.typography_font_size.size}${unit}`;
        varsToApply.push({ prop: `${prefix}-font-size`, val: val });
      }
      if (t.typography_line_height && t.typography_line_height.size) {
        const unit = t.typography_line_height.unit || "em";
        const val =
          unit === "custom"
            ? t.typography_line_height.size
            : `${t.typography_line_height.size}${unit}`;
        varsToApply.push({ prop: `${prefix}-line-height`, val: val });
      }

      varsToApply.forEach((v) => {
        currentVars.add(v.prop);
        const originalValue = this.originalTokenMap.get(v.prop);

        // Only inject inline style if value differs from the original baseline
        if (originalValue !== v.val) {
          allNodes.forEach((node) => {
            node.style.setProperty(v.prop, v.val, "important");
          });
        } else {
          allNodes.forEach((node) => {
            node.style.removeProperty(v.prop);
          });
        }
      });
    });

    // Cleanup vars that were completely removed from JSON
    this.previewedVars.forEach((oldVar) => {
      if (!currentVars.has(oldVar)) {
        allNodes.forEach((node) => node.style.removeProperty(oldVar));
      }
    });

    this.previewedVars = currentVars;
  }

  evaluateApplyButtonState() {
    const btn = document.getElementById("dx-typo-btn-update");
    if (!btn) return;

    const currentTypo = this.parseTypography();

    // Only enable if JSON is valid and different from original
    const isChanged =
      JSON.stringify(currentTypo) !== JSON.stringify(this.originalTypography);

    if (currentTypo !== null && isChanged) {
      btn.disabled = false;
      btn.style.cursor = "pointer";
      btn.style.opacity = "1";
    } else {
      btn.disabled = true;
      btn.style.cursor = "not-allowed";
      btn.style.opacity = "0.4";
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
      if (t && t._id && t._id.trim() !== "") {
        usedIds.add(t._id.trim());
      }
    });

    const processed = typography.map((t) => {
      if (t && typeof t === "object") {
        if (!t._id || t._id.trim() === "") {
          let baseId = (t.title || "typo")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          if (!baseId) baseId = "typo";

          let newId = baseId;
          let counter = 1;
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

    if (modified) {
      const textarea = document.getElementById("dx-typo-json-input");
      if (textarea) textarea.value = JSON.stringify(processed, null, 4);
    }

    return processed;
  }

  setWorkspaceTypography(typography) {
    const safeTypo = Array.isArray(typography) ? typography : [];
    document.getElementById("dx-typo-json-input").value =
      safeTypo.length > 0 ? JSON.stringify(safeTypo, null, 4) : "[]";
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
        const typoData = data.custom_typography || data;
        this.originalTypography = typoData;
        this.buildOriginalTokenMap(this.originalTypography); // Setup baseline for preview
        this.setWorkspaceTypography(typoData);
      }
    } catch (e) {
      this.showStatus("Failed to load typography data.", "error");
    }
  }

  renderGrid() {
    const grid = document.getElementById("dx-typo-grid");
    if (!grid) return;
    grid.innerHTML = "";

    const typography = this.parseTypography();
    if (!Array.isArray(typography) || typography.length === 0) {
      grid.innerHTML =
        '<div style="color:#777; font-size:10px; width: 100%;">No typography found. Switch to RAW tab to paste JSON.</div>';
      return;
    }

    typography.forEach((t) => {
      if (!t || !t.title) return;

      const pill = document.createElement("div");
      pill.className = "dx-typo-pill";
      pill.innerText = t.title;
      pill.title = `ID: ${t._id || "pending-save"}`;

      pill.onclick = () => {
        const fallbackId = t._id || "pending-save";
        const prefix = `--e-global-typography-${fallbackId}`;

        let cssLines = [];

        // Dynamically build rules only for the properties that exist in JSON
        if (t.typography_font_family)
          cssLines.push(`font-family: var(${prefix}-font-family);`);
        if (t.typography_font_weight)
          cssLines.push(`font-weight: var(${prefix}-font-weight);`);
        if (t.typography_font_size)
          cssLines.push(`font-size: var(${prefix}-font-size);`);
        if (t.typography_line_height)
          cssLines.push(`line-height: var(${prefix}-line-height);`);

        // Fallback incase the item is completely empty
        if (cssLines.length === 0) {
          cssLines = [
            `font-family: var(${prefix}-font-family);`,
            `font-weight: var(${prefix}-font-weight);`,
            `font-size: var(${prefix}-font-size);`,
            `line-height: var(${prefix}-line-height);`,
          ];
        }

        const cssBlock = cssLines.join("\n");

        navigator.clipboard
          .writeText(cssBlock)
          .then(() =>
            this.showStatus(`Copied CSS block for ${t.title}`, "success"),
          )
          .catch(() => this.showStatus("Failed to copy CSS.", "error"));
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
        this.showStatus("Typography Applied! Reloading...", "success");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error("Server error");
      }
    } catch (e) {
      this.showStatus("Failed to apply typography.", "error");
      if (btn) {
        btn.innerText = "Apply";
        this.evaluateApplyButtonState();
      }
    }
  }

  showStatus(msg, type) {
    const el = document.getElementById("dx-typo-status");
    el.style.display = "block";
    el.style.color = type === "error" ? "#ff7777" : "#61ce70";
    el.innerText = msg;
    clearTimeout(this.statusTimer);
    this.statusTimer = setTimeout(() => {
      el.style.display = "none";
    }, 3500);
  }
}

// ----------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // Save the instance to the window object so the Radial Menu can access it
  window.dxTypographyImporter = new ElementorDXTypographyImporter();
});
