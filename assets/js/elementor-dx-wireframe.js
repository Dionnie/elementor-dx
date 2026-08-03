class ElementorDXWireframe {
  constructor() {
    this.styleId = "dx-wireframe-styles";
    this.isActive = localStorage.getItem("dx_wireframe_active") === "true";

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
      "dx_wireframe_active",
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
    if (doc.getElementById(this.styleId)) {
      doc.getElementById(this.styleId).disabled = false;
      return;
    }

    const styles = doc.createElement("style");
    styles.id = this.styleId;
    styles.innerHTML = `
      *:not([id^="dx-"]):not([id^="dx-"] *) { background-color: transparent !important; background-image: none !important; box-shadow: none !important; outline: 1px solid rgba(242, 173, 243, 0.25) !important; }
      img:not([id^="dx-"]):not([id^="dx-"] *), video:not([id^="dx-"]):not([id^="dx-"] *), iframe:not([id^="dx-"]):not([id^="dx-"] *) { opacity: 0.15 !important; filter: grayscale(100%) !important; }
    `;
    doc.head.appendChild(styles);
  }

  disable() {
    const doc = this.getTargetDocument();
    if (doc.getElementById(this.styleId))
      doc.getElementById(this.styleId).disabled = true;
  }
}
