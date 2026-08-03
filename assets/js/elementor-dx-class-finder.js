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
      wrapper.style.display = "flex";
    }
  }

  close() {
    this.isOpen = false;
    localStorage.setItem("dx_classfinder_open", "false");
    const wrapper = document.getElementById("dx-classfinder-wrapper");
    if (wrapper) wrapper.style.display = "none";
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
      .dx-cf-min-btn { background: transparent; border: none; color: #aaa; padding: 6px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; margin-right: -4px; }
      .dx-cf-min-btn:hover { background: #333; color: #fff; }
      
      .dx-cf-input { width: 100%; background: #1e1e1e; color: #ddd; border: 1px solid #444; border-radius: 4px; padding: 10px 12px; font-size: 11px; font-family: monospace; box-sizing: border-box; outline: none; transition: border-color 0.2s; }
      .dx-cf-input:focus { border-color: #F2ADF3; }
      
      .dx-primary-btn { background: #F2ADF3; color: #2A0624; border: none; border-radius: 4px; padding: 10px; font-size: 11px; font-weight: bold; text-transform: uppercase; cursor: pointer; transition: 0.2s; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; letter-spacing: 0.5px; }
      .dx-primary-btn:hover { background: #620856; color: #F2ADF3; }
    `;
    document.head.appendChild(styles);

    const wrapper = document.createElement("div");
    wrapper.id = "dx-classfinder-wrapper";
    wrapper.style.cssText = `
      position: fixed; top: 100px; left: 40px; width: 340px; background: #2b2b2b;
      border: 1px solid #444; border-radius: 6px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      z-index: 999999; font-family: sans-serif; display: flex; flex-direction: column;
    `;

    wrapper.innerHTML = `
      <div id="dx-classfinder-drag-handle" style="cursor: grab; background: #1e1e1e; padding: 10px 12px; border-radius: 6px 6px 0 0; border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center;">
        <h4 style="margin:0; color:#fff; font-size:11px; text-transform:uppercase; font-weight:bold; letter-spacing:0.5px; pointer-events: none;">Class Finder</h4>
        <div style="display:flex; gap:4px; align-items:center;">
          <button id="dx-classfinder-btn-minimize" class="dx-cf-min-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
          <button id="dx-classfinder-btn-close" class="dx-cf-min-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
      </div>
      <div id="dx-classfinder-body" style="padding: 12px;">
        <div style="background:#1e1e1e; padding:10px; border:1px solid #444; border-radius:4px; margin-bottom:12px;">
          <div style="color:#aaa; font-size: 10px; margin-bottom:8px; font-weight: bold; text-transform: uppercase;">Target Class Prefix:</div>
          <input type="text" id="dx-classfinder-input" class="dx-cf-input" placeholder="e.g. acme- or .hero-btn" value="${this.savedPrefix}">
        </div>
        <button id="dx-classfinder-btn-toggle" class="dx-primary-btn" style="${this.isActive ? "background:#620856; color:#F2ADF3;" : ""}">
          ${
            this.isActive
              ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> Disable Class Finder`
              : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path></svg> Enable Class Finder`
          }
        </button>
        <div id="dx-classfinder-status" style="margin-top:8px; font-size:10px; font-weight:bold; color:#F2ADF3; text-align:center; height:12px;"></div>
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
      bodyContent.style.display =
        bodyContent.style.display === "none" ? "block" : "none";
    };

    btnToggle.onclick = (e) => {
      e.preventDefault();
      this.isActive = !this.isActive;
      localStorage.setItem(
        "dx_classfinder_active",
        this.isActive ? "true" : "false",
      );
      if (this.isActive) {
        btnToggle.style.background = "#620856";
        btnToggle.style.color = "#F2ADF3";
        btnToggle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg> Disable Class Finder`;
        this.scanAndHighlight();
      } else {
        btnToggle.style.background = "#F2ADF3";
        btnToggle.style.color = "#2A0624";
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
      [data-dx-classfinder-label] { outline: 2px dashed #F2ADF3 !important; outline-offset: -2px; position: relative; }
      [data-dx-classfinder-label]::before { content: attr(data-dx-classfinder-label); position: absolute; top: 0; left: 0; background: #F2ADF3; color: #2A0624; font-size: 11px; font-weight: bold; font-family: monospace; padding: 4px 8px; border-radius: 0 0 4px 0; z-index: 999995; pointer-events: none; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.5); }
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
    el.style.color = type === "error" ? "#e74c3c" : "#F2ADF3";
    el.innerText = msg;
  }
}
