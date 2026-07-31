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
    this.init();
  }

  init() {
    this.injectStyles();
    this.setupSpacingContextMenu();
  }

  injectStyles() {
    if (document.getElementById("dx-spacing-styles")) return;

    const style = document.createElement("style");
    style.id = "dx-spacing-styles";
    style.textContent = `
      #dx-custom-context-menu {
        position: fixed;
        z-index: 999999;
        background: #2b2b2b;
        border: 1px solid #444;
        border-radius: 6px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        padding: 8px;
        display: flex;
        flex-direction: column;
        width: max-content;
        font-family: sans-serif;
        opacity: 0;
        visibility: hidden;
        transform: scale(0.95);
        transform-origin: top left;
        transition: opacity 0.1s ease, transform 0.1s ease, visibility 0.1s;
      }
      #dx-custom-context-menu.dx-active {
        opacity: 1;
        visibility: visible;
        transform: scale(1);
      }
      .dx-spacing-header {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 10px;
        font-weight: bold;
        color: #aaa;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding-bottom: 6px;
        margin-bottom: 6px;
        border-bottom: 1px solid #444;
        pointer-events: none;
      }
      .dx-spacing-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 4px;
      }
      .dx-menu-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        background: #222;
        border: 1px solid #444;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
        user-select: none;
      }
      .dx-menu-item:hover {
        background: #333;
        border-color: #aaa;
        transform: translateY(-1px);
        box-shadow: 0 3px 6px rgba(0,0,0,0.3);
      }
      .dx-top-text {
        font-size: 12px;
        font-weight: 600;
        color: #fff;
        pointer-events: none;
        line-height: 1;
        margin-bottom: 4px;
      }
      .dx-bottom-text {
        font-size: 9px;
        font-weight: 500;
        color: #888;
        pointer-events: none;
        line-height: 1;
      }
    `;
    document.head.appendChild(style);
  }

  setupSpacingContextMenu() {
    const menu = document.createElement("div");
    menu.id = "dx-custom-context-menu";

    // Header
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
    menu.appendChild(header);

    // Grid Container
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

          // Apply value based strictly on the active unit
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

          // Switch input type to text if we are injecting a CSS variable string
          if (this.currentTargetInput.type === "number" && isNaN(finalValue)) {
            this.currentTargetInput.type = "text";
          }

          // Inject the value and trigger Elementor's save events
          this.currentTargetInput.value = finalValue;
          this.currentTargetInput.dispatchEvent(
            new Event("input", { bubbles: true }),
          );
          this.currentTargetInput.dispatchEvent(
            new Event("change", { bubbles: true }),
          );
        }

        this.hideMenu(menu);
      });

      grid.appendChild(item);
    });

    menu.appendChild(grid);
    document.body.appendChild(menu);

    document.addEventListener("contextmenu", (e) => {
      if (
        e.target.closest("#elementor-panel") &&
        e.target.matches("input[data-setting]")
      ) {
        // 1. Find the parent control container
        const controlContainer = e.target.closest(".elementor-control");
        if (!controlContainer) return;

        // 2. Look for the active unit using Elementor's switcher structure
        const unitSwitcher =
          controlContainer.querySelector(".e-units-switcher");
        const legacyUnitRadio = controlContainer.querySelector(
          'input[data-setting="unit"]:checked',
        );

        let activeUnit = null; // Default to null to prevent popping up on z-index, opacity, etc.

        if (unitSwitcher) {
          activeUnit = unitSwitcher.dataset.selected;
        } else if (legacyUnitRadio) {
          activeUnit = legacyUnitRadio.value;
        }

        // 3. If there is no unit switcher UI at all, abort entirely.
        if (!activeUnit) return;

        // 4. Validate against spacing-compatible units.
        const allowedUnits = ["px", "rem", "em", "custom"];
        if (!allowedUnits.includes(activeUnit)) {
          return;
        }

        // 5. Conditions met: prevent default menu and show ours
        e.preventDefault();
        this.currentTargetInput = e.target;
        this.currentActiveUnit = activeUnit;

        // Boundary collision detection to prevent menu from clipping off-screen
        const menuWidth = 200;
        const menuHeight = 180;

        let xPos = e.clientX;
        let yPos = e.clientY;

        if (xPos + menuWidth > window.innerWidth) {
          xPos = window.innerWidth - menuWidth - 10;
        }
        if (yPos + menuHeight > window.innerHeight) {
          yPos = window.innerHeight - menuHeight - 10;
        }

        menu.style.top = `${yPos}px`;
        menu.style.left = `${xPos}px`;
        menu.classList.add("dx-active");
      }
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest("#dx-custom-context-menu")) {
        this.hideMenu(menu);
      }
    });
  }

  hideMenu(menuElement) {
    menuElement.classList.remove("dx-active");
    this.currentTargetInput = null;
    this.currentActiveUnit = null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ElementorDXSpacing();
});
