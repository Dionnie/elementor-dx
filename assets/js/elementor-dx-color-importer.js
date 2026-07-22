class ElementorDXColorImporter {
  constructor() {
    this.apiUrl = elementorDxSettings.root + "elementordx/v1/colors";
    this.nonce = elementorDxSettings.nonce;
    this.originalKitColors = null;
    this.currentView = "ui";
    this.init();
  }

  init() {
    this.setupPanelObserver();
  }

  setupPanelObserver() {
    const panel = document.getElementById("elementor-panel");
    if (!panel) return;

    const observer = new MutationObserver(() => {
      const targetSection = document.querySelector(
        ".elementor-control-section_global_colors",
      );
      if (targetSection) this.injectImporterUI(targetSection);
    });

    observer.observe(panel, { childList: true, subtree: true });
  }

  injectImporterUI(targetElement) {
    if (document.getElementById("dx-color-importer-wrapper")) return;

    const wrapper = document.createElement("div");
    wrapper.id = "dx-color-importer-wrapper";
    wrapper.style.cssText =
      "padding:12px; background:#2b2b2b; border-top:1px solid #444; border-bottom:1px solid #444; margin-bottom:15px; font-family:sans-serif;";

    wrapper.innerHTML = `
      <!-- Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h4 style="margin:0; color:#fff; font-size:11px; text-transform:uppercase; letter-spacing:0.5px;">Custom Colors</h4>
        <div style="display:flex; gap:4px;">
          <button id="dx-btn-refresh" style="background:transparent; border:1px solid #555; color:#aaa; padding:2px 6px; cursor:pointer; border-radius:2px; font-size:10px;" title="Refresh from API">🔄 Refresh</button>
          <button id="dx-btn-clear" style="background:transparent; border:1px solid #555; color:#e74c3c; padding:2px 6px; cursor:pointer; border-radius:2px; font-size:10px;" title="Clear Workspace">🗑️ Clear</button>
          <button id="dx-btn-backup" style="background:transparent; border:1px solid #555; color:#aaa; padding:2px 6px; cursor:pointer; border-radius:2px; font-size:10px;" title="Download Backup">📥 Backup</button>
        </div>
      </div>

      <!-- Workspace Container -->
      <div id="dx-workspace" style="display:block; margin-bottom:12px;">
        
        <!-- Workspace Tabs -->
        <div id="dx-workspace-tabs" style="display:flex; gap:4px; font-size:10px; justify-content:flex-end; margin-bottom:8px;">
          <button id="dx-tab-ui" style="background:#444; border:none; color:#fff; padding:2px 6px; cursor:pointer; border-radius:2px;">UI</button>
          <button id="dx-tab-raw" style="background:#222; border:none; color:#aaa; padding:2px 6px; cursor:pointer; border-radius:2px;">RAW</button>
        </div>

        <!-- Workspace: UI -->
        <div id="dx-view-ui" style="display:block;">
          <div id="dx-color-grid" style="display:flex; flex-wrap:wrap; gap:6px; max-height:110px; overflow-y:auto; margin-bottom:8px; padding:4px 0;"></div>
          <div style="display:flex; gap:8px; font-size:10px; color:#aaa; align-items:center;">
            <span>Copy on click:</span>
            <label style="cursor:pointer;"><input type="radio" name="dx-copy" value="hex" checked style="margin:0;"> Hex</label>
            <label style="cursor:pointer;"><input type="radio" name="dx-copy" value="var" style="margin:0;"> CSS Var</label>
          </div>
        </div>

        <!-- Workspace: RAW -->
        <div id="dx-view-raw" style="display:none;">
          <textarea id="dx-color-json-input" rows="8" style="width:100%; background:#1e1e1e; color:#d4d4d4; border:1px solid #444; border-radius:3px; padding:8px; font-family:monospace; font-size:10px; resize:vertical; box-sizing: border-box;" placeholder="Paste or edit colors JSON array here..."></textarea>
        </div>
      </div>

      <!-- Final Action to Elementor -->
      <button id="dx-btn-update" class="elementor-button elementor-button-success" style="width:100%; justify-content:center; padding:8px; font-size:11px;">Apply Custom Colors</button>
      <div id="dx-color-status" style="margin-top:8px; font-size:10px; color:#a4afb7; display:none; text-align:center;"></div>
    `;

    targetElement.insertAdjacentElement("afterend", wrapper);
    this.bindEvents();
    this.fetchInitialData();
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

    // Refresh from API
    btnRefresh.onclick = async (e) => {
      e.preventDefault();
      const originalText = btnRefresh.innerText;
      btnRefresh.innerText = "⏳...";
      await this.fetchInitialData();
      btnRefresh.innerText = originalText;
      this.showStatus("Colors reloaded from database.", "success");
    };

    // Clear Workspace
    btnClear.onclick = (e) => {
      e.preventDefault();
      if (
        confirm(
          "Clear all custom colors from the workspace? (You still need to click 'Apply' to save this deletion).",
        )
      ) {
        this.setWorkspaceColors([]);
        this.showStatus("Workspace cleared.", "success");
      }
    };

    // Download Backup
    btnBackup.onclick = (e) => {
      e.preventDefault();
      const currentColors = this.parseColors() || this.originalKitColors;
      if (!currentColors || currentColors.length === 0) {
        this.showStatus("No colors available to backup.", "error");
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

    // Tabs Switching
    tabUi.onclick = (e) => {
      e.preventDefault();
      this.currentView = "ui";
      viewUi.style.display = "block";
      viewRaw.style.display = "none";
      tabUi.style.background = "#444";
      tabUi.style.color = "#fff";
      tabRaw.style.background = "#222";
      tabRaw.style.color = "#aaa";

      // Process and format RAW data before rendering UI
      const colors = this.parseColors();
      if (colors) {
        this.processColorsArray(colors);
        this.renderGrid();
      } else if (
        document.getElementById("dx-color-json-input").value.trim() !== ""
      ) {
        document.getElementById("dx-color-grid").innerHTML =
          '<div style="color:#ff7777; font-size:10px; padding:10px 0;">Invalid JSON in RAW tab.</div>';
      }
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

    // APPLY TO ELEMENTOR BUTTON
    btnUpdate.onclick = (e) => {
      e.preventDefault();
      let colors = this.parseColors();

      if (!colors) {
        this.showStatus("Cannot apply: Invalid JSON.", "error");
        return;
      }

      // Ensure IDs are generated and formatted
      colors = this.processColorsArray(colors);
      this.updateElementor(colors);
    };
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

    // Pass 1: Collect existing, valid IDs to prevent collisions
    colors.forEach((c) => {
      if (c && c._id && c._id.trim() !== "") {
        usedIds.add(c._id.trim());
      }
    });

    // Pass 2: Generate missing IDs based on color titles
    const processed = colors.map((c) => {
      if (c && typeof c === "object") {
        if (!c._id || c._id.trim() === "") {
          // Generate a slug from the title, fallback to "color"
          let baseId = (c.title || "color")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

          if (!baseId) baseId = "color";

          let newId = baseId;
          let counter = 1;

          // Collision prevention loop
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

    // Automatically update the textarea if we fixed missing IDs
    if (modified) {
      const textarea = document.getElementById("dx-color-json-input");
      if (textarea) textarea.value = JSON.stringify(processed, null, 4);
    }

    return processed;
  }

  setWorkspaceColors(colors) {
    const safeColors = Array.isArray(colors) ? colors : [];
    document.getElementById("dx-color-json-input").value =
      safeColors.length > 0 ? JSON.stringify(safeColors, null, 4) : "";
    this.renderGrid();
  }

  async fetchInitialData() {
    try {
      const res = await fetch(this.apiUrl, {
        method: "GET",
        headers: { "X-WP-Nonce": this.nonce },
      });
      if (res.ok) {
        const data = await res.json();
        this.originalKitColors = data.custom_colors;
        this.setWorkspaceColors(data.custom_colors);
      }
    } catch (e) {
      this.showStatus("Failed to load plugin data.", "error");
    }
  }

  renderGrid() {
    const grid = document.getElementById("dx-color-grid");
    if (!grid) return;
    grid.innerHTML = "";

    const colors = this.parseColors();
    if (!Array.isArray(colors) || colors.length === 0) {
      grid.innerHTML =
        '<div style="color:#777; font-size:10px; padding:10px 0;">No colors found. Switch to RAW tab to paste JSON.</div>';
      return;
    }

    colors.forEach((c) => {
      if (!c || !c.color) return;
      const swatch = document.createElement("div");
      swatch.style.cssText = `width:24px; height:24px; background:${c.color}; border:1px solid #444; border-radius:4px; cursor:pointer; position:relative; box-shadow:0 2px 4px rgba(0,0,0,0.4); transition: transform 0.1s;`;
      swatch.title = `${c.title || "Color"} (${c.color})`;

      swatch.onmouseenter = () => (swatch.style.transform = "scale(1.15)");
      swatch.onmouseleave = () => (swatch.style.transform = "scale(1)");

      swatch.onclick = () => {
        const mode = document.querySelector(
          'input[name="dx-copy"]:checked',
        ).value;
        const fallbackId = c._id || "pending-save";
        const text =
          mode === "hex" ? c.color : `var(--e-global-color-${fallbackId})`;
        navigator.clipboard
          .writeText(text)
          .then(() => this.showStatus("Copied: " + text, "success"));
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
        this.showStatus("Colors Applied! Reloading Elementor...", "success");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error("Server error");
      }
    } catch (e) {
      this.showStatus("Failed to apply colors.", "error");
      if (btn) {
        btn.innerText = "Apply Custom Colors";
        btn.disabled = false;
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
