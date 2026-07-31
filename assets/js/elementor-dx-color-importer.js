class ElementorDXColorImporter {
  constructor() {
    this.apiUrl = elementorDxSettings.root + "elementordx/v1/colors";
    this.nonce = elementorDxSettings.nonce;
    this.originalKitColors = null;
    this.currentView = "ui";
    this.previewedVars = new Set();
    this.init();
  }

  init() {
    this.injectFloatingUI();
    this.fetchInitialData();
  }

  injectFloatingUI() {
    if (document.getElementById("dx-color-importer-wrapper")) return;

    // Inject minimal scoped styles for the UI components
    const styles = document.createElement("style");
    styles.id = "dx-color-styles";
    styles.innerHTML = `
      .dx-icon-btn {
        background: transparent; border: 1px solid #444; color: #aaa; 
        padding: 6px; cursor: pointer; border-radius: 4px; 
        display: flex; align-items: center; justify-content: center;
        transition: all 0.2s;
      }
      .dx-icon-btn:hover { background: #333; color: #fff; border-color: #666; }
      
      .dx-min-btn {
        background: transparent; border: none; color: #aaa; 
        padding: 6px; cursor: pointer; border-radius: 4px; 
        display: flex; align-items: center; justify-content: center;
        transition: all 0.2s; margin-right: -4px;
      }
      .dx-min-btn:hover { background: #333; color: #fff; }

      .dx-radio-group {
        display: flex; background: #222; border: 1px solid #555; 
        border-radius: 4px; overflow: hidden; font-size: 11px;
      }
      .dx-radio-label { margin: 0; cursor: pointer; }
      .dx-radio-label input { display: none; }
      .dx-radio-label span {
        display: block; padding: 4px 10px; color: #999; transition: 0.2s;
        font-weight: 500;
      }
      .dx-radio-label input:checked + span { background: #444; color: #fff; }
      .dx-radio-label:hover span { background: #333; }
      
      .dx-color-swatch {
        width: 100%; aspect-ratio: 1; border: 1px solid #444; 
        border-radius: 4px; cursor: pointer; position: relative; 
        box-shadow: 0 2px 4px rgba(0,0,0,0.4); transition: transform 0.1s;
      }
      .dx-color-swatch:hover { transform: scale(1.15); z-index: 2; border-color: #aaa; }
    `;
    document.head.appendChild(styles);

    const wrapper = document.createElement("div");
    wrapper.id = "dx-color-importer-wrapper";
    wrapper.style.cssText = `
      position: fixed; top: 60px; right: 40px; width: 340px; background: #2b2b2b;
      border: 1px solid #444; border-radius: 6px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      z-index: 99999; font-family: sans-serif; display: flex; flex-direction: column;
    `;

    wrapper.innerHTML = `
      <!-- Draggable Header -->
      <div id="dx-drag-handle" style="cursor: grab; background: #1e1e1e; padding: 10px 12px; border-radius: 6px 6px 0 0; border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center;">
        <h4 style="margin:0; color:#fff; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; pointer-events: none;">Custom Colors</h4>
        <button id="dx-btn-minimize" class="dx-min-btn" title="Toggle Panel">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      </div>

      <!-- Main Body Content -->
      <div id="dx-color-body" style="padding: 12px;">
        
        <!-- Action Buttons -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div style="display:flex; gap:6px;">
            <button id="dx-btn-prompt" class="dx-icon-btn" title="Copy AI Prompt to Clipboard">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
            </button>
            <button id="dx-btn-refresh" class="dx-icon-btn" title="Refresh from Database">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
            </button>
            <button id="dx-btn-clear" class="dx-icon-btn" title="Clear Workspace">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
            <button id="dx-btn-backup" class="dx-icon-btn" title="Download Backup">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            </button>
          </div>
          
          <!-- Workspace Tabs -->
          <div id="dx-workspace-tabs" style="display:flex; gap:4px; font-size:10px;">
            <button id="dx-tab-ui" style="background:#444; border:none; color:#fff; padding:4px 8px; cursor:pointer; border-radius:3px;">UI</button>
            <button id="dx-tab-raw" style="background:#222; border:none; color:#aaa; padding:4px 8px; cursor:pointer; border-radius:3px;">RAW</button>
          </div>
        </div>

        <!-- Workspace Container -->
        <div id="dx-workspace" style="display:block; margin-bottom:12px;">
          
          <!-- Workspace: UI -->
          <div id="dx-view-ui" style="display:block;">
            <div id="dx-color-grid" style="display:grid; grid-template-columns: repeat(11, 1fr); gap:4px; margin-bottom:12px; max-height:220px; overflow-y:auto; padding: 4px 2px;"></div>
            
            <!-- Compact Copy on Click Toolbar -->
            <div style="display:flex; align-items:center; justify-content:space-between; background:#1e1e1e; padding:6px 8px; border:1px solid #444; border-radius:4px;">
              
              <div style="color:#aaa; display:flex; align-items:center; justify-content:center; padding: 0 4px;" title="Select the format to copy when clicking a color">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </div>

              <div class="dx-radio-group">
                <label class="dx-radio-label" title="Copy as standard Hex code (e.g., #FFFFFF)">
                  <input type="radio" name="dx-copy" value="hex" checked>
                  <span>Hex</span>
                </label>
                <label class="dx-radio-label" title="Copy as CSS RGBA (e.g., rgba(255,255,255,1))">
                  <input type="radio" name="dx-copy" value="rgba">
                  <span>RGBA</span>
                </label>
                <label class="dx-radio-label" title="Copy as Elementor CSS Variable (e.g., var(--e-global-color-...))">
                  <input type="radio" name="dx-copy" value="var">
                  <span>Var</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Workspace: RAW -->
          <div id="dx-view-raw" style="display:none;">
            <textarea id="dx-color-json-input" rows="10" style="width:100%; background:#1e1e1e; color:#d4d4d4; border:1px solid #444; border-radius:4px; padding:8px; font-family:monospace; font-size:10px; resize:vertical; box-sizing: border-box;" placeholder="Paste or edit colors JSON array here..."></textarea>
          </div>
        </div>

        <!-- Final Action to Elementor -->
        <button id="dx-btn-update" class="elementor-button elementor-button-success" style="width:100%; justify-content:center; padding:8px; font-size:11px; background:#39b54a; color:#fff; border:none; border-radius:3px; transition: 0.2s;">Apply</button>
        <div id="dx-color-status" style="margin-top:8px; font-size:10px; color:#a4afb7; display:none; text-align:center;"></div>
      </div>
    `;

    document.body.appendChild(wrapper);

    this.makeDraggable(wrapper, document.getElementById("dx-drag-handle"));
    this.bindEvents();

    // Evaluate Apply Button and trigger Live Preview on textarea edit
    document
      .getElementById("dx-color-json-input")
      .addEventListener("input", () => {
        this.evaluateApplyButtonState();
        this.livePreviewColors();
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
    const tabUi = document.getElementById("dx-tab-ui");
    const tabRaw = document.getElementById("dx-tab-raw");
    const viewUi = document.getElementById("dx-view-ui");
    const viewRaw = document.getElementById("dx-view-raw");
    const btnUpdate = document.getElementById("dx-btn-update");
    const btnBackup = document.getElementById("dx-btn-backup");
    const btnRefresh = document.getElementById("dx-btn-refresh");
    const btnClear = document.getElementById("dx-btn-clear");
    const btnPrompt = document.getElementById("dx-btn-prompt");
    const btnMinimize = document.getElementById("dx-btn-minimize");
    const bodyContent = document.getElementById("dx-color-body");

    // Prevent drag interference when clicking the minimize button
    btnMinimize.onmousedown = (e) => {
      e.stopPropagation();
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
      const aiPrompt = `Generate a complete design token color palette from my brand colors.

Requirements:
- Use Tailwind CSS's 50–950 tonal scale.
- The color(s) I provide are ALWAYS the 500 shade.
- Generate realistic lighter (50–400) and darker (600–950) shades, not opacity variations.
- Output colors using rgba(r, g, b, 1), NOT hex.
- Do NOT include comments.
- Do NOT include explanations.
- Do NOT include markdown.
- Do NOT include ids.
- Return ONLY a valid JSON array.

Output format:

[
  {
    "title": "color-primary-50",
    "color": "rgba(239, 247, 253, 1)"
  },
  {
    "title": "color-primary-100",
    "color": "rgba(219, 236, 248, 1)"
  }
]

Naming convention:
- Primary: color-primary-50 ... color-primary-950
- Accent: color-accent-50 ... color-accent-950
- Accent 2: color-accent-2-50 ... color-accent-2-950
- Neutral: color-neutral-50 ... color-neutral-950

Special rule for black and white:
- color-black-* and color-white-* should use opacity instead of tonal shades.
- Example:
  color-black-50 = rgba(0,0,0,0.05)
  ...
  color-black-950 = rgba(0,0,0,1)

  color-white-50 = rgba(255,255,255,0.05)
  ...
  color-white-950 = rgba(255,255,255,1)

My brand colors are:
Primary: #0B5189
Accent: #F40600
Accent 2: #EBD52B`;

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
      if (confirm("Clear all colors? (You must click 'Apply' to save).")) {
        this.setWorkspaceColors([]);
        this.evaluateApplyButtonState();
      }
    };

    btnBackup.onclick = (e) => {
      e.preventDefault();
      const currentColors = this.parseColors() || this.originalKitColors;
      if (!currentColors || currentColors.length === 0) {
        this.showStatus("No colors to backup.", "error");
        return;
      }
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(currentColors, null, 4));
      const anchor = document.createElement("a");
      anchor.setAttribute("href", dataStr);
      anchor.setAttribute("download", "elementor-custom-colors-backup.json");
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

      const colors = this.parseColors();
      if (colors) {
        this.processColorsArray(colors);
        this.renderGrid();
      } else if (
        document.getElementById("dx-color-json-input").value.trim() !== ""
      ) {
        document.getElementById("dx-color-grid").innerHTML =
          '<div style="color:#ff7777; font-size:10px; grid-column: 1 / -1;">Invalid JSON in RAW tab.</div>';
      }
      this.evaluateApplyButtonState();
      this.livePreviewColors();
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

      let colors = this.parseColors();
      if (!colors) {
        this.showStatus("Cannot apply: Invalid JSON.", "error");
        return;
      }

      colors = this.processColorsArray(colors);
      this.updateElementor(colors);
    };
  }

  livePreviewColors() {
    const colors = this.parseColors();
    if (!Array.isArray(colors)) return; // Only process valid JSON

    // 1. Gather all potential targets in the main document (Root, Body, and Elementor Kit Wrapper)
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
    colors.forEach((c) => {
      if (c && c._id && c._id.trim() !== "") {
        usedIds.add(c._id.trim());
      }
    });

    // Pass 2: Apply colors
    colors.forEach((c) => {
      if (c && c.color) {
        let varId = c._id && c._id.trim() !== "" ? c._id.trim() : null;

        // Temporarily generate an ID for preview if it's missing
        if (!varId) {
          let baseId = (c.title || "color")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          if (!baseId) baseId = "color";
          let newId = baseId;
          let counter = 1;
          while (usedIds.has(newId)) {
            newId = `${baseId}-${counter}`;
            counter++;
          }
          varId = newId;
          usedIds.add(varId);
        }

        const cssVar = `--e-global-color-${varId}`;
        currentVars.add(cssVar);

        // Find original value from baseline to check for delta
        const originalColor = this.originalKitColors?.find(
          (orig) => orig._id === varId,
        );

        // Only inject inline style if value differs from the original
        if (!originalColor || originalColor.color !== c.color) {
          allNodes.forEach((node) => {
            node.style.setProperty(cssVar, c.color, "important");
          });
        } else {
          // If it matches the original, let the native Elementor stylesheet take over
          allNodes.forEach((node) => {
            node.style.removeProperty(cssVar);
          });
        }
      }
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
    const btn = document.getElementById("dx-btn-update");
    if (!btn) return;

    const currentColors = this.parseColors();

    // Only enable if JSON is valid and different from original
    const isChanged =
      JSON.stringify(currentColors) !== JSON.stringify(this.originalKitColors);

    if (currentColors !== null && isChanged) {
      btn.disabled = false;
      btn.style.cursor = "pointer";
      btn.style.opacity = "1";
    } else {
      btn.disabled = true;
      btn.style.cursor = "not-allowed";
      btn.style.opacity = "0.4";
    }
  }

  parseColors() {
    try {
      const raw = document.getElementById("dx-color-json-input").value;
      if (!raw.trim()) return [];
      let data = JSON.parse(raw);

      if (data && typeof data === "object" && !Array.isArray(data)) {
        if (data.custom_colors) data = data.custom_colors;
      }
      if (data && data.system_colors) delete data.system_colors;

      return Array.isArray(data) ? data : null;
    } catch (e) {
      return null;
    }
  }

  processColorsArray(colors) {
    if (!Array.isArray(colors)) return colors;

    let modified = false;
    const usedIds = new Set();

    colors.forEach((c) => {
      if (c && c._id && c._id.trim() !== "") {
        usedIds.add(c._id.trim());
      }
    });

    const processed = colors.map((c) => {
      if (c && typeof c === "object") {
        if (!c._id || c._id.trim() === "") {
          let baseId = (c.title || "color")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
          if (!baseId) baseId = "color";

          let newId = baseId;
          let counter = 1;
          while (usedIds.has(newId)) {
            newId = `${baseId}-${counter}`;
            counter++;
          }
          c._id = newId;
          usedIds.add(newId);
          modified = true;
        }
      }
      return c;
    });

    if (modified) {
      const textarea = document.getElementById("dx-color-json-input");
      if (textarea) textarea.value = JSON.stringify(processed, null, 4);
    }

    return processed;
  }

  setWorkspaceColors(colors) {
    const safeColors = Array.isArray(colors) ? colors : [];
    document.getElementById("dx-color-json-input").value =
      safeColors.length > 0 ? JSON.stringify(safeColors, null, 4) : "[]";
    this.renderGrid();
    this.evaluateApplyButtonState();
    this.livePreviewColors(); // Keep preview in sync
  }

  async fetchInitialData() {
    try {
      const res = await fetch(this.apiUrl, {
        method: "GET",
        headers: { "X-WP-Nonce": this.nonce },
      });
      if (res.ok) {
        const data = await res.json();
        this.originalKitColors = data.custom_colors || [];
        this.setWorkspaceColors(this.originalKitColors);
      }
    } catch (e) {
      this.showStatus("Failed to load data.", "error");
    }
  }

  // Reliable cross-browser color converter utilizing the DOM
  formatColor(colorStr, targetFormat) {
    const div = document.createElement("div");
    div.style.color = colorStr;
    document.body.appendChild(div);
    const computed = window.getComputedStyle(div).color; // returns rgb() or rgba()
    document.body.removeChild(div);

    if (targetFormat === "rgba") {
      return computed;
    }

    if (targetFormat === "hex") {
      const rgb = computed.match(
        /^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i,
      );
      return rgb && rgb.length === 4
        ? "#" +
            ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
            ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) +
            ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2)
        : colorStr;
    }

    return colorStr;
  }

  renderGrid() {
    const grid = document.getElementById("dx-color-grid");
    if (!grid) return;
    grid.innerHTML = "";

    const colors = this.parseColors();
    if (!Array.isArray(colors) || colors.length === 0) {
      grid.innerHTML =
        '<div style="color:#777; font-size:10px; grid-column: 1 / -1;">No colors found. Switch to RAW tab to paste JSON.</div>';
      return;
    }

    colors.forEach((c) => {
      if (!c || !c.color) return;
      const swatch = document.createElement("div");
      swatch.className = "dx-color-swatch";
      swatch.style.background = c.color;
      swatch.title = `${c.title || "Color"} (${c.color})`;

      swatch.onclick = () => {
        const mode = document.querySelector(
          'input[name="dx-copy"]:checked',
        ).value;
        const fallbackId = c._id || "pending-save";

        let textToCopy = "";
        if (mode === "var") {
          textToCopy = `var(--e-global-color-${fallbackId})`;
        } else {
          textToCopy = this.formatColor(c.color, mode);
        }

        navigator.clipboard
          .writeText(textToCopy)
          .then(() => this.showStatus("Copied: " + textToCopy, "success"));
      };

      grid.appendChild(swatch);
    });
  }

  async updateElementor(custom_colors) {
    const btn = document.getElementById("dx-btn-update");
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
        body: JSON.stringify({ custom_colors }),
      });

      if (res.ok) {
        this.originalKitColors = custom_colors;
        this.evaluateApplyButtonState();
        this.showStatus("Applied! Reloading...", "success");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error("Server error");
      }
    } catch (e) {
      this.showStatus("Failed to apply colors.", "error");
      if (btn) {
        btn.innerText = "Apply";
        this.evaluateApplyButtonState();
      }
    }
  }

  showStatus(msg, type) {
    const el = document.getElementById("dx-color-status");
    el.style.display = "block";
    el.style.color = type === "error" ? "#ff7777" : "#61ce70";
    el.innerText = msg;
    clearTimeout(this.statusTimer);
    this.statusTimer = setTimeout(() => {
      el.style.display = "none";
    }, 3500);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ElementorDXColorImporter();
});
