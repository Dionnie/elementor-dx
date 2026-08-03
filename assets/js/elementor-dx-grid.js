class ElementorDXGridOverlay {
  constructor() {
    this.gridId = "dx-blueprint-grid";
    this.isActive = localStorage.getItem("dx_grid_active") === "true";

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        if (this.isActive) this.showGrid();
      });
    } else {
      if (this.isActive) this.showGrid();
    }
  }

  getState() {
    return this.isActive;
  }

  toggle() {
    this.isActive = !this.isActive;
    localStorage.setItem("dx_grid_active", this.isActive ? "true" : "false");
    if (this.isActive) {
      this.showGrid();
    } else {
      this.hideGrid();
    }
  }

  getTargetDocument() {
    const iframe = document.getElementById("elementor-preview-iframe");
    return iframe && iframe.contentDocument ? iframe.contentDocument : document;
  }

  showGrid() {
    const doc = this.getTargetDocument();
    if (doc.getElementById(this.gridId)) {
      doc
        .getElementById(this.gridId)
        .style.setProperty("display", "block", "important");
      return;
    }

    const grid = doc.createElement("div");
    grid.id = this.gridId;
    grid.style.cssText = `
      position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; pointer-events: none !important; z-index: 99901 !important; 
      background-image: linear-gradient(rgba(242, 173, 243, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(242, 173, 243, 0.1) 1px, transparent 1px), linear-gradient(rgba(242, 173, 243, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(242, 173, 243, 0.3) 1px, transparent 1px) !important;
      background-size: 8px 8px, 8px 8px, 64px 64px, 64px 64px !important; background-position: center top !important;
    `;
    doc.body.appendChild(grid);
  }

  hideGrid() {
    const doc = this.getTargetDocument();
    if (doc.getElementById(this.gridId))
      doc
        .getElementById(this.gridId)
        .style.setProperty("display", "none", "important");
  }
}
