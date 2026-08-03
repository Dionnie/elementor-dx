class ElementorDXEmRuler {
  constructor() {
    this.isActive = localStorage.getItem("dx_emruler_active") === "true";
    this.tooltip = null;
    this.host = null;
    this.shadow = null;
    this.targetDoc = null;
    this.currentMeasurement = null;
    this.retryCount = 0;

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleClick = this.handleClick.bind(this);

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
    localStorage.setItem("dx_emruler_active", this.isActive ? "true" : "false");

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
    this.targetDoc = this.getTargetDocument();

    if (!this.targetDoc || !this.targetDoc.body) {
      if (this.retryCount < 5) {
        this.retryCount++;
        setTimeout(() => {
          if (this.isActive) this.enable();
        }, 1000);
      }
      return;
    }

    this.retryCount = 0;
    this.injectTooltip();

    if (!this.targetDoc.getElementById("dx-emruler-overrides")) {
      const overrides = this.targetDoc.createElement("style");
      overrides.id = "dx-emruler-overrides";
      overrides.innerHTML = `
        .elementor-element-overlay { pointer-events: none !important; display: none !important; }
        *::selection { background: rgba(242, 173, 243, 0.4) !important; color: inherit !important; }
        * { cursor: crosshair !important; }
      `;
      this.targetDoc.head.appendChild(overrides);
    }

    this.targetDoc.addEventListener("mousemove", this.handleMouseMove);
    this.targetDoc.addEventListener("click", this.handleClick, true);
  }

  disable() {
    if (this.targetDoc) {
      this.targetDoc.removeEventListener("mousemove", this.handleMouseMove);
      this.targetDoc.removeEventListener("click", this.handleClick, true);
      const overrides = this.targetDoc.getElementById("dx-emruler-overrides");
      if (overrides) overrides.remove();
    }

    if (this.host) {
      this.host.remove();
      this.host = null;
      this.shadow = null;
      this.tooltip = null;
    }
    this.currentMeasurement = null;
    this.retryCount = 0;
  }

  injectTooltip() {
    if (this.targetDoc.getElementById("dx-emruler-host")) return;

    this.host = this.targetDoc.createElement("div");
    this.host.id = "dx-emruler-host";
    this.host.style.cssText =
      "position: fixed; z-index: 999999; top: 0; left: 0; width: 0; height: 0; overflow: visible; pointer-events: none;";
    this.targetDoc.body.appendChild(this.host);

    this.shadow = this.host.attachShadow({ mode: "open" });

    const styles = document.createElement("style");
    styles.innerHTML = `
      :host { all: initial; font-family: monospace; }
      * { box-sizing: border-box; }
      .dx-em-tooltip {
        position: fixed; top: -100px; left: -100px;
        background: #F2ADF3; color: #2A0624;
        padding: 4px 8px; border-radius: 4px;
        font-size: 13px; font-weight: bold;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        pointer-events: none; opacity: 0; 
        transition: opacity 0.1s ease;
        white-space: nowrap; z-index: 999999;
        display: flex; align-items: center;
      }
      .dx-em-tooltip.is-visible { opacity: 1; }
      .dx-em-tooltip.is-highlighting { background: #2A0624; color: #F2ADF3; border: 1px solid #F2ADF3; }
      .dx-em-tooltip span { font-size: 10px; opacity: 0.7; margin-left: 2px; text-transform: uppercase; }
      .dx-em-divider { margin: 0 6px; opacity: 0.3 !important; font-weight: normal; }
    `;
    this.shadow.appendChild(styles);

    this.tooltip = document.createElement("div");
    this.tooltip.className = "dx-em-tooltip";
    this.shadow.appendChild(this.tooltip);
  }

  handleMouseMove(e) {
    if (!this.tooltip || !this.targetDoc) return;

    // 1. HIGHLIGHT MODE
    const selection = this.targetDoc.getSelection();
    const selectedText = selection.toString();

    if (selection.rangeCount > 0 && selectedText.length > 0) {
      const charCount = selectedText.length;
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      let block = range.commonAncestorContainer;
      if (block.nodeType === Node.TEXT_NODE) block = block.parentElement;

      const fontSize =
        parseFloat(window.getComputedStyle(block).fontSize) || 16;
      const emWidth = (rect.width / fontSize).toFixed(1);

      this.currentMeasurement = emWidth;
      this.tooltip.innerHTML = `${emWidth}<span>em</span> <span class="dx-em-divider">|</span> ${charCount}<span>ch</span>`;
      this.tooltip.classList.add("is-visible", "is-highlighting");

      this.tooltip.style.left = e.clientX + 15 + "px";
      this.tooltip.style.top = e.clientY + 15 + "px";
      return;
    } else {
      this.tooltip.classList.remove("is-highlighting");
    }

    // 2. HOVER MODE
    let range;
    if (this.targetDoc.caretRangeFromPoint) {
      range = this.targetDoc.caretRangeFromPoint(e.clientX, e.clientY);
    } else if (this.targetDoc.caretPositionFromPoint) {
      const pos = this.targetDoc.caretPositionFromPoint(e.clientX, e.clientY);
      if (pos) {
        range = this.targetDoc.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.collapse(true);
      }
    }

    if (range && range.startContainer.nodeType === Node.TEXT_NODE) {
      let block = range.startContainer.parentElement;
      while (block && window.getComputedStyle(block).display === "inline") {
        block = block.parentElement;
      }
      if (!block) block = range.startContainer.parentElement;

      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(block);
      preCaretRange.setEnd(range.startContainer, range.startOffset);

      const charCount = preCaretRange.toString().length;
      const rect = preCaretRange.getBoundingClientRect();
      const fontSize =
        parseFloat(window.getComputedStyle(block).fontSize) || 16;
      const emWidth = (rect.width / fontSize).toFixed(1);

      if (charCount > 0) {
        this.currentMeasurement = emWidth;
        this.tooltip.innerHTML = `${emWidth}<span>em</span> <span class="dx-em-divider">|</span> ${charCount}<span>ch</span>`;
        this.tooltip.classList.add("is-visible");
        this.tooltip.style.left = e.clientX + 15 + "px";
        this.tooltip.style.top = e.clientY + 15 + "px";
        return;
      }
    }

    this.tooltip.classList.remove("is-visible");
    this.currentMeasurement = null;
  }

  handleClick(e) {
    if (this.isActive && this.currentMeasurement !== null) {
      e.preventDefault();
      e.stopPropagation();

      const textToCopy = this.currentMeasurement + "em";

      try {
        navigator.clipboard.writeText(textToCopy);
      } catch (err) {
        const tempInput = document.createElement("input");
        tempInput.value = textToCopy;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
      }

      this.tooltip.innerHTML = `Copied ${textToCopy}!`;
      this.targetDoc.getSelection().removeAllRanges();
    }
  }
}
