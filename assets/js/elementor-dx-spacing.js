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
    this.currentActiveUnit = null; // Store the unit found during right-click
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
        z-index: 99999;
        background: #ffffff;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
        padding: 6px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 4px;
        width: max-content;
      }
      #dx-custom-context-menu.dx-hidden {
        display: none !important;
      }
      .dx-menu-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        background: transparent;
        border: 1px solid transparent;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.15s ease;
        user-select: none;
      }
      .dx-menu-item:hover {
        background: #f4f5f7;
        border-color: #d1d5da;
      }
      .dx-top-text {
        font-size: 12px;
        font-weight: 600;
        color: #24292e;
        pointer-events: none;
        line-height: 1;
        margin-bottom: 3px;
      }
      .dx-bottom-text {
        font-size: 9px;
        font-weight: 400;
        color: #6a737d;
        pointer-events: none;
        line-height: 1;
      }
    `;
    document.head.appendChild(style);
  }

  setupSpacingContextMenu() {
    const menu = document.createElement("div");
    menu.id = "dx-custom-context-menu";
    menu.classList.add("dx-hidden");

    this.spacingVars.forEach((v) => {
      const item = document.createElement("div");
      item.classList.add("dx-menu-item");
      item.dataset.val = v.value;

      item.title = `${v.px}px (Space ${v.scale})`;

      item.innerHTML = `
        <span class="dx-top-text">${v.px}px</span>
        <span class="dx-bottom-text">${v.scale}</span>
      `;

      item.addEventListener("click", (e) => {
        const targetVal = e.currentTarget.dataset.val;
        const token = this.spacingVars.find((t) => t.value === targetVal);

        if (this.currentTargetInput && token) {
          let finalValue = token.value; // Default to var

          // Apply value based on the unit we detected on right-click
          if (this.currentActiveUnit === "px") {
            finalValue = token.px;
          } else if (this.currentActiveUnit === "rem") {
            finalValue = (parseInt(token.px, 10) / 16).toString();
          } else if (this.currentActiveUnit === "custom") {
            finalValue = token.value;
          }

          // Switch input type to text if we are injecting a CSS variable string
          if (
            this.currentTargetInput.type === "number" &&
            this.currentActiveUnit === "custom"
          ) {
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

      menu.appendChild(item);
    });

    document.body.appendChild(menu);

    document.addEventListener("contextmenu", (e) => {
      if (
        e.target.closest("#elementor-panel") &&
        e.target.matches("input[data-setting]")
      ) {
        // 1. Find the parent control container
        const controlContainer = e.target.closest(".elementor-control");
        if (!controlContainer) return;

        // 2. Look for the active unit using Elementor's new switcher structure
        const unitSwitcher =
          controlContainer.querySelector(".e-units-switcher");
        let activeUnit = "custom"; // Assume custom if no switcher exists (e.g., standard text fields)

        if (unitSwitcher) {
          activeUnit = unitSwitcher.dataset.selected || "custom";
        } else {
          // Fallback for older Elementor DOM or different control types
          const checkedRadio = controlContainer.querySelector(
            'input[data-setting="unit"]:checked',
          );
          if (checkedRadio) activeUnit = checkedRadio.value;
        }

        // 3. Disable menu if the unit is not applicable
        const allowedUnits = ["px", "rem", "custom"];
        if (!allowedUnits.includes(activeUnit)) {
          return; // Do nothing. The native browser right-click menu will appear.
        }

        // 4. If applicable, prevent default and show our menu
        e.preventDefault();
        this.currentTargetInput = e.target;
        this.currentActiveUnit = activeUnit; // Save the unit for the click event

        const menuWidth = 180;
        const xPos =
          e.clientX + menuWidth > window.innerWidth
            ? window.innerWidth - menuWidth
            : e.clientX;

        menu.style.top = `${e.clientY}px`;
        menu.style.left = `${xPos}px`;
        menu.classList.remove("dx-hidden");
      }
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest("#dx-custom-context-menu")) {
        this.hideMenu(menu);
      }
    });
  }

  hideMenu(menuElement) {
    menuElement.classList.add("dx-hidden");
    this.currentTargetInput = null;
    this.currentActiveUnit = null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ElementorDXSpacing();
});
