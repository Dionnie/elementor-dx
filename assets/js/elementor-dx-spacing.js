class ElementorDXSpacing {
  constructor() {
    this.spacingVars = [
      { label: "Space 1 (4px)", shortLabel: "4", value: "var(--space-1)" },
      { label: "Space 2 (8px)", shortLabel: "8", value: "var(--space-2)" },
      { label: "Space 3 (12px)", shortLabel: "12", value: "var(--space-3)" },
      { label: "Space 4 (16px)", shortLabel: "16", value: "var(--space-4)" },
      { label: "Space 6 (24px)", shortLabel: "24", value: "var(--space-6)" },
      { label: "Space 8 (32px)", shortLabel: "32", value: "var(--space-8)" },
      { label: "Space 10 (40px)", shortLabel: "40", value: "var(--space-10)" },
      { label: "Space 12 (48px)", shortLabel: "48", value: "var(--space-12)" },
      { label: "Space 16 (64px)", shortLabel: "64", value: "var(--space-16)" },
      { label: "Space 24 (96px)", shortLabel: "96", value: "var(--space-24)" },
      {
        label: "Space 32 (128px)",
        shortLabel: "128",
        value: "var(--space-32)",
      },
    ];

    this.currentTargetInput = null;
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
        background: #fff;
        border: 1px solid #c2cbd2;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        padding: 8px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 2px;
        width: max-content;
      }
      #dx-custom-context-menu.dx-hidden {
        display: none !important;
      }
      .dx-menu-item {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 25px;
        height: 25px;
        background: #f4f6f7;
        border: 1px solid #d5dadf;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        color: #495157;
        cursor: pointer;
        transition: all 0.2s ease;
        user-select: none;
      }
      .dx-menu-item:hover {
        background: #e1e8ed;
        border-color: #a4afb7;
        color: #000;
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
      item.innerText = v.shortLabel;
      item.dataset.val = v.value;
      item.title = v.label;

      item.addEventListener("click", (e) => {
        if (this.currentTargetInput) {
          if (this.currentTargetInput.type === "number") {
            this.currentTargetInput.type = "text";
          }

          this.currentTargetInput.value = e.target.dataset.val;
          this.currentTargetInput.dispatchEvent(
            new Event("input", { bubbles: true }),
          );
          this.currentTargetInput.dispatchEvent(
            new Event("change", { bubbles: true }),
          );

          const controlContent = this.currentTargetInput.closest(
            ".elementor-control-content",
          );
          if (controlContent) {
            const customUnit = controlContent.querySelector(
              'label[data-choose="custom"], .elementor-units-choices label[data-choose="custom"]',
            );
            if (customUnit) customUnit.click();
          }
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
        e.preventDefault();
        this.currentTargetInput = e.target;

        const menuWidth = 140;
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
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ElementorDXSpacing();
});
