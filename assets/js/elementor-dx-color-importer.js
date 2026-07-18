class ElementorDXColorImporter {
  constructor() {
    this.apiUrl = elementorDxSettings.root + "elementordx/v1/colors";
    this.nonce = elementorDxSettings.nonce;
    this.originalColors = null; // Stores the rollback state
    this.init();
  }

  init() {
    this.setupPanelObserver();
  }

  setupPanelObserver() {
    const panel = document.getElementById("elementor-panel");
    if (!panel) return;

    const observer = new MutationObserver(() => {
      // Find the exact Global Colors section header
      const targetSection = document.querySelector(
        ".elementor-control-section_global_colors",
      );
      if (targetSection) {
        this.injectImporterUI(targetSection);
      }
    });

    observer.observe(panel, { childList: true, subtree: true });
  }

  injectImporterUI(targetElement) {
    // Prevent multiple injections
    if (document.getElementById("dx-color-importer-wrapper")) return;

    // Create the UI wrapper
    const wrapper = document.createElement("div");
    wrapper.id = "dx-color-importer-wrapper";
    wrapper.style.cssText =
      "padding: 15px 20px; background: #333; border-top: 1px solid #444; border-bottom: 1px solid #444; margin-bottom: 15px;";

    wrapper.innerHTML = `
			<h4 style="margin: 0 0 10px 0; color: #fff; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">DX Bulk Color Manager</h4>
			<textarea id="dx-color-json-input" rows="8" style="width: 100%; background: #222; color: #d4d4d4; border: 1px solid #555; border-radius: 3px; padding: 10px; font-family: monospace; font-size: 11px; margin-bottom: 10px; resize: vertical;" placeholder="Loading current colors..."></textarea>
			<div style="display: flex; gap: 10px;">
				<button id="dx-btn-update" class="elementor-button elementor-button-success" style="flex: 1; justify-content: center;">Update Colors</button>
				<button id="dx-btn-rollback" class="elementor-button elementor-button-danger" style="flex: 1; justify-content: center;" disabled>Rollback</button>
			</div>
			<div id="dx-color-status" style="margin-top: 8px; font-size: 11px; color: #a4afb7; display: none;"></div>
		`;

    // Insert immediately after the Global Colors section heading
    targetElement.insertAdjacentElement("afterend", wrapper);

    this.bindEvents();
    this.fetchInitialColors();
  }

  bindEvents() {
    const updateBtn = document.getElementById("dx-btn-update");
    const rollbackBtn = document.getElementById("dx-btn-rollback");

    updateBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const textarea = document.getElementById("dx-color-json-input");
      try {
        const parsedData = JSON.parse(textarea.value);
        this.saveColors(parsedData, "Colors Updated Successfully!");
      } catch (err) {
        this.showStatus("Invalid JSON format.", "error");
      }
    });

    rollbackBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (!this.originalColors) return;

      if (
        confirm(
          "Are you sure you want to rollback to the colors loaded when you opened the editor?",
        )
      ) {
        document.getElementById("dx-color-json-input").value = JSON.stringify(
          this.originalColors,
          null,
          4,
        );
        this.saveColors(this.originalColors, "Rollback Successful!");
      }
    });
  }

  async fetchInitialColors() {
    try {
      const response = await fetch(this.apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": this.nonce,
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.originalColors = data; // Save state for rollback

        const textarea = document.getElementById("dx-color-json-input");
        if (textarea) {
          textarea.value = JSON.stringify(data, null, 4);
        }

        document.getElementById("dx-btn-rollback").disabled = false;
      }
    } catch (error) {
      console.error("DX Importer Error:", error);
      this.showStatus("Failed to load initial colors.", "error");
    }
  }

  async saveColors(payload, successMessage) {
    const updateBtn = document.getElementById("dx-btn-update");
    updateBtn.innerText = "Saving...";
    updateBtn.disabled = true;

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-WP-Nonce": this.nonce,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        this.showStatus(`${successMessage} Reloading editor...`, "success");
        // Elementor's UI won't magically redraw the repeater fields from a backend API call.
        // We must reload the editor to safely pull the new database values into the Backbone models.
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(result.message || "Server error");
      }
    } catch (error) {
      console.error("DX Save Error:", error);
      this.showStatus("Failed to save colors.", "error");
      updateBtn.innerText = "Update Colors";
      updateBtn.disabled = false;
    }
  }

  showStatus(message, type) {
    const statusEl = document.getElementById("dx-color-status");
    statusEl.style.display = "block";
    statusEl.style.color = type === "error" ? "#ff7777" : "#61ce70";
    statusEl.innerText = message;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ElementorDXColorImporter();
});
