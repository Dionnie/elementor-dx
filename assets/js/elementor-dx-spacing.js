class ElementorDXSpacing {
  constructor() {
    this.spacingVars = [
      { scale: "1", px: "4", value: "var(--space-1)" },
      { scale: "2", px: "8", value: "var(--space-2)" },
      { scale: "3", px: "12", value: "var(--space-3)" },
      { scale: "4", px: "16", value: "var(--space-4)" },
      { scale: "6", px: "24", value: "var(--space-6)" },
      { scale: "8", px: "32", value: "var(--space-8)" },
      { scale: "10", px: "40", value: "var(--space-10)" },
      { scale: "12", px: "48", value: "var(--space-12)" },
      { scale: "16", px: "64", value: "var(--space-16)" },
      { scale: "24", px: "96", value: "var(--space-24)" },
      { scale: "32", px: "128", value: "var(--space-32)" },
    ];

    this.currentTargetInput = null;
    this.currentActiveUnit = null;
    this.host = null;
    this.shadow = null;
    this.menuElement = null;

    this.init();
  }

  init() {
    this.setupSpacingContextMenu();
  }

  setupSpacingContextMenu() {
    // 1. Create the Shadow Host anchored to body
    this.host = document.createElement("div");
    this.host.id = "dx-spacing-host";
    this.host.style.cssText =
      "position: fixed; z-index: 999999; top: 0; left: 0; width: 0; height: 0; overflow: visible;";
    document.body.appendChild(this.host);

    this.shadow = this.host.attachShadow({ mode: "open" });

    // 2. Inject Styles
    const styles = document.createElement("style");
    styles.innerHTML = `
      :host { all: initial; font-family: sans-serif; }
      * { box-sizing: border-box; }

      .dx-context-menu {
        position: absolute; /* Relative to the fixed 0,0 host */
        background: #2b2b2b; border: 1px solid #444; border-radius: 6px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); padding: 8px;
        display: flex; flex-direction: column; width: max-content;
        opacity: 0; visibility: hidden; transform: scale(0.95);
        transform-origin: top left; transition: opacity 0.1s ease, transform 0.1s ease, visibility 0.1s;
      }
      .dx-context-menu.is-active { opacity: 1; visibility: visible; transform: scale(1); }
      
      .dx-spacing-header {
        display: flex; align-items: center; gap: 6px; font-size: 10px;
        font-weight: bold; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px;
        padding-bottom: 6px; margin-bottom: 6px; border-bottom: 1px solid #444; pointer-events: none;
      }
      
      .dx-spacing-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
      
      .dx-menu-item {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        width: 44px; height: 44px; background: #222; border: 1px solid #444;
        border-radius: 4px; cursor: pointer; transition: all 0.2s; user-select: none;
      }
      
      .dx-menu-item:hover { background: #2A0624; border-color: #F2ADF3; transform: translateY(-1px); box-shadow: 0 3px 6px rgba(0,0,0,0.3); }
      .dx-menu-item:active { transform: scale(0.95); box-shadow: none; }
      
      .dx-top-text { font-size: 12px; font-weight: bold; color: #fff; pointer-events: none; line-height: 1; margin-bottom: 4px; transition: color 0.2s; }
      .dx-bottom-text { font-size: 9px; font-weight: bold; color: #888; pointer-events: none; line-height: 1; transition: color 0.2s; }
      
      .dx-menu-item:hover .dx-top-text, .dx-menu-item:hover .dx-bottom-text { color: #F2ADF3; }
      svg { display: block; }
    `;
    this.shadow.appendChild(styles);

    // 3. Build UI
    this.menuElement = document.createElement("div");
    this.menuElement.className = "dx-context-menu";

    const header = document.createElement("div");
    header.className = "dx-spacing-header";
    header.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
      </svg>
      Spacing Tokens
    `;
    this.menuElement.appendChild(header);

    const grid = document.createElement("div");
    grid.className = "dx-spacing-grid";

    this.spacingVars.forEach((v) => {
      const item = document.createElement("div");
      item.classList.add("dx-menu-item");
      item.dataset.val = v.value;
      item.title = `Apply ${v.px}px (Space ${v.scale})`;

      item.innerHTML = `
        <span class="dx-top-text">${v.px}</span>
        <span class="dx-bottom-text">Sp ${v.scale}</span>
      `;

      item.addEventListener("click", (e) => {
        const targetVal = e.currentTarget.dataset.val;
        const token = this.spacingVars.find((t) => t.value === targetVal);

        if (this.currentTargetInput && token) {
          let finalValue = token.value;

          if (this.currentActiveUnit === "px") {
            finalValue = token.px;
          } else if (
            this.currentActiveUnit === "rem" ||
            this.currentActiveUnit === "em"
          ) {
            finalValue = (parseInt(token.px, 10) / 16).toString();
          } else if (this.currentActiveUnit === "custom") {
            finalValue = token.value;
          }

          if (this.currentTargetInput.type === "number" && isNaN(finalValue)) {
            this.currentTargetInput.type = "text";
          }

          this.currentTargetInput.value = finalValue;
          this.currentTargetInput.dispatchEvent(
            new Event("input", { bubbles: true }),
          );
          this.currentTargetInput.dispatchEvent(
            new Event("change", { bubbles: true }),
          );
        }

        this.hideMenu();
      });

      grid.appendChild(item);
    });

    this.menuElement.appendChild(grid);
    this.shadow.appendChild(this.menuElement);

    // 4. Bind Global Right-Click Event
    document.addEventListener("contextmenu", (e) => {
      if (
        e.target.closest("#elementor-panel") &&
        e.target.matches("input[data-setting]")
      ) {
        const controlContainer = e.target.closest(".elementor-control");
        if (!controlContainer) return;

        const unitSwitcher =
          controlContainer.querySelector(".e-units-switcher");
        const legacyUnitRadio = controlContainer.querySelector(
          'input[data-setting="unit"]:checked',
        );

        let activeUnit = null;
        if (unitSwitcher) {
          activeUnit = unitSwitcher.dataset.selected;
        } else if (legacyUnitRadio) {
          activeUnit = legacyUnitRadio.value;
        }

        if (!activeUnit) return;

        const allowedUnits = ["px", "rem", "em", "custom"];
        if (!allowedUnits.includes(activeUnit)) return;

        e.preventDefault();
        this.currentTargetInput = e.target;
        this.currentActiveUnit = activeUnit;

        const menuWidth = 210;
        const menuHeight = 190;
        let xPos = e.clientX;
        let yPos = e.clientY;

        if (xPos + menuWidth > window.innerWidth)
          xPos = window.innerWidth - menuWidth - 10;
        if (yPos + menuHeight > window.innerHeight)
          yPos = window.innerHeight - menuHeight - 10;

        this.menuElement.style.top = `${yPos}px`;
        this.menuElement.style.left = `${xPos}px`;
        this.menuElement.classList.add("is-active");
      }
    });

    document.addEventListener("click", (e) => {
      // Ensure we don't accidentally close if clicking inside the shadow menu
      if (!e.composedPath().includes(this.menuElement)) {
        this.hideMenu();
      }
    });
  }

  hideMenu() {
    if (this.menuElement) this.menuElement.classList.remove("is-active");
    this.currentTargetInput = null;
    this.currentActiveUnit = null;
  }
}
