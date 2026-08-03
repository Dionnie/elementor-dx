class ElementorDXClassFinder {
  constructor() {
    this.isActive = localStorage.getItem("dx_classfinder_active") === "true";
    this.savedPrefix = localStorage.getItem("dx_classfinder_prefix") || "";
    this.isOpen = localStorage.getItem("dx_classfinder_open") === "true";
    this.styleId = "dx-classfinder-styles";
    this.scanTimer = null;

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        if (this.isOpen) this.open();
        if (this.isActive && this.savedPrefix) this.scanAndHighlight();
      });
    } else {
      if (this.isOpen) this.open();
      if (this.isActive && this.savedPrefix) this.scanAndHighlight();
    }
  }

  getState() {
    return this.isActive;
  }

  open() {
    this.isOpen = true;
    localStorage.setItem("dx_classfinder_open", "true");
    const wrapper = document.getElementById("dx-classfinder-wrapper");
    if (!wrapper) {
      this.injectFloatingUI();
      this.bindEvents();
    } else {
      wrapper.style.setProperty("display", "flex", "important");
    }
  }

  close() {
    this.isOpen = false;
    localStorage.setItem("dx_classfinder_open", "false");
    const wrapper = document.getElementById("dx-classfinder-wrapper");
    if (wrapper) wrapper.style.setProperty("display", "none", "important");
    this.disable();
  }

  getTargetDocument() {
    const iframe = document.getElementById("elementor-preview-iframe");
    if (iframe && iframe.contentDocument) return iframe.contentDocument;
    return document;
  }

  injectFloatingUI() {
    if (document.getElementById("dx-classfinder-wrapper")) return;

    const styles = document.createElement("style");
    styles.id = "dx-classfinder-ui-styles";
    styles.innerHTML = `
      /* Theme Immunity Reset */
      #dx-classfinder-wrapper, #dx-classfinder-wrapper * { box-sizing: border-box !important; font-family: sans-serif !important; letter-spacing: normal !important; line-height: 1.5 !important; }
      #dx-classfinder-wrapper button, #dx-classfinder-wrapper input { appearance: none !important; -webkit-appearance: none !important; background: transparent !important; border: none !important; border-radius: 0 !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; outline: none !important; text-transform: none !important; }
      #dx-classfinder-wrapper button::before, #dx-classfinder-wrapper button::after { display: none !important; }

      .dx-cf-min-btn { cursor: pointer !important; color: #aaa !important; padding: 6px !important; border-radius: 4px !important; display: flex !important; align-items: center !important; justify-content: center !important; transition: all 0.2s !important; margin-right: -4px !important; }
      .dx-cf-min-btn:hover { background: #333 !important; color: #fff !important; }
      
      .dx-cf-input { width: 100% !important; background: #1e1e1e !important; color: #ddd !important; border: 1px solid #444 !important; border-radius: 4px !important; padding: 10px 12px !important; font-size: 11px !important; font-family: monospace !important; transition: border-color 0.2s !important; }
      .dx-cf-input:focus { border-color: #F2ADF3 !important; }
      
      .dx-primary-btn { background: #F2ADF3 !important; color: #2A0624 !important; border-radius: 4px !important; padding: 10px !important; font-size: 11px !important; font-weight: bold !important; text-transform: uppercase !important; cursor: pointer !important; transition: 0.2s !important; width: 100% !important; display: flex !important; align-items: center !important; justify-content: center !important; gap: 6px !important; letter-spacing: 0.5px !important; }
      .dx-primary-btn:hover { background: #620856 !important; color: #F2ADF3 !important; }
    `;
    document.head.appendChild(styles);

    const wrapper = document.createElement("div");
    wrapper.id = "dx-classfinder-wrapper";
    wrapper.style.cssText = `
      position: fixed !important; top: 100px !important; left: 40px !important; width: 340px !important; background: #2b2b2b !important;
      border: 1px solid #444 !important; border-radius: 6px !important; box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
      z-index: 999999 !important; font-family: sans-serif !important; display: flex !important; flex-direction: column !important;
    `;

    wrapper.innerHTML = `
      <div id="dx-classfinder-drag-handle" style="cursor: grab !important; background: #1e1e1e !important; padding: 10px 12px !important; border-radius: 6px 6px 0 0 !important; border-bottom: 1px solid #444 !important; display: flex !important; justify-content: space-between !important; align-items: center !important;">
        <h4 style="margin:0 !important; color:#fff !important; font-size:11px !important; text-transform:uppercase !important; font-weight:bold !important; letter-spacing:0.5px !important; pointer-events: none !important;">Class Finder</h4>
        <div style="display:flex !important; gap:4px !important; align-items:center !important;">
          <button id="dx-classfinder-btn-minimize" class="dx-cf-min-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
          <button id="dx-classfinder-btn-close" class="dx-cf-min-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
      </div>
      <div id="dx-classfinder-body" style="padding: 12px !important;">
        <div style="background:#1e1e1e !important; padding:10px !important; border:1px solid #444 !important; border-radius:4px !important; margin-bottom:12px !important;">
          <div style="color:#aaa !important; font-size: 10px !important; margin-bottom:8px !important; font-weight: bold !important; text-transform: uppercase !important;">Target Class Prefix:</div>
          <input type="text" id="dx-classfinder-input" class="dx-cf-input" placeholder="e.g. acme- or .hero-btn" value="${this.savedPrefix}">
        </div>
        <button id="dx-classfinder-btn-toggle" class="dx-primary-btn" style="${this.isActive ? "background:#620856 !important; color:#F2ADF3 !important;" : ""}">
          ${
            this.isActive
              ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> Disable Class Finder`
              : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path></svg> Enable Class Finder`
          }
        </button>
        <div id="dx-classfinder-status" style="margin-top:8px !important; font-size:10px !important; font-weight:bold !important; color:#F2ADF3 !important; text-align:center !important; height:12px !important;"></div>
      </div>
    `;

    document.body.appendChild(wrapper);
    this.makeDraggable(
      wrapper,
      document.getElementById("dx-classfinder-drag-handle"),
    );
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
      handle.style.setProperty("cursor", "grabbing", "important");
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    };
    const elementDrag = (e) => {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      element.style.setProperty(
        "top",
        element.offsetTop - pos2 + "px",
        "important",
      );
      element.style.setProperty(
        "left",
        element.offsetLeft - pos1 + "px",
        "important",
      );
      element.style.setProperty("right", "auto", "important");
    };
    const closeDragElement = () => {
      document.onmouseup = null;
      document.onmousemove = null;
      handle.style.setProperty("cursor", "grab", "important");
    };
  }

  bindEvents() {
    const btnMinimize = document.getElementById("dx-classfinder-btn-minimize");
    const btnClose = document.getElementById("dx-classfinder-btn-close");
    const bodyContent = document.getElementById("dx-classfinder-body");
    const btnToggle = document.getElementById("dx-classfinder-btn-toggle");
    const input = document.getElementById("dx-classfinder-input");

    btnClose.onclick = (e) => {
      e.preventDefault();
      this.close();
    };
    btnMinimize.onclick = (e) => {
      e.preventDefault();
      bodyContent.style.setProperty(
        "display",
        bodyContent.style.display === "none" ? "block" : "none",
        "important",
      );
    };

    btnToggle.onclick = (e) => {
      e.preventDefault();
      this.isActive = !this.isActive;
      localStorage.setItem(
        "dx_classfinder_active",
        this.isActive ? "true" : "false",
      );
      if (this.isActive) {
        btnToggle.style.setProperty("background", "#620856", "important");
        btnToggle.style.setProperty("color", "#F2ADF3", "important");
        btnToggle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> Disable Class Finder`;
        this.scanAndHighlight();
      } else {
        btnToggle.style.setProperty("background", "#F2ADF3", "important");
        btnToggle.style.setProperty("color", "#2A0624", "important");
        btnToggle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path></svg> Enable Class Finder`;
        this.disable();
      }
    };

    input.addEventListener("input", (e) => {
      const val = e.target.value;
      localStorage.setItem("dx_classfinder_prefix", val);
      if (!this.isActive) return;
      clearTimeout(this.scanTimer);
      this.scanTimer = setTimeout(() => this.scanAndHighlight(), 300);
    });
  }

  scanAndHighlight() {
    const doc = this.getTargetDocument();
    let rawInput = "";
    if (document.getElementById("dx-classfinder-input")) {
      rawInput = document
        .getElementById("dx-classfinder-input")
        .value.trim()
        .toLowerCase();
    } else {
      rawInput = this.savedPrefix;
    }
    const prefix = rawInput.startsWith(".") ? rawInput.substring(1) : rawInput;
    this.clearHighlights(doc);
    if (!prefix) {
      this.showStatus("Please enter a class prefix.", "error");
      return;
    }
    const elements = doc.querySelectorAll("[class]");
    let matchCount = 0;
    elements.forEach((el) => {
      if (el.id && el.id.startsWith("dx-")) return;
      if (el.closest('[id^="dx-"]')) return;
      const matchedClasses = Array.from(el.classList).filter((c) =>
        c.toLowerCase().startsWith(prefix),
      );
      if (matchedClasses.length > 0) {
        el.setAttribute(
          "data-dx-classfinder-label",
          "." + matchedClasses.join(" ."),
        );
        matchCount++;
      }
    });
    this.injectHighlightStyles(doc);
    if (matchCount > 0)
      this.showStatus(`Found ${matchCount} matching elements`, "success");
    else this.showStatus("No matching classes found.", "error");
  }

  injectHighlightStyles(doc) {
    if (doc.getElementById(this.styleId)) return;
    const styles = doc.createElement("style");
    styles.id = this.styleId;
    styles.innerHTML = `
      [data-dx-classfinder-label] { outline: 2px dashed #F2ADF3 !important; outline-offset: -2px !important; position: relative !important; }
      [data-dx-classfinder-label]::before { content: attr(data-dx-classfinder-label) !important; position: absolute !important; top: 0 !important; left: 0 !important; background: #F2ADF3 !important; color: #2A0624 !important; font-size: 11px !important; font-weight: bold !important; font-family: monospace !important; padding: 4px 8px !important; border-radius: 0 0 4px 0 !important; z-index: 999995 !important; pointer-events: none !important; white-space: nowrap !important; box-shadow: 0 2px 5px rgba(0,0,0,0.5) !important; }
    `;
    doc.head.appendChild(styles);
  }

  clearHighlights(doc) {
    const highlighted = doc.querySelectorAll("[data-dx-classfinder-label]");
    highlighted.forEach((el) =>
      el.removeAttribute("data-dx-classfinder-label"),
    );
  }

  disable() {
    this.isActive = false;
    localStorage.setItem("dx_classfinder_active", "false");
    const doc = this.getTargetDocument();
    this.clearHighlights(doc);
    if (doc.getElementById(this.styleId))
      doc.getElementById(this.styleId).remove();
    this.showStatus("", "");
  }

  showStatus(msg, type) {
    const el = document.getElementById("dx-classfinder-status");
    if (!el) return;
    el.style.setProperty(
      "color",
      type === "error" ? "#e74c3c" : "#F2ADF3",
      "important",
    );
    el.innerText = msg;
  }
}
