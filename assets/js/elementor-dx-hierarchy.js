class ElementorDXHierarchyLens {
  constructor() {
    this.lensId = "dx-hierarchy-lens";
    this.isActive = localStorage.getItem("dx_hierarchy_active") === "true";

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        if (this.isActive) this.enable();
      });
    } else {
      if (this.isActive) this.enable();
    }
  }

  getState() {
    return this.isActive;
  }

  toggle() {
    this.isActive = !this.isActive;
    localStorage.setItem(
      "dx_hierarchy_active",
      this.isActive ? "true" : "false",
    );
    if (this.isActive) {
      this.enable();
    } else {
      this.disable();
    }
  }

  getTargetDocument() {
    const iframe = document.getElementById("elementor-preview-iframe");
    return iframe && iframe.contentDocument ? iframe.contentDocument : document;
  }

  enable() {
    const doc = this.getTargetDocument();
    if (doc.getElementById(this.lensId)) {
      doc
        .getElementById(this.lensId)
        .style.setProperty("display", "block", "important");
      return;
    }

    const lens = doc.createElement("div");
    lens.id = this.lensId;
    lens.style.cssText = `position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; pointer-events: none !important; z-index: 99900 !important; backdrop-filter: grayscale(100%) contrast(115%) !important; -webkit-backdrop-filter: grayscale(100%) contrast(115%) !important;`;
    doc.body.appendChild(lens);
  }

  disable() {
    const doc = this.getTargetDocument();
    if (doc.getElementById(this.lensId))
      doc
        .getElementById(this.lensId)
        .style.setProperty("display", "none", "important");
  }
}
