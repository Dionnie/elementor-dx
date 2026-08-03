class ElementorDXColorImporter {
  constructor() {
    this.apiUrl = elementorDxSettings.root + "elementordx/v1/colors";
    this.nonce = elementorDxSettings.nonce;
    this.originalKitColors = null;
    this.currentView = "ui";
    this.previewedVars = new Set();
    this.isOpen = localStorage.getItem("dx_color_importer_open") === "true";
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
    localStorage.setItem("dx_color_importer_open", "true");
    if (!this.host) {
      this.injectFloatingUI();
      this.fetchInitialData();
    } else {
      this.shadow.getElementById("dx-color-importer-wrapper").style.display =
        "flex";
    }
  }

  close() {
    this.isOpen = false;
    localStorage.setItem("dx_color_importer_open", "false");
    if (this.shadow) {
      this.shadow.getElementById("dx-color-importer-wrapper").style.display =
        "none";
    }
  }

  injectFloatingUI() {
    if (document.getElementById("dx-color-host")) return;

    // Create the Shadow DOM Host Portal
    this.host = document.createElement("div");
    this.host.id = "dx-color-host";
    this.host.style.cssText =
      "position: fixed; z-index: 99999; top: 0; left: 0; width: 0; height: 0; overflow: visible;";
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
        position: fixed; top: 60px; right: 40px; width: 340px; background: #2b2b2b; color: #fff;
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
      .dx-icon-btn:hover { background: #2A0624; color: #F2ADF3; border-color: #620856; }
      .dx-icon-btn:active { transform: scale(0.95); }
      
      .dx-min-btn { cursor: pointer; color: #aaa; padding: 6px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; margin-right: -4px; }
      .dx-min-btn:hover { background: #333; color: #fff; }
      
      .dx-tab-btn { background: #222; color: #aaa; padding: 6px 10px; border-radius: 3px; font-weight: bold; cursor: pointer; transition: all 0.2s; font-size: 10px; }
      .dx-tab-btn:hover { background: #333; color: #fff; }
      .dx-tab-btn.is-active { background: #F2ADF3; color: #2A0624; }
      
      .dx-radio-group { display: flex; background: #222; border: 1px solid #555; border-radius: 4px; overflow: hidden; font-size: 11px; }
      .dx-radio-label { margin: 0; cursor: pointer; display: block; }
      .dx-radio-label input { display: none; }
      .dx-radio-label span { display: block; padding: 6px 12px; color: #aaa; transition: 0.2s; font-weight: 500; }
      .dx-radio-label input:checked + span { background: #F2ADF3; color: #2A0624; font-weight: bold; }
      .dx-radio-label:hover span { background: #333; }
      
      .dx-color-swatch { width: 100%; aspect-ratio: 1; border: 1px solid #444; border-radius: 4px; cursor: pointer; position: relative; box-shadow: 0 2px 4px rgba(0,0,0,0.4); transition: transform 0.1s; }
      .dx-color-swatch:hover { transform: scale(1.15); z-index: 2; border-color: #F2ADF3; }
      
      .dx-primary-btn { background: #F2ADF3; color: #2A0624; border-radius: 4px; padding: 10px; font-size: 11px; font-weight: bold; text-transform: uppercase; cursor: pointer; transition: all 0.2s; width: 100%; display: flex; justify-content: center; align-items: center; letter-spacing: 0.5px; }
      .dx-primary-btn:hover:not(:disabled) { background: #620856; color: #F2ADF3; }
      .dx-primary-btn:active:not(:disabled) { transform: scale(0.98); }
      .dx-primary-btn:disabled { background: #333; color: #666; border: 1px solid #444; cursor: not-allowed; }

      textarea { width: 100%; background: #1e1e1e; color: #d4d4d4; border: 1px solid #444; border-radius: 4px; padding: 8px; font-family: monospace; font-size: 10px; resize: vertical; box-sizing: border-box; }
      svg { display: block; }
    `;
    this.shadow.appendChild(styles);

    const wrapper = document.createElement("div");
    wrapper.id = "dx-color-importer-wrapper";
    wrapper.className = "dx-wrapper";

    wrapper.innerHTML = `
      <div id="dx-drag-handle" class="dx-header">
        <h4>Custom Colors</h4>
        <div style="display:flex; gap:4px; align-items:center;">
          <button id="dx-btn-minimize" class="dx-min-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
          <button id="dx-btn-close" class="dx-min-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
      </div>
      <div id="dx-color-body" class="dx-body">
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
            <div id="dx-color-grid" style="display:grid; grid-template-columns: repeat(11, 1fr); gap:4px; margin-bottom:12px; max-height:220px; overflow-y:auto; padding: 4px 2px;"></div>
            <div style="display:flex; align-items:center; justify-content:space-between; background:#1e1e1e; padding:6px 8px; border:1px solid #444; border-radius:4px;">
              <div style="color:#aaa; display:flex; align-items:center; padding: 0 4px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></div>
              <div class="dx-radio-group">
                <label class="dx-radio-label"><input type="radio" name="dx-copy" value="hex" checked><span>Hex</span></label>
                <label class="dx-radio-label"><input type="radio" name="dx-copy" value="rgba"><span>RGBA</span></label>
                <label class="dx-radio-label"><input type="radio" name="dx-copy" value="var"><span>Var</span></label>
              </div>
            </div>
          </div>
          <div id="dx-view-raw" style="display:none;">
            <textarea id="dx-color-json-input" rows="10"></textarea>
          </div>
        </div>
        <button id="dx-btn-update" class="dx-primary-btn">Apply Colors</button>
        <div id="dx-color-status" style="margin-top:8px; font-size:10px; color:#F2ADF3; display:none; text-align:center;"></div>
      </div>
    `;

    this.shadow.appendChild(wrapper);
    this.makeDraggable(wrapper, this.shadow.getElementById("dx-drag-handle"));
    this.bindEvents();

    this.shadow
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
      const body = this.shadow.getElementById("dx-color-body");
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
          `Generate a complete design token color palette from my brand colors.\nRequirements:\n- Use Tailwind CSS's 50–950 tonal scale.\n- Output colors using rgba(r, g, b, 1), NOT hex.\n- Return ONLY a valid JSON array.`,
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
      if (confirm("Clear colors?")) this.setWorkspaceColors([]);
    };
    this.shadow.getElementById("dx-btn-backup").onclick = (e) => {
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
      viewUi.style.display = "block";
      viewRaw.style.display = "none";
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
      viewUi.style.display = "none";
      viewRaw.style.display = "block";
      tabRaw.className = "dx-tab-btn is-active";
      tabUi.className = "dx-tab-btn";
    };

    this.shadow.getElementById("dx-btn-update").onclick = (e) => {
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
    const btn = this.shadow.getElementById("dx-btn-update");
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
      const raw = this.shadow.getElementById("dx-color-json-input").value;
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
      this.shadow.getElementById("dx-color-json-input").value = JSON.stringify(
        processed,
        null,
        4,
      );
    return processed;
  }

  setWorkspaceColors(colors) {
    this.shadow.getElementById("dx-color-json-input").value =
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
    const grid = this.shadow.getElementById("dx-color-grid");
    if (!grid) return;
    grid.innerHTML = "";
    const colors = this.parseColors();
    if (!Array.isArray(colors) || colors.length === 0) {
      grid.innerHTML =
        '<div style="color:#777; font-size:11px; grid-column: 1 / -1;">No colors found.</div>';
      return;
    }
    colors.forEach((c) => {
      if (!c || !c.color) return;
      const swatch = document.createElement("div");
      swatch.className = "dx-color-swatch";
      swatch.style.background = c.color;
      swatch.title = `${c.title || "Color"} (${c.color})`;
      swatch.onclick = () => {
        const mode = this.shadow.querySelector(
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
    const btn = this.shadow.getElementById("dx-btn-update");
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
    const el = this.shadow.getElementById("dx-color-status");
    el.style.display = "block";
    el.style.color = type === "error" ? "#e74c3c" : "#F2ADF3";
    el.innerText = msg;
    clearTimeout(this.statusTimer);
    this.statusTimer = setTimeout(() => {
      el.style.display = "none";
    }, 3500);
  }
}
