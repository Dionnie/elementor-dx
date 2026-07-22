class ElementorDXTypographyImporter {
  constructor() {
    this.apiUrl = elementorDxSettings.root + "elementordx/v1/typography";
    this.nonce = elementorDxSettings.nonce;
    this.originalTypography = null;
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

      <!-- Workspace: RAW Only -->
      <div id="dx-typo-workspace" style="display:block; margin-bottom:12px;">
        <div style="font-size:10px; color:#aaa; margin-bottom:6px;">RAW JSON Data:</div>
        <textarea id="dx-typo-json-input" rows="12" style="width:100%; background:#1e1e1e; color:#d4d4d4; border:1px solid #444; border-radius:3px; padding:8px; font-family:monospace; font-size:10px; resize:vertical; box-sizing: border-box;" placeholder="Paste typography JSON array here..."></textarea>
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
    const btnUpdate = document.getElementById("dx-typo-btn-update");
    const btnBackup = document.getElementById("dx-typo-btn-backup");
    const btnRefresh = document.getElementById("dx-typo-btn-refresh");
    const btnClear = document.getElementById("dx-typo-btn-clear");
    const btnPrompt = document.getElementById("dx-typo-btn-prompt");

    // Copy AI Prompt
    btnPrompt.onclick = (e) => {
      e.preventDefault();
      const aiPrompt = `Generate a complete responsive typography token system.

Requirements:
- Output MUST be a flat JSON array of objects.
- Each object must have exactly 3 keys: "label", "css_var", and "value".
- Use clamp() for responsive font sizes on headings and text blocks where appropriate.
- Suffix clamp() sizes with "custom" if it is a raw CSS value.
- Font families must be wrapped in escaped quotes (e.g., "\\"Manrope\\"").
- Do NOT include comments.
- Do NOT include explanations.
- Do NOT include markdown formatting.
- Return ONLY a valid JSON array.

Output format example:
[
  {
    "label": "Primary (Font)",
    "css_var": "--e-global-typography-primary-font-family",
    "value": "\\"Manrope\\""
  },
  {
    "label": "Primary (Weight)",
    "css_var": "--e-global-typography-primary-font-weight",
    "value": "600"
  },
  {
    "label": "h1 (Size)",
    "css_var": "--e-global-typography-08aa2f6-font-size",
    "value": "clamp(2.4883rem, 1.8465rem + 3.2093vw, 4.7348rem)custom"
  },
  {
    "label": "h1 (Line Height)",
    "css_var": "--e-global-typography-08aa2f6-line-height",
    "value": "1.1custom"
  }
]

Please generate a full scale including Primary/Secondary fonts, h1 through h6 sizes and line-heights, base text, text-sm, text-button, and text-eyebrow.`;

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

    // APPLY TO ELEMENTOR BUTTON
    btnUpdate.onclick = (e) => {
      e.preventDefault();
      const typo = this.parseTypography();

      if (!typo) {
        this.showStatus("Cannot apply: Invalid JSON.", "error");
        return;
      }

      this.updateElementor(typo);
    };
  }

  parseTypography() {
    try {
      const raw = document.getElementById("dx-typo-json-input").value;
      if (!raw.trim()) return [];
      let data = JSON.parse(raw);

      // Auto-extract if wrapped in an object
      if (data && typeof data === "object" && !Array.isArray(data)) {
        if (data.custom_typography) data = data.custom_typography;
      }

      return Array.isArray(data) ? data : null;
    } catch (e) {
      return null;
    }
  }

  setWorkspaceTypography(typography) {
    const safeTypo = Array.isArray(typography) ? typography : [];
    document.getElementById("dx-typo-json-input").value =
      safeTypo.length > 0 ? JSON.stringify(safeTypo, null, 4) : "";
  }

  async fetchInitialData() {
    try {
      const res = await fetch(this.apiUrl, {
        method: "GET",
        headers: { "X-WP-Nonce": this.nonce },
      });
      if (res.ok) {
        const data = await res.json();
        // Assuming your API returns { custom_typography: [...] }
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
