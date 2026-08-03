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
      doc.getElementById(this.gridId).style.display = "block";
      return;
    }

    const grid = doc.createElement("div");
    grid.id = this.gridId;
    grid.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 99901; 
      background-image: linear-gradient(rgba(242, 173, 243, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(242, 173, 243, 0.1) 1px, transparent 1px), linear-gradient(rgba(242, 173, 243, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(242, 173, 243, 0.3) 1px, transparent 1px);
      background-size: 8px 8px, 8px 8px, 64px 64px, 64px 64px; background-position: center top;
    `;
    doc.body.appendChild(grid);
  }

  hideGrid() {
    const doc = this.getTargetDocument();
    if (doc.getElementById(this.gridId))
      doc.getElementById(this.gridId).style.display = "none";
  }
}
