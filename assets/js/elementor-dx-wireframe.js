class ElementorDXWireframe {
  constructor() {
    this.isActive = false;
    this.styleId = "dx-wireframe-styles";
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

    // If it already exists, just enable it
    if (doc.getElementById(this.styleId)) {
      doc.getElementById(this.styleId).disabled = false;
      return;
    }

    const styles = doc.createElement("style");
    styles.id = this.styleId;
    styles.innerHTML = `
      /* Strip backgrounds and shadows, add a faint outline for structure */
      *:not([id^="dx-"]):not([id^="dx-"] *) {
        background-color: transparent !important;
        background-image: none !important;
        box-shadow: none !important;
        outline: 1px solid rgba(150, 150, 150, 0.25) !important;
      }
      
      /* Ghost out media elements so they don't break the wireframe illusion */
      img:not([id^="dx-"]):not([id^="dx-"] *), 
      video:not([id^="dx-"]):not([id^="dx-"] *),
      iframe:not([id^="dx-"]):not([id^="dx-"] *) {
        opacity: 0.15 !important;
        filter: grayscale(100%) !important;
      }
    `;
    doc.head.appendChild(styles);
  }

  disable() {
    const doc = this.getTargetDocument();
    const styles = doc.getElementById(this.styleId);
    if (styles) {
      styles.disabled = true;
    }
  }
}

// Initialize and bind to window for global access
document.addEventListener("DOMContentLoaded", () => {
  window.dxWireframe = new ElementorDXWireframe();
});
