class ElementorDXHierarchyLens {
  constructor() {
    this.isActive = false;
    this.lensId = "dx-hierarchy-lens";
  }

  toggle() {
    this.isActive = !this.isActive;
    if (this.isActive) {
      this.enable();
    } else {
      this.disable();
    }
  }

  getTargetDocument() {
    const iframe = document.getElementById("elementor-preview-iframe");
    if (iframe && iframe.contentDocument) {
      return iframe.contentDocument;
    }
    return document;
  }

  enable() {
    const doc = this.getTargetDocument();

    // If it already exists, just unhide it
    if (doc.getElementById(this.lensId)) {
      doc.getElementById(this.lensId).style.display = "block";
      return;
    }

    // Inject the CSS filter overlay
    const lens = doc.createElement("div");
    lens.id = this.lensId;
    lens.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none; /* Crucial: lets you click elements under the filter */
      z-index: 999996; /* Sits just below the wireframe and grid overlays */
      backdrop-filter: grayscale(100%) contrast(115%);
      -webkit-backdrop-filter: grayscale(100%) contrast(115%);
    `;

    doc.body.appendChild(lens);
  }

  disable() {
    const doc = this.getTargetDocument();
    const lens = doc.getElementById(this.lensId);
    if (lens) {
      lens.style.display = "none";
    }
  }
}

// Initialize and bind to window for global access
document.addEventListener("DOMContentLoaded", () => {
  window.dxHierarchy = new ElementorDXHierarchyLens();
});
