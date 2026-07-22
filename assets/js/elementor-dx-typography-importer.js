class ElementorDXTypographyImporter {
  constructor() {
    this.apiUrl = elementorDxSettings.root + "elementordx/v1/typography";
    this.nonce = elementorDxSettings.nonce;
    this.originalTypography = null;
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
      // Targets the Global Fonts section based on your HTML snippet
      const targetSection = document.querySelector(
        ".elementor-control-section_text_style",
      );
      if (targetSection) this.injectImporterUI(targetSection);
    });

    observer.observe(panel, { childList: true, subtree: true });
  }

  injectImporterUI(targetElement) {
    if (document.getElementById("dx-typo-importer-wrapper")) return;

    const wrapper = document.createElement("div");
    wrapper.id = "dx-typo-importer-wrapper";
    wrapper.style.cssText =
      "padding:12px; background:#2b2b2b; border-top:1px solid #444; border-bottom:1px solid #444; margin-bottom:15px; font-family:sans-serif;";

    wrapper.innerHTML = `
      <!-- Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h4 style="margin:0; color:#fff; font-size:11px; text-transform:uppercase; letter-spacing:0.5px;">Custom Typography</h4>
        <div style="display:flex; gap:4px;">
          <button id="dx-typo-btn-prompt" style="background:transparent; border:1px solid #555; color:#3498db; padding:2px 6px; cursor:pointer; border-radius:2px; font-size:10px;" title="Copy AI Prompt to Clipboard">🤖 AI Prompt</button>
          <button id="dx-typo-btn-refresh" style="background:transparent; border:1px solid #555; color:#aaa; padding:2px 6px; cursor:pointer; border-radius:2px; font-size:10px;" title="Refresh from API">🔄 Refresh</button>
          <button id="dx-typo-btn-clear" style="background:transparent; border:1px solid #555; color:#e74c3c; padding:2px 6px; cursor:pointer; border-radius:2px; font-size:10px;" title="Clear Workspace">🗑️ Clear</button>
          <button id="dx-typo-btn-backup" style="background:transparent; border:1px solid #555; color:#aaa; padding:2px 6px; cursor:pointer; border-radius:2px; font-size:10px;" title="Download Backup">📥 Backup</button>
        </div>
      </div>

      <!-- Workspace Container -->
      <div id="dx-typo-workspace" style="display:block; margin-bottom:12px;">
        
        <!-- Workspace Tabs -->
        <div id="dx-typo-workspace-tabs" style="display:flex; gap:4px; font-size:10px; justify-content:flex-end; margin-bottom:8px;">
          <button id="dx-typo-tab-ui" style="background:#444; border:none; color:#fff; padding:2px 6px; cursor:pointer; border-radius:2px;">UI</button>
          <button id="dx-typo-tab-raw" style="background:#222; border:none; color:#aaa; padding:2px 6px; cursor:pointer; border-radius:2px;">RAW</button>
        </div>

        <!-- Workspace: UI -->
        <div id="dx-typo-view-ui" style="display:block;">
          <div id="dx-typo-grid" style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px; padding:4px 0;"></div>
          
          <div style="font-size:10px; color:#aaa; margin-bottom:4px;">Copy Variable on click:</div>
          <div style="display:flex; flex-wrap:wrap; gap:8px; font-size:10px; color:#ccc; align-items:center;">
            <label style="cursor:pointer;"><input type="radio" name="dx-typo-copy" value="font-family" checked style="margin:0;"> Family</label>
            <label style="cursor:pointer;"><input type="radio" name="dx-typo-copy" value="font-size" style="margin:0;"> Size</label>
            <label style="cursor:pointer;"><input type="radio" name="dx-typo-copy" value="font-weight" style="margin:0;"> Weight</label>
            <label style="cursor:pointer;"><input type="radio" name="dx-typo-copy" value="line-height" style="margin:0;"> Line Height</label>
          </div>
        </div>

        <!-- Workspace: RAW -->
        <div id="dx-typo-view-raw" style="display:none;">
          <textarea id="dx-typo-json-input" rows="10" style="width:100%; background:#1e1e1e; color:#d4d4d4; border:1px solid #444; border-radius:3px; padding:8px; font-family:monospace; font-size:10px; resize:vertical; box-sizing: border-box;" placeholder="Paste typography JSON array here..."></textarea>
        </div>
      </div>

      <!-- Final Action to Elementor -->
      <button id="dx-typo-btn-update" class="elementor-button elementor-button-success" style="width:100%; justify-content:center; padding:8px; font-size:11px;">Apply Typography</button>
      <div id="dx-typo-status" style="margin-top:8px; font-size:10px; color:#a4afb7; display:none; text-align:center;"></div>
    `;

    targetElement.insertAdjacentElement("afterend", wrapper);
    this.bindEvents();
    this.fetchInitialData();
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

    // Copy AI Prompt
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
        .then(() =>
          this.showStatus("AI Prompt copied to clipboard!", "success"),
        )
        .catch(() => this.showStatus("Failed to copy prompt.", "error"));
    };

    // Refresh from API
    btnRefresh.onclick = async (e) => {
      e.preventDefault();
      const originalText = btnRefresh.innerText;
      btnRefresh.innerText = "⏳...";
      await this.fetchInitialData();
      btnRefresh.innerText = originalText;
      this.showStatus("Typography reloaded from database.", "success");
    };

    // Clear Workspace
    btnClear.onclick = (e) => {
      e.preventDefault();
      if (
        confirm(
          "Clear all custom typography? (You still need to click 'Apply' to save this deletion).",
        )
      ) {
        this.setWorkspaceTypography([]);
        this.showStatus("Workspace cleared.", "success");
      }
    };

    // Download Backup
    btnBackup.onclick = (e) => {
      e.preventDefault();
      const currentTypo = this.parseTypography() || this.originalTypography;
      if (!currentTypo || currentTypo.length === 0) {
        this.showStatus("No typography available to backup.", "error");
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

      const typo = this.parseTypography();
      if (typo) {
        this.processTypographyArray(typo);
        this.renderGrid();
      } else if (
        document.getElementById("dx-typo-json-input").value.trim() !== ""
      ) {
        document.getElementById("dx-typo-grid").innerHTML =
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
      let typo = this.parseTypography();

      if (!typo) {
        this.showStatus("Cannot apply: Invalid JSON.", "error");
        return;
      }

      // Ensure IDs are generated and formatted
      typo = this.processTypographyArray(typo);
      this.updateElementor(typo);
    };
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

    // Pass 1: Collect existing, valid IDs
    typography.forEach((t) => {
      if (t && t._id && t._id.trim() !== "") {
        usedIds.add(t._id.trim());
      }
    });

    // Pass 2: Generate missing IDs based on typography titles
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
      safeTypo.length > 0 ? JSON.stringify(safeTypo, null, 4) : "";
    this.renderGrid();
  }

  renderGrid() {
    const grid = document.getElementById("dx-typo-grid");
    if (!grid) return;
    grid.innerHTML = "";

    const typography = this.parseTypography();
    if (!Array.isArray(typography) || typography.length === 0) {
      grid.innerHTML =
        '<div style="color:#777; font-size:10px; padding:10px 0;">No typography found. Switch to RAW tab to paste JSON.</div>';
      return;
    }

    typography.forEach((t) => {
      if (!t || !t.title) return;

      const pill = document.createElement("div");
      pill.innerText = t.title;
      pill.style.cssText = `padding: 4px 10px; background: #333; border: 1px solid #555; border-radius: 12px; font-size: 11px; color: #fff; cursor: pointer; transition: background 0.2s, border-color 0.2s; user-select: none; white-space: nowrap;`;
      pill.title = `ID: ${t._id || "pending"}`;

      pill.onmouseenter = () => {
        pill.style.background = "#444";
        pill.style.borderColor = "#777";
      };
      pill.onmouseleave = () => {
        pill.style.background = "#333";
        pill.style.borderColor = "#555";
      };

      pill.onclick = () => {
        // Read which CSS property the user wants to copy
        const propSuffix = document.querySelector(
          'input[name="dx-typo-copy"]:checked',
        ).value;
        const fallbackId = t._id || "pending-save";
        const cssVar = `var(--e-global-typography-${fallbackId}-${propSuffix})`;

        navigator.clipboard
          .writeText(cssVar)
          .then(() => this.showStatus(`Copied: ${cssVar}`, "success"));
      };

      grid.appendChild(pill);
    });
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
        this.setWorkspaceTypography(typoData);
      }
    } catch (e) {
      this.showStatus("Failed to load typography data.", "error");
    }
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
        this.showStatus(
          "Typography Applied! Reloading Elementor...",
          "success",
        );
        setTimeout(() => window.location.reload(), 1500);
      } else {
        throw new Error("Server error");
      }
    } catch (e) {
      this.showStatus("Failed to apply typography.", "error");
      if (btn) {
        btn.innerText = "Apply Typography";
        btn.disabled = false;
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

document.addEventListener("DOMContentLoaded", () => {
  new ElementorDXTypographyImporter();
});
