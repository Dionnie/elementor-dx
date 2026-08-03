class ElementorDXColorImporter {
  constructor() {
    this.apiUrl = elementorDxSettings.root + "elementordx/v1/colors";
    this.nonce = elementorDxSettings.nonce;
    this.originalKitColors = null;
    this.currentView = "ui";
    this.previewedVars = new Set();
    this.isOpen = localStorage.getItem("dx_color_importer_open") === "true";

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
    localStorage.setItem("dx_color_importer_open", "true");
    const wrapper = document.getElementById("dx-color-importer-wrapper");
    if (!wrapper) {
      this.injectFloatingUI();
      this.fetchInitialData();
    } else {
      wrapper.style.setProperty("display", "flex", "important");
    }
  }

  close() {
    this.isOpen = false;
    localStorage.setItem("dx_color_importer_open", "false");
    const wrapper = document.getElementById("dx-color-importer-wrapper");
    if (wrapper) wrapper.style.setProperty("display", "none", "important");
  }

  injectFloatingUI() {
    if (document.getElementById("dx-color-importer-wrapper")) return;

    const styles = document.createElement("style");
    styles.id = "dx-color-styles";
    styles.innerHTML = `
      /* Theme Immunity Reset */
      #dx-color-importer-wrapper, #dx-color-importer-wrapper * { box-sizing: border-box !important; font-family: sans-serif !important; letter-spacing: normal !important; line-height: 1.5 !important; }
      #dx-color-importer-wrapper button, #dx-color-importer-wrapper input, #dx-color-importer-wrapper textarea { appearance: none !important; -webkit-appearance: none !important; background: transparent !important; border: none !important; border-radius: 0 !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; outline: none !important; text-transform: none !important; }
      #dx-color-importer-wrapper button::before, #dx-color-importer-wrapper button::after { display: none !important; }

      /* Specific UI Styles */
      #dx-color-importer-wrapper .dx-icon-btn { cursor: pointer !important; border: 1px solid #444 !important; color: #aaa !important; padding: 6px !important; border-radius: 4px !important; display: flex !important; align-items: center !important; justify-content: center !important; transition: all 0.2s !important; background: transparent !important; }
      #dx-color-importer-wrapper .dx-icon-btn:hover { background: #2A0624 !important; color: #F2ADF3 !important; border-color: #620856 !important; }
      #dx-color-importer-wrapper .dx-icon-btn:active { transform: scale(0.95) !important; }
      
      #dx-color-importer-wrapper .dx-min-btn { cursor: pointer !important; color: #aaa !important; padding: 6px !important; border-radius: 4px !important; display: flex !important; align-items: center !important; justify-content: center !important; transition: all 0.2s !important; margin-right: -4px !important; background: transparent !important; border: none !important; }
      #dx-color-importer-wrapper .dx-min-btn:hover { background: #333 !important; color: #fff !important; }
      
      #dx-color-importer-wrapper .dx-tab-btn { background: #222 !important; border: none !important; color: #aaa !important; padding: 6px 10px !important; border-radius: 3px !important; font-weight: bold !important; cursor: pointer !important; transition: all 0.2s !important; }
      #dx-color-importer-wrapper .dx-tab-btn:hover { background: #333 !important; color: #fff !important; }
      #dx-color-importer-wrapper .dx-tab-btn.is-active { background: #F2ADF3 !important; color: #2A0624 !important; }
      
      #dx-color-importer-wrapper .dx-radio-group { display: flex !important; background: #222 !important; border: 1px solid #555 !important; border-radius: 4px !important; overflow: hidden !important; font-size: 11px !important; }
      #dx-color-importer-wrapper .dx-radio-label { margin: 0 !important; cursor: pointer !important; display: block !important; }
      #dx-color-importer-wrapper .dx-radio-label input { display: none !important; }
      #dx-color-importer-wrapper .dx-radio-label span { display: block !important; padding: 6px 12px !important; color: #aaa !important; transition: 0.2s !important; font-weight: 500 !important; background: transparent !important; border: none !important; }
      #dx-color-importer-wrapper .dx-radio-label input:checked + span { background: #F2ADF3 !important; color: #2A0624 !important; font-weight: bold !important; }
      #dx-color-importer-wrapper .dx-radio-label:hover span { background: #333 !important; }
      
      #dx-color-importer-wrapper .dx-color-swatch { width: 100% !important; aspect-ratio: 1 !important; border: 1px solid #444 !important; border-radius: 4px !important; cursor: pointer !important; position: relative !important; box-shadow: 0 2px 4px rgba(0,0,0,0.4) !important; transition: transform 0.1s !important; }
      #dx-color-importer-wrapper .dx-color-swatch:hover { transform: scale(1.15) !important; z-index: 2 !important; border-color: #F2ADF3 !important; }
      
      #dx-color-importer-wrapper .dx-primary-btn { background: #F2ADF3 !important; color: #2A0624 !important; border: none !important; border-radius: 4px !important; padding: 10px !important; font-size: 11px !important; font-weight: bold !important; text-transform: uppercase !important; cursor: pointer !important; transition: all 0.2s !important; width: 100% !important; display: flex !important; justify-content: center !important; align-items: center !important; letter-spacing: 0.5px !important; }
      #dx-color-importer-wrapper .dx-primary-btn:hover:not(:disabled) { background: #620856 !important; color: #F2ADF3 !important; }
      #dx-color-importer-wrapper .dx-primary-btn:active:not(:disabled) { transform: scale(0.98) !important; }
      #dx-color-importer-wrapper .dx-primary-btn:disabled { background: #333 !important; color: #666 !important; border: 1px solid #444 !important; cursor: not-allowed !important; filter: none !important; opacity: 1 !important; }
    `;
    document.head.appendChild(styles);

    const wrapper = document.createElement("div");
    wrapper.id = "dx-color-importer-wrapper";
    wrapper.style.cssText = `
      position: fixed !important; top: 60px !important; right: 40px !important; width: 340px !important; background: #2b2b2b !important;
      border: 1px solid #444 !important; border-radius: 6px !important; box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
      z-index: 99999 !important; font-family: sans-serif !important; display: flex !important; flex-direction: column !important;
    `;

    wrapper.innerHTML = `
      <div id="dx-drag-handle" style="cursor: grab !important; background: #1e1e1e !important; padding: 10px 12px !important; border-radius: 6px 6px 0 0 !important; border-bottom: 1px solid #444 !important; display: flex !important; justify-content: space-between !important; align-items: center !important;">
        <h4 style="margin:0 !important; color:#fff !important; font-size:11px !important; text-transform:uppercase !important; letter-spacing:0.5px !important; pointer-events: none !important;">Custom Colors</h4>
        <div style="display:flex !important; gap:4px !important; align-items:center !important;">
          <button id="dx-btn-minimize" class="dx-min-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
          <button id="dx-btn-close" class="dx-min-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
      </div>
      <div id="dx-color-body" style="padding: 12px !important;">
        <div style="display:flex !important; justify-content:space-between !important; align-items:center !important; margin-bottom:12px !important;">
          <div style="display:flex !important; gap:6px !important;">
            <button id="dx-btn-prompt" class="dx-icon-btn" title="Copy AI Prompt"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg></button>
            <button id="dx-btn-refresh" class="dx-icon-btn" title="Refresh"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg></button>
            <button id="dx-btn-clear" class="dx-icon-btn" title="Clear"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
            <button id="dx-btn-backup" class="dx-icon-btn" title="Backup"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></button>
          </div>
          <div style="display:flex !important; gap:4px !important; font-size:10px !important;">
            <button id="dx-tab-ui" class="dx-tab-btn is-active">UI</button>
            <button id="dx-tab-raw" class="dx-tab-btn">RAW</button>
          </div>
        </div>
        <div id="dx-workspace" style="margin-bottom:12px !important;">
          <div id="dx-view-ui" style="display:block !important;">
            <div id="dx-color-grid" style="display:grid !important; grid-template-columns: repeat(11, 1fr) !important; gap:4px !important; margin-bottom:12px !important; max-height:220px !important; overflow-y:auto !important; padding: 4px 2px !important;"></div>
            <div style="display:flex !important; align-items:center !important; justify-content:space-between !important; background:#1e1e1e !important; padding:6px 8px !important; border:1px solid #444 !important; border-radius:4px !important;">
              <div style="color:#aaa !important; display:flex !important; align-items:center !important; justify-content:center !important; padding: 0 4px !important;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></div>
              <div class="dx-radio-group">
                <label class="dx-radio-label"><input type="radio" name="dx-copy" value="hex" checked><span>Hex</span></label>
                <label class="dx-radio-label"><input type="radio" name="dx-copy" value="rgba"><span>RGBA</span></label>
                <label class="dx-radio-label"><input type="radio" name="dx-copy" value="var"><span>Var</span></label>
              </div>
            </div>
          </div>
          <div id="dx-view-raw" style="display:none !important;">
            <textarea id="dx-color-json-input" rows="10" style="width:100% !important; background:#1e1e1e !important; color:#d4d4d4 !important; border:1px solid #444 !important; border-radius:4px !important; padding:8px !important; font-family:monospace !important; font-size:10px !important; resize:vertical !important; box-sizing: border-box !important; outline:none !important; margin:0 !important;"></textarea>
          </div>
        </div>
        <button id="dx-btn-update" class="dx-primary-btn">Apply Colors</button>
        <div id="dx-color-status" style="margin-top:8px !important; font-size:10px !important; color:#F2ADF3 !important; display:none !important; text-align:center !important;"></div>
      </div>
    `;

    document.body.appendChild(wrapper);
    this.makeDraggable(wrapper, document.getElementById("dx-drag-handle"));
    this.bindEvents();

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
    const tabUi = document.getElementById("dx-tab-ui"),
      tabRaw = document.getElementById("dx-tab-raw"),
      viewUi = document.getElementById("dx-view-ui"),
      viewRaw = document.getElementById("dx-view-raw");

    document.getElementById("dx-btn-close").onclick = (e) => {
      e.preventDefault();
      this.close();
    };
    document.getElementById("dx-btn-minimize").onclick = (e) => {
      e.preventDefault();
      const body = document.getElementById("dx-color-body");
      body.style.setProperty(
        "display",
        body.style.display === "none" ? "block" : "none",
        "important",
      );
    };

    document.getElementById("dx-btn-prompt").onclick = (e) => {
      e.preventDefault();
      navigator.clipboard
        .writeText(
          `Generate a complete design token color palette from my brand colors.\nRequirements:\n- Use Tailwind CSS's 50–950 tonal scale.\n- Output colors using rgba(r, g, b, 1), NOT hex.\n- Return ONLY a valid JSON array.`,
        )
        .then(() => this.showStatus("Prompt copied!", "success"));
    };

    document.getElementById("dx-btn-refresh").onclick = async (e) => {
      e.preventDefault();
      await this.fetchInitialData();
      this.showStatus("Reloaded", "success");
    };
    document.getElementById("dx-btn-clear").onclick = (e) => {
      e.preventDefault();
      if (confirm("Clear colors?")) this.setWorkspaceColors([]);
    };
    document.getElementById("dx-btn-backup").onclick = (e) => {
      e.preventDefault();
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(
          JSON.stringify(this.parseColors() || this.originalKitColors, null, 4),
        );
      const anchor = document.createElement("a");
      anchor.setAttribute("href", dataStr);
      anchor.setAttribute("download", "colors-backup.json");
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    };

    tabUi.onclick = (e) => {
      e.preventDefault();
      this.currentView = "ui";
      viewUi.style.setProperty("display", "block", "important");
      viewRaw.style.setProperty("display", "none", "important");
      tabUi.className = "dx-tab-btn is-active";
      tabRaw.className = "dx-tab-btn";
      const colors = this.parseColors();
      if (colors) {
        this.processColorsArray(colors);
        this.renderGrid();
      }
      this.evaluateApplyButtonState();
      this.livePreviewColors();
    };
    tabRaw.onclick = (e) => {
      e.preventDefault();
      this.currentView = "raw";
      viewUi.style.setProperty("display", "none", "important");
      viewRaw.style.setProperty("display", "block", "important");
      tabRaw.className = "dx-tab-btn is-active";
      tabUi.className = "dx-tab-btn";
    };

    document.getElementById("dx-btn-update").onclick = (e) => {
      e.preventDefault();
      const colors = this.processColorsArray(this.parseColors());
      if (colors) this.updateElementor(colors);
    };
  }

  livePreviewColors() {
    const colors = this.parseColors();
    if (!Array.isArray(colors)) return;
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
    colors.forEach((c) => {
      if (c && c._id) usedIds.add(c._id.trim());
    });
    colors.forEach((c) => {
      if (c && c.color) {
        let varId =
          c._id && c._id.trim() !== ""
            ? c._id.trim()
            : `color-${Math.random().toString(36).substr(2, 5)}`;
        const cssVar = `--e-global-color-${varId}`;
        currentVars.add(cssVar);
        const originalColor = this.originalKitColors?.find(
          (orig) => orig._id === varId,
        );
        if (!originalColor || originalColor.color !== c.color) {
          allNodes.forEach((node) =>
            node.style.setProperty(cssVar, c.color, "important"),
          );
        } else {
          allNodes.forEach((node) => node.style.removeProperty(cssVar));
        }
      }
    });
    this.previewedVars.forEach((oldVar) => {
      if (!currentVars.has(oldVar))
        allNodes.forEach((node) => node.style.removeProperty(oldVar));
    });
    this.previewedVars = currentVars;
  }

  evaluateApplyButtonState() {
    const btn = document.getElementById("dx-btn-update");
    if (!btn) return;
    const currentColors = this.parseColors();
    if (
      currentColors !== null &&
      JSON.stringify(currentColors) !== JSON.stringify(this.originalKitColors)
    ) {
      btn.disabled = false;
    } else {
      btn.disabled = true;
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
      if (c && c._id && c._id.trim() !== "") usedIds.add(c._id.trim());
    });
    const processed = colors.map((c) => {
      if (c && typeof c === "object" && (!c._id || c._id.trim() === "")) {
        let newId =
          (c.title || "color")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") || "color";
        let counter = 1,
          baseId = newId;
        while (usedIds.has(newId)) {
          newId = `${baseId}-${counter}`;
          counter++;
        }
        c._id = newId;
        usedIds.add(newId);
        modified = true;
      }
      return c;
    });
    if (modified)
      document.getElementById("dx-color-json-input").value = JSON.stringify(
        processed,
        null,
        4,
      );
    return processed;
  }

  setWorkspaceColors(colors) {
    document.getElementById("dx-color-json-input").value =
      Array.isArray(colors) && colors.length > 0
        ? JSON.stringify(colors, null, 4)
        : "[]";
    this.renderGrid();
    this.evaluateApplyButtonState();
    this.livePreviewColors();
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

  formatColor(colorStr, targetFormat) {
    if (targetFormat === "var") return colorStr;
    const div = document.createElement("div");
    div.style.setProperty("color", colorStr, "important");
    document.body.appendChild(div);
    const computed = window.getComputedStyle(div).color;
    document.body.removeChild(div);
    if (targetFormat === "rgba") return computed;
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
        '<div style="color:#777 !important; font-size:11px !important; grid-column: 1 / -1 !important;">No colors found.</div>';
      return;
    }
    colors.forEach((c) => {
      if (!c || !c.color) return;
      const swatch = document.createElement("div");
      swatch.className = "dx-color-swatch";
      swatch.style.setProperty("background", c.color, "important");
      swatch.title = `${c.title || "Color"} (${c.color})`;
      swatch.onclick = () => {
        const mode = document.querySelector(
          'input[name="dx-copy"]:checked',
        ).value;
        const textToCopy =
          mode === "var"
            ? `var(--e-global-color-${c._id || "pending"})`
            : this.formatColor(c.color, mode);
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
      this.showStatus("Failed.", "error");
      if (btn) {
        btn.innerText = "Apply Colors";
        this.evaluateApplyButtonState();
      }
    }
  }

  showStatus(msg, type) {
    const el = document.getElementById("dx-color-status");
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
