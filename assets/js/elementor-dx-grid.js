class ElementorDXGridOverlay {
  constructor() {
    this.isActive = false;
    this.gridId = "dx-blueprint-grid";
  }

  /**
   * Toggles the grid on and off.
   */
  toggle() {
    this.isActive = !this.isActive;
    if (this.isActive) {
      this.showGrid();
    } else {
      this.hideGrid();
    }
  }

  /**
   * Smart targeting: if inside the Elementor editor, it grabs the preview iframe.
   * If on the live frontend, it grabs the main document.
   */
  getTargetDocument() {
    const iframe = document.getElementById("elementor-preview-iframe");
    if (iframe && iframe.contentDocument) {
      return iframe.contentDocument;
    }
    return document;
  }

  showGrid() {
    const doc = this.getTargetDocument();

    // If it already exists, just unhide it
    if (doc.getElementById(this.gridId)) {
      doc.getElementById(this.gridId).style.display = "block";
      return;
    }

    // Inject the CSS and DOM element
    const grid = doc.createElement("div");
    grid.id = this.gridId;
    grid.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none; /* Crucial: lets you click elements under the grid */
      z-index: 999997; /* Sits just below your radial menu */
      background-image: 
        linear-gradient(rgba(52, 152, 219, 0.2) 1px, transparent 1px),
        linear-gradient(90deg, rgba(52, 152, 219, 0.2) 1px, transparent 1px),
        linear-gradient(rgba(52, 152, 219, 0.4) 1px, transparent 1px),
        linear-gradient(90deg, rgba(52, 152, 219, 0.4) 1px, transparent 1px);
      background-size: 8px 8px, 8px 8px, 64px 64px, 64px 64px;
      background-position: center top;
    `;

    doc.body.appendChild(grid);
  }

  hideGrid() {
    const doc = this.getTargetDocument();
    const grid = doc.getElementById(this.gridId);
    if (grid) {
      grid.style.display = "none";
    }
  }
}

// Initialize and bind to window for global access
document.addEventListener("DOMContentLoaded", () => {
  window.dxGridOverlay = new ElementorDXGridOverlay();
});
