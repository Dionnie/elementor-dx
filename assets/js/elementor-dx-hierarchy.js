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
      doc.getElementById(this.lensId).style.display = "block";
      return;
    }

    const lens = doc.createElement("div");
    lens.id = this.lensId;
    lens.style.cssText = `position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 99900; backdrop-filter: grayscale(100%) contrast(115%); -webkit-backdrop-filter: grayscale(100%) contrast(115%);`;
    doc.body.appendChild(lens);
  }

  disable() {
    const doc = this.getTargetDocument();
    if (doc.getElementById(this.lensId))
      doc.getElementById(this.lensId).style.display = "none";
  }
}
