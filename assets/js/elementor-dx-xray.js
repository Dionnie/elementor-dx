class ElementorDXXRayVision {
  constructor() {
    this.isActive = false;
    this.styleId = "dx-xray-styles";
    this.scanTimer = null;
  }

  /**
   * SPECIAL TRIGGER FUNCTION
   * Call this to inject (if needed) and show the UI.
   */
  open() {
    const wrapper = document.getElementById("dx-xray-wrapper");
    if (!wrapper) {
      this.injectFloatingUI();
      this.bindEvents();
    } else {
      wrapper.style.display = "flex";
    }
  }

  /**
   * Hides the UI and disables the X-Ray styles
   */
  close() {
    const wrapper = document.getElementById("dx-xray-wrapper");
    if (wrapper) {
      wrapper.style.display = "none";
    }
    this.disable(); // Always turn off x-ray when closing the window
  }

  getTargetDocument() {
    const iframe = document.getElementById("elementor-preview-iframe");
    if (iframe && iframe.contentDocument) {
      return iframe.contentDocument;
    }
    return document;
  }

  injectFloatingUI() {
    if (document.getElementById("dx-xray-wrapper")) return;

    // Inject minimal scoped styles for the UI components
    const styles = document.createElement("style");
    styles.id = "dx-xray-ui-styles";
    styles.innerHTML = `
      .dx-xr-min-btn {
        background: transparent; border: none; color: #aaa; 
        padding: 6px; cursor: pointer; border-radius: 4px; 
        display: flex; align-items: center; justify-content: center;
        transition: all 0.2s; margin-right: -4px;
      }
      .dx-xr-min-btn:hover { background: #333; color: #fff; }
      
      .dx-xr-input {
        width: 100%; background: #121212; color: #00ffcc; 
        border: 1px solid #444; border-radius: 3px; 
        padding: 8px 10px; font-size: 11px; font-family: monospace; 
        box-sizing: border-box; outline: none; transition: border-color 0.2s;
      }
      .dx-xr-input:focus { border-color: #61ce70; }
    `;
    document.head.appendChild(styles);

    const wrapper = document.createElement("div");
    wrapper.id = "dx-xray-wrapper";
    wrapper.style.cssText = `
      position: fixed; top: 100px; left: 40px; width: 320px; background: #2b2b2b;
      border: 1px solid #444; border-radius: 6px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      z-index: 999999; font-family: sans-serif; display: flex; flex-direction: column;
    `;

    wrapper.innerHTML = `
      <!-- Draggable Header -->
      <div id="dx-xray-drag-handle" style="cursor: grab; background: #1e1e1e; padding: 10px 12px; border-radius: 6px 6px 0 0; border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center;">
        <h4 style="margin:0; color:#fff; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; pointer-events: none;">🔍 Class Inspector</h4>
        <div style="display:flex; gap:4px; align-items:center;">
          <button id="dx-xray-btn-minimize" class="dx-xr-min-btn" title="Toggle Panel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          <button id="dx-xray-btn-close" class="dx-xr-min-btn" title="Close Panel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <!-- Main Body Content -->
      <div id="dx-xray-body" style="padding: 12px;">
        
        <!-- Input Workspace -->
        <div style="background:#1e1e1e; padding:10px; border:1px solid #444; border-radius:4px; margin-bottom:12px;">
          <div style="color:#aaa; font-size: 10px; margin-bottom:6px; font-weight: bold; text-transform: uppercase;">Target Class Prefix:</div>
          <input type="text" id="dx-xray-input" class="dx-xr-input" placeholder="e.g. acme- or .hero-btn">
        </div>

        <!-- Action Button -->
        <button id="dx-xray-btn-toggle" style="width:100%; display:flex; align-items:center; justify-content:center; gap: 6px; padding:8px; font-size:11px; font-weight: bold; text-transform: uppercase; background:#39b54a; color:#fff; border:none; border-radius:3px; cursor:pointer; transition: 0.2s;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path></svg>
          Enable X-Ray
        </button>
        
        <!-- Status Indicator -->
        <div id="dx-xray-status" style="margin-top:8px; font-size:10px; color:#a4afb7; text-align:center; height:12px;"></div>
      </div>
    `;

    document.body.appendChild(wrapper);
    this.makeDraggable(wrapper, document.getElementById("dx-xray-drag-handle"));
  }

  makeDraggable(element, handle) {
    let pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0;

    handle.onmousedown = (e) => {
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      handle.style.cursor = "grabbing";
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    };

    const elementDrag = (e) => {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      element.style.top = element.offsetTop - pos2 + "px";
      element.style.left = element.offsetLeft - pos1 + "px";
      element.style.right = "auto";
    };

    const closeDragElement = () => {
      document.onmouseup = null;
      document.onmousemove = null;
      handle.style.cursor = "grab";
    };
  }

  bindEvents() {
    const btnMinimize = document.getElementById("dx-xray-btn-minimize");
    const btnClose = document.getElementById("dx-xray-btn-close");
    const bodyContent = document.getElementById("dx-xray-body");
    const btnToggle = document.getElementById("dx-xray-btn-toggle");
    const input = document.getElementById("dx-xray-input");

    // Prevent drag interference when clicking the minimize/close buttons
    btnMinimize.onmousedown = (e) => e.stopPropagation();
    btnClose.onmousedown = (e) => e.stopPropagation();

    // Close logic
    btnClose.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.close();
    };

    // Minimize logic
    btnMinimize.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (bodyContent.style.display === "none") {
        bodyContent.style.display = "block";
        btnMinimize.innerHTML =
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
      } else {
        bodyContent.style.display = "none";
        btnMinimize.innerHTML =
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>';
      }
    };

    // Main Toggle Action
    btnToggle.onclick = (e) => {
      e.preventDefault();
      this.isActive = !this.isActive;
      if (this.isActive) {
        btnToggle.style.background = "#e74c3c"; // Change to Red
        btnToggle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> Disable X-Ray`;
        this.scanAndHighlight();
      } else {
        btnToggle.style.background = "#39b54a"; // Back to Green
        btnToggle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path></svg> Enable X-Ray`;
        this.disable();
      }
    };

    // Real-time scan as you type (debounced)
    input.addEventListener("input", () => {
      if (!this.isActive) return;
      clearTimeout(this.scanTimer);
      this.scanTimer = setTimeout(() => this.scanAndHighlight(), 300);
    });
  }

  scanAndHighlight() {
    const doc = this.getTargetDocument();
    const rawInput = document
      .getElementById("dx-xray-input")
      .value.trim()
      .toLowerCase();

    // Remove dot if user types ".prefix-" instead of "prefix-"
    const prefix = rawInput.startsWith(".") ? rawInput.substring(1) : rawInput;

    this.clearHighlights(doc);

    if (!prefix) {
      this.showStatus("Please enter a class prefix.", "error");
      return;
    }

    const elements = doc.querySelectorAll("[class]");
    let matchCount = 0;

    elements.forEach((el) => {
      // Ignore our own plugin UI elements
      if (el.id && el.id.startsWith("dx-")) return;
      if (el.closest('[id^="dx-"]')) return;

      const classes = Array.from(el.classList);
      const matchedClasses = classes.filter((c) =>
        c.toLowerCase().startsWith(prefix),
      );

      if (matchedClasses.length > 0) {
        el.setAttribute("data-dx-xray-label", "." + matchedClasses.join(" ."));
        matchCount++;
      }
    });

    this.injectHighlightStyles(doc);

    if (matchCount > 0) {
      this.showStatus(`Found ${matchCount} matching elements`, "success");
    } else {
      this.showStatus("No matching classes found.", "error");
    }
  }

  injectHighlightStyles(doc) {
    if (doc.getElementById(this.styleId)) return;

    const styles = doc.createElement("style");
    styles.id = this.styleId;
    styles.innerHTML = `
      [data-dx-xray-label] {
        outline: 2px dashed #3498db !important;
        outline-offset: -2px;
        position: relative;
      }
      [data-dx-xray-label]::before {
        content: attr(data-dx-xray-label);
        position: absolute;
        top: 0;
        left: 0;
        background: #3498db;
        color: #fff;
        font-size: 11px;
        font-weight: bold;
        font-family: monospace;
        padding: 2px 6px;
        border-radius: 0 0 4px 0;
        z-index: 999995;
        pointer-events: none;
        white-space: nowrap;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      }
    `;
    doc.head.appendChild(styles);
  }

  clearHighlights(doc) {
    const highlighted = doc.querySelectorAll("[data-dx-xray-label]");
    highlighted.forEach((el) => el.removeAttribute("data-dx-xray-label"));
  }

  disable() {
    const doc = this.getTargetDocument();
    this.clearHighlights(doc);
    const styles = doc.getElementById(this.styleId);
    if (styles) styles.remove();
    this.showStatus("", "");
  }

  showStatus(msg, type) {
    const el = document.getElementById("dx-xray-status");
    if (!el) return;
    el.style.color = type === "error" ? "#ff7777" : "#61ce70";
    el.innerText = msg;
  }
}

// ----------------------------------------------------
// INITIALIZATION
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  window.dxXRay = new ElementorDXXRayVision();
});
