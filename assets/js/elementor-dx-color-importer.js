class ElementorDXColorImporter {
  constructor() {
    this.apiUrl = elementorDxSettings.root + "elementordx/v1/colors";
    this.nonce = elementorDxSettings.nonce;
    this.profiles = [];
    this.originalKitColors = null;
    this.hasUnsavedChanges = false;
    this.currentView = "ui";
    this.isManagerMode = false;
    this.selectedSlotIndex = null;
    this.init();
  }

  init() {
    this.injectStyles();
    this.setupPanelObserver();
  }

  injectStyles() {
    if (!document.getElementById("dx-color-styles")) {
      const style = document.createElement("style");
      style.id = "dx-color-styles";
      style.innerHTML = `
        .dx-empty-highlight { border-color: #f39c12 !important; color: #f39c12 !important; }
        .dx-active-slot { border-color: #3498db !important; background: #2c3e50 !important; color:#fff !important; }
        .dx-slot-btn { width:20px; height:20px; font-size:10px; line-height:20px; text-align:center; background:#222; color:#aaa; border:1px solid #444; border-radius:3px; cursor:pointer; user-select:none; transition: 0.2s; }
        .dx-slot-btn:hover { border-color: #aaa; }
        .dx-slot-has-data { border-color: #61ce70; color: #fff; }
        .dx-trash-btn { background:#c0392b; color:#fff; font-size:14px; line-height:1; width:20px; height:16px; border-radius:2px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-weight:bold; transition: 0.2s; }
        .dx-trash-btn:hover { background:#e74c3c; }
      `;
      document.head.appendChild(style);
    }
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
      <!-- Header & Navigation -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h4 id="dx-main-title" style="margin:0; color:#fff; font-size:11px; text-transform:uppercase; letter-spacing:0.5px;">Current Colors</h4>
        <div style="display:flex; gap:4px; font-size:10px; align-items:center;">
          <button id="dx-btn-backup" style="background:transparent; border:1px solid #555; color:#aaa; padding:2px 6px; cursor:pointer; border-radius:2px;" title="Download Backup">📥 Backup</button>
          <div id="dx-divider-backup" style="width:1px; height:12px; background:#555; margin:0 2px;"></div>
          <button id="dx-btn-toggle-manager" style="background:transparent; border:none; color:#aaa; font-size:14px; cursor:pointer; padding:0 4px; transition:0.2s;" title="Manage Profiles">&#9881;</button>
        </div>
      </div>

      <!-- Profile Slots (Manager Mode ONLY) -->
      <div id="dx-profile-section" style="display:none; background:#1e1e1e; border:1px solid #333; border-radius:3px; padding:10px 8px; margin-bottom:12px;">
        <div style="font-size:9px; color:#888; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">Saved Profiles</div>
        <div style="display:flex; align-items:center; gap:6px; min-height: 28px;">
          <div id="dx-slots" style="display:flex; gap:6px; flex-grow:1;"></div>
        </div>
      </div>

      <!-- Manager Mode Empty State -->
      <div id="dx-manager-empty-state" style="display:none; text-align:center; padding:15px; color:#777; font-size:10px; border:1px dashed #444; border-radius:3px; margin-bottom:12px;">
        Select a profile slot above to view or edit colors.
      </div>

      <!-- Shared Workspace Container (Grid/RAW + Inner Tabs) -->
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
          <textarea id="dx-color-json-input" rows="6" style="width:100%; background:#1e1e1e; color:#d4d4d4; border:1px solid #444; border-radius:3px; padding:8px; font-family:monospace; font-size:10px; resize:vertical;" placeholder="Live custom colors JSON..." readonly></textarea>
          
          <!-- In-Place Save Button (Only shows when RAW text is changed) -->
          <button id="dx-btn-save-slot" class="elementor-button elementor-button-success" style="width:100%; justify-content:center; padding:6px; margin-top:8px; font-size:10px; display:none; background:#28a745;">Save Updates to Slot</button>
        </div>

      </div>

      <!-- Final Action to Elementor -->
      <button id="dx-btn-update" class="elementor-button elementor-button-success" style="width:100%; justify-content:center; padding:8px; opacity:0.5; font-size:11px; display:none;" disabled>Apply Custom Colors</button>
      <div id="dx-color-status" style="margin-top:8px; font-size:10px; color:#a4afb7; display:none; text-align:center;"></div>
    `;

    targetElement.insertAdjacentElement("afterend", wrapper);
    this.bindEvents();
    this.fetchInitialData();
  }

  // Determines if the main "Apply Custom Colors" button should be visible/clickable
  updateApplyButtonState() {
    const btnUpdate = document.getElementById("dx-btn-update");
    if (!btnUpdate) return;

    // Only visible in Manager Mode when a slot is actively selected
    if (this.isManagerMode && this.selectedSlotIndex !== null) {
      btnUpdate.style.display = "flex";

      const colors = this.profiles[this.selectedSlotIndex].colors;
      const hasColors = Array.isArray(colors) && colors.length > 0;

      // Enable only if there are colors, AND there are no unsaved changes pending in RAW view
      if (hasColors && !this.hasUnsavedChanges) {
        btnUpdate.disabled = false;
        btnUpdate.style.opacity = "1";
      } else {
        btnUpdate.disabled = true;
        btnUpdate.style.opacity = "0.5";
      }
    } else {
      btnUpdate.style.display = "none";
    }
  }

  bindEvents() {
    const tabUi = document.getElementById("dx-tab-ui");
    const tabRaw = document.getElementById("dx-tab-raw");
    const viewUi = document.getElementById("dx-view-ui");
    const viewRaw = document.getElementById("dx-view-raw");

    const textarea = document.getElementById("dx-color-json-input");
    const btnSaveSlot = document.getElementById("dx-btn-save-slot");

    const btnUpdate = document.getElementById("dx-btn-update");
    const btnBackup = document.getElementById("dx-btn-backup");
    const divBackup = document.getElementById("dx-divider-backup");
    const btnToggleManager = document.getElementById("dx-btn-toggle-manager");

    const profileSection = document.getElementById("dx-profile-section");
    const workspace = document.getElementById("dx-workspace");
    const emptyState = document.getElementById("dx-manager-empty-state");
    const title = document.getElementById("dx-main-title");

    // View Split Toggle (Manager Mode vs Display Mode)
    btnToggleManager.onclick = (e) => {
      e.preventDefault();

      if (this.hasUnsavedChanges) {
        if (
          !confirm("You have unsaved changes. Discard them and close manager?")
        )
          return;
      }
      this.hasUnsavedChanges = false;
      btnSaveSlot.style.display = "none";

      this.isManagerMode = !this.isManagerMode;

      if (this.isManagerMode) {
        title.innerText = "Profile Manager";
        if (btnBackup) btnBackup.style.display = "none";
        if (divBackup) divBackup.style.display = "none";

        btnToggleManager.innerHTML = "&times;";
        btnToggleManager.title = "Close Manager";
        btnToggleManager.style.color = "#e74c3c";
        btnToggleManager.style.fontSize = "18px";

        profileSection.style.display = "block";
        textarea.readOnly = false;
        textarea.placeholder = "Paste JSON array here...";

        // Hide Workspace until a slot is clicked
        this.selectedSlotIndex = null;
        workspace.style.display = "none";
        emptyState.style.display = "block";

        this.renderSlots();
      } else {
        title.innerText = "Current Colors";
        if (btnBackup) btnBackup.style.display = "block";
        if (divBackup) divBackup.style.display = "block";

        btnToggleManager.innerHTML = "&#9881;";
        btnToggleManager.title = "Manage Profiles";
        btnToggleManager.style.color = "#aaa";
        btnToggleManager.style.fontSize = "14px";

        profileSection.style.display = "none";
        textarea.readOnly = true;
        textarea.placeholder = "Live custom colors JSON...";

        // Restore workspace to live colors
        this.selectedSlotIndex = null;
        emptyState.style.display = "none";
        workspace.style.display = "block";

        // Force to UI view for safety
        tabUi.click();
        this.setWorkspaceColors(this.originalKitColors);
        this.renderSlots();
      }

      this.updateApplyButtonState();
    };

    // Download Backup
    btnBackup.onclick = (e) => {
      e.preventDefault();
      if (!this.originalKitColors) {
        this.showStatus("No colors to backup yet.", "error");
        return;
      }
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(this.originalKitColors, null, 4));
      const anchor = document.createElement("a");
      anchor.setAttribute("href", dataStr);
      anchor.setAttribute("download", "elementor-custom-colors-backup.json");
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      this.showStatus("Backup JSON downloaded!", "success");
    };

    // Inner Tabs Switching
    tabUi.onclick = (e) => {
      e.preventDefault();
      this.currentView = "ui";
      viewUi.style.display = "block";
      viewRaw.style.display = "none";
      tabUi.style.background = "#444";
      tabUi.style.color = "#fff";
      tabRaw.style.background = "#222";
      tabRaw.style.color = "#aaa";

      // Auto-assign IDs to raw data before rendering UI
      const colors = this.parseColors();
      if (colors) this.processColorsArray(colors);

      this.renderGrid();
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

    // Detect Changes in RAW view (Triggers In-Place Save Button)
    textarea.addEventListener("input", () => {
      if (!this.isManagerMode || this.selectedSlotIndex === null) return;

      this.hasUnsavedChanges = true;
      btnSaveSlot.style.display = "flex"; // Reveal the Save to Slot button

      this.updateApplyButtonState(); // Disables the main apply button until saved
      if (viewUi.style.display === "block") this.renderGrid();
    });

    // IN-PLACE SAVE BUTTON (Saves workspace to currently selected slot)
    btnSaveSlot.onclick = (e) => {
      e.preventDefault();
      let colors = this.parseColors();

      if (colors) {
        colors = this.processColorsArray(colors);
        this.profiles[this.selectedSlotIndex].colors = colors;
        this.syncProfilesAPI();

        // Reset states
        this.hasUnsavedChanges = false;
        btnSaveSlot.style.display = "none";

        this.renderSlots(); // Updates borders/icons on slots
        this.renderGrid();
        this.updateApplyButtonState(); // Re-enables Elementor Apply button

        this.showStatus(
          `Successfully saved to Slot ${this.selectedSlotIndex + 1}`,
          "success",
        );
      } else {
        this.showStatus("Cannot save empty or invalid JSON.", "error");
      }
    };

    // APPLY TO ELEMENTOR BUTTON
    btnUpdate.onclick = (e) => {
      e.preventDefault();
      if (this.selectedSlotIndex === null) return;

      const colors = this.profiles[this.selectedSlotIndex].colors;
      if (colors && colors.length > 0) {
        this.updateElementor(colors);
      } else {
        this.showStatus("No valid colors to apply.", "error");
      }
    };
  }

  parseColors() {
    try {
      const raw = document.getElementById("dx-color-json-input").value;
      if (!raw.trim()) return null;
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
    const processed = colors.map((c) => {
      if (c && typeof c === "object") {
        if (!c._id || c._id.trim() === "") {
          c._id = Math.random().toString(36).substring(2, 9).padEnd(7, "0");
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
      safeColors.length > 0 ? JSON.stringify(safeColors, null, 4) : "";

    this.hasUnsavedChanges = false;
    document.getElementById("dx-btn-save-slot").style.display = "none";

    this.renderGrid();
    this.updateApplyButtonState();
  }

  async fetchInitialData() {
    try {
      const res = await fetch(this.apiUrl, {
        method: "GET",
        headers: { "X-WP-Nonce": this.nonce },
      });
      if (res.ok) {
        const data = await res.json();
        this.profiles = data.profiles;
        this.originalKitColors = data.custom_colors;

        // Always load into Display View initially
        this.setWorkspaceColors(data.custom_colors);
        this.selectedSlotIndex = null;
        this.renderSlots();
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
      if (this.isManagerMode) {
        grid.innerHTML =
          '<div style="color:#777; font-size:10px; padding:10px 0;">Slot is empty. Switch to RAW tab to paste JSON.</div>';
      }
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

  renderSlots() {
    const container = document.getElementById("dx-slots");
    if (!container) return;
    container.innerHTML = "";

    this.profiles.forEach((p, idx) => {
      const wrap = document.createElement("div");
      wrap.style.cssText =
        "display:flex; flex-direction:column; align-items:center; gap:4px;";

      // Slot Button
      const btn = document.createElement("div");
      btn.innerText = idx + 1;
      btn.className = "dx-slot-btn";

      const isEmpty = !p.colors || p.colors.length === 0;
      if (!isEmpty) btn.classList.add("dx-slot-has-data");

      btn.title = `Slot ${idx + 1}`;
      const isSelected = this.selectedSlotIndex === idx;

      // Active styling
      if (isSelected) {
        btn.classList.add("dx-active-slot");
      }

      btn.onclick = () => this.handleSlotClick(idx);

      // Icons Row (Trash Button ONLY)
      const iconsRow = document.createElement("div");
      iconsRow.style.cssText =
        "display:flex; justify-content:center; align-items:center;";

      if (!isEmpty) {
        const trash = document.createElement("div");
        trash.innerHTML = "&times;"; // ×
        trash.className = "dx-trash-btn";
        trash.title = `Clear Slot ${idx + 1}`;
        trash.onclick = () => {
          if (
            confirm(
              `Are you sure you want to completely clear Slot ${idx + 1}?`,
            )
          ) {
            this.profiles[idx].colors = null;

            // If the deleted slot was currently selected, reflect emptiness in workspace
            if (this.selectedSlotIndex === idx) {
              this.setWorkspaceColors([]);
            }

            this.syncProfilesAPI();
            this.showStatus(`Slot ${idx + 1} cleared`, "success");
          }
        };
        iconsRow.appendChild(trash);
      } else {
        // Invisible spacer to keep the grid perfectly aligned when empty
        const spacer = document.createElement("div");
        spacer.style.height = "16px";
        iconsRow.appendChild(spacer);
      }

      wrap.appendChild(btn);
      wrap.appendChild(iconsRow);
      container.appendChild(wrap);
    });
  }

  handleSlotClick(idx) {
    if (this.hasUnsavedChanges) {
      if (!confirm("You have unsaved changes in the RAW view. Discard them?"))
        return;
    }

    this.selectedSlotIndex = idx;

    // Hide Empty State, Reveal Workspace
    document.getElementById("dx-manager-empty-state").style.display = "none";
    document.getElementById("dx-workspace").style.display = "block";

    // Load colors from slot into workspace
    const p = this.profiles[idx];
    this.setWorkspaceColors(p.colors || []);

    this.renderSlots(); // Updates active slot highlight
  }

  async syncProfilesAPI() {
    try {
      await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": this.nonce,
        },
        body: JSON.stringify({ profiles: this.profiles }),
      });
      this.renderSlots();
    } catch (e) {
      console.error(e);
    }
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
