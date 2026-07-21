class ElementorDXGodMode {
  constructor() {
    this.apiUrl = elementorDxSettings.root + "elementordx/v1/kit";
    this.nonce = elementorDxSettings.nonce;
    this.flatTokens = [];
    this.originalTokenMap = new Map(); // NEW: Stores the baseline values for comparison
    this.init();
  }

  init() {
    this.injectUI();
    this.bindEvents();
    this.fetchKitData();
  }

  injectUI() {
    // Inject God Mode Toggle Button
    const toggleBtn = document.createElement("button");
    toggleBtn.id = "dx-godmode-toggle";
    toggleBtn.innerHTML = "⚡ God Mode";
    toggleBtn.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; z-index: 999999;
      background: #8e44ad; color: #fff; border: none; padding: 10px 15px;
      border-radius: 50px; font-family: monospace; font-size: 13px; font-weight: bold;
      cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.3); transition: 0.2s;
    `;
    document.body.appendChild(toggleBtn);

    // Inject God Mode Panel
    const panel = document.createElement("div");
    panel.id = "dx-godmode-panel";
    panel.style.cssText = `
      position: fixed; bottom: 70px; right: 20px; z-index: 999999;
      width: 400px; background: #1e1e1e; border: 1px solid #444; border-radius: 6px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5); display: none; flex-direction: column;
      font-family: sans-serif; overflow: hidden;
    `;

    panel.innerHTML = `
      <div style="background: #2b2b2b; padding: 10px 15px; border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #fff; font-size: 12px; font-weight: bold; letter-spacing: 1px;">⚙️ GOD MODE PRE-VIZ</span>
        <span id="dx-godmode-status" style="font-size: 10px; color: #61ce70;">Live</span>
      </div>
      <div style="padding: 10px;">
        <div style="font-size: 10px; color: #aaa; margin-bottom: 8px;">Edit raw values below. Changes instantly apply to CSS variables.</div>
        <textarea id="dx-godmode-json" spellcheck="false" style="
          width: 100%; height: 400px; background: #121212; color: #00ffcc; 
          border: 1px solid #333; border-radius: 4px; padding: 10px; 
          font-family: monospace; font-size: 11px; resize: vertical; line-height: 1.4; outline: none;
        "></textarea>
      </div>
    `;
    document.body.appendChild(panel);
  }

  bindEvents() {
    const toggleBtn = document.getElementById("dx-godmode-toggle");
    const panel = document.getElementById("dx-godmode-panel");
    const textarea = document.getElementById("dx-godmode-json");
    const status = document.getElementById("dx-godmode-status");

    // Toggle Panel
    toggleBtn.addEventListener("click", () => {
      const isHidden = panel.style.display === "none";
      panel.style.display = isHidden ? "flex" : "none";
      toggleBtn.style.background = isHidden ? "#c0392b" : "#8e44ad";
      toggleBtn.innerHTML = isHidden ? "&times; Close" : "⚡ God Mode";
    });

    // Real-Time Pre-Visualization Engine (Delta Check Updated)
    textarea.addEventListener("input", () => {
      try {
        const parsedTokens = JSON.parse(textarea.value);
        if (Array.isArray(parsedTokens)) {
          // Gather DOM targets (Root, Body, and the specific Elementor Kit wrapper)
          const targetNodes = [document.documentElement, document.body];
          const kitElement = document.querySelector(
            '[class*="elementor-kit-"]',
          );
          if (kitElement) targetNodes.push(kitElement);

          // Get iframe targets if active
          let iframeTargets = [];
          const iframe = document.getElementById("elementor-preview-iframe");
          if (iframe && iframe.contentDocument) {
            const iframeDoc = iframe.contentDocument;
            iframeTargets = [iframeDoc.documentElement, iframeDoc.body];
            const iframeKit = iframeDoc.querySelector(
              '[class*="elementor-kit-"]',
            );
            if (iframeKit) iframeTargets.push(iframeKit);
          }

          parsedTokens.forEach((token) => {
            if (token.css_var && token.value !== undefined) {
              const originalValue = this.originalTokenMap.get(token.css_var);

              // ONLY INJECT IF THE VALUE WAS CHANGED BY THE USER
              if (token.value !== originalValue) {
                targetNodes.forEach((node) =>
                  node.style.setProperty(
                    token.css_var,
                    token.value,
                    "important",
                  ),
                );
                iframeTargets.forEach((node) =>
                  node.style.setProperty(
                    token.css_var,
                    token.value,
                    "important",
                  ),
                );
              } else {
                // If it matches the original, safely remove our inline override to let native CSS take over
                targetNodes.forEach((node) =>
                  node.style.removeProperty(token.css_var),
                );
                iframeTargets.forEach((node) =>
                  node.style.removeProperty(token.css_var),
                );
              }
            }
          });

          status.innerText = "Live";
          status.style.color = "#61ce70";
        }
      } catch (e) {
        status.innerText = "Syntax Error";
        status.style.color = "#e74c3c";
      }
    });
  }

  async fetchKitData() {
    try {
      const res = await fetch(this.apiUrl, {
        method: "GET",
        headers: { "X-WP-Nonce": this.nonce },
      });
      if (res.ok) {
        const data = await res.json();
        this.flattenKitData(data);
      }
    } catch (e) {
      console.error("God Mode: Failed to load kit data.");
    }
  }

  flattenKitData(kit) {
    this.flatTokens = [];
    this.originalTokenMap.clear();

    // Process Colors
    const allColors = [
      ...(kit.system_colors || []),
      ...(kit.custom_colors || []),
    ];
    allColors.forEach((c) => {
      if (c._id && c.color) {
        this.flatTokens.push({
          label: c.title || "Color",
          css_var: `--e-global-color-${c._id}`,
          value: c.color,
        });
      }
    });

    // Process Typography
    const allTypo = [
      ...(kit.system_typography || []),
      ...(kit.custom_typography || []),
    ];
    allTypo.forEach((t) => {
      if (!t._id) return;
      const prefix = `--e-global-typography-${t._id}`;
      const label = t.title || "Typography";

      if (t.typography_font_family) {
        this.flatTokens.push({
          label: `${label} (Font)`,
          css_var: `${prefix}-font-family`,
          value: `"${t.typography_font_family}"`,
        });
      }
      if (t.typography_font_weight) {
        this.flatTokens.push({
          label: `${label} (Weight)`,
          css_var: `${prefix}-font-weight`,
          value: t.typography_font_weight,
        });
      }
      if (t.typography_font_size && t.typography_font_size.size) {
        const unit = t.typography_font_size.unit || "px";
        this.flatTokens.push({
          label: `${label} (Size)`,
          css_var: `${prefix}-font-size`,
          value: `${t.typography_font_size.size}${unit}`,
        });
      }
      if (t.typography_line_height && t.typography_line_height.size) {
        const unit = t.typography_line_height.unit || "em";
        this.flatTokens.push({
          label: `${label} (Line Height)`,
          css_var: `${prefix}-line-height`,
          value: `${t.typography_line_height.size}${unit}`,
        });
      }
    });

    // Map the baseline values so we know exactly what is untouched
    this.flatTokens.forEach((t) => {
      this.originalTokenMap.set(t.css_var, t.value);
    });

    const textarea = document.getElementById("dx-godmode-json");
    if (textarea) {
      textarea.value = JSON.stringify(this.flatTokens, null, 2);
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ElementorDXGodMode();
});
