class ElementorDXRadialMenu {
  /**
   * @param {Object} config - Configuration object
   * @param {Array} config.items - Array of tool objects to display in the menu
   */
  constructor(config = {}) {
    this.items = config.items || [];
    this.isOpen = false;
    this.wrapper = null;
    this.mainBtn = null;

    // Stacking Configuration
    this.itemsPerLevel = 3; // How many buttons per arc before starting a new layer
    this.baseRadius = 75; // Distance of the first level from the center
    this.levelSpacing = 60; // Distance between each concentric level

    // Initialize when DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    // Prevent duplicate injections
    if (document.getElementById("dx-radial-menu-wrapper")) return;

    this.injectStyles();
    this.injectDOM();
    this.bindEvents();
  }

  injectStyles() {
    const styles = document.createElement("style");
    styles.id = "dx-radial-styles";
    styles.innerHTML = `
      .dx-radial-wrapper {
        position: fixed;
        bottom: 30px;
        right: 30px;
        z-index: 99998;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        font-family: sans-serif;
      }

      /* Main Floating Action Button */
      .dx-radial-main-btn {
        position: relative;
        z-index: 10;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: #39b54a; 
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.3s;
        padding: 0;
      }
      .dx-radial-main-btn:hover {
        transform: scale(1.05);
      }
      
      /* Active state rotates the plus into an X */
      .dx-radial-wrapper.is-open .dx-radial-main-btn {
        transform: rotate(135deg);
        background: #e74c3c; 
        box-shadow: 0 4px 15px rgba(231,76,60,0.4);
      }

      /* Child Radial Items */
      .dx-radial-item {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 44px;
        height: 44px;
        margin-top: -22px;
        margin-left: -22px;
        border-radius: 50%;
        background: #2b2b2b;
        color: #a4afb7;
        border: 1px solid #444;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        
        /* Start collapsed in the center */
        opacity: 0;
        transform: translate(0, 0) scale(0.5);
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        z-index: 1;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      }
      
      .dx-radial-item:hover {
        background: #444;
        color: #fff;
        border-color: #aaa;
        z-index: 5; /* Brings hovered item tooltip above outer levels */
      }

      /* THE FIX: PROTECT SVGS FROM THEME CSS */
      .dx-radial-main-btn svg {
        width: 24px !important; height: 24px !important;
        min-width: 24px !important; min-height: 24px !important;
        fill: none !important; stroke: currentColor !important;
        stroke-width: 2 !important; display: block !important;
      }

      .dx-radial-item svg {
        width: 18px !important; height: 18px !important;
        min-width: 18px !important; min-height: 18px !important;
        fill: none !important; stroke: currentColor !important;
        stroke-width: 2 !important; display: block !important;
      }

      /* Pure CSS Tooltips */
      .dx-radial-item::after {
        content: attr(data-title);
        position: absolute;
        right: 54px; 
        background: #1e1e1e;
        color: #fff;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s;
        border: 1px solid #444;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      }
      .dx-radial-item:hover::after {
        opacity: 1;
      }
    `;
    document.head.appendChild(styles);
  }

  injectDOM() {
    this.wrapper = document.createElement("div");
    this.wrapper.id = "dx-radial-menu-wrapper";
    this.wrapper.className = "dx-radial-wrapper";

    // Create Main Button
    this.mainBtn = document.createElement("button");
    this.mainBtn.className = "dx-radial-main-btn";
    this.mainBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    `;
    this.wrapper.appendChild(this.mainBtn);

    // Generate Child Items
    this.items.forEach((item, index) => {
      const btn = document.createElement("button");
      btn.className = "dx-radial-item";
      btn.dataset.title = item.title;
      btn.dataset.index = index;
      btn.innerHTML = item.icon;

      btn.onclick = (e) => {
        e.preventDefault();
        if (typeof item.action === "function") {
          item.action();
        }
        this.close();
      };

      this.wrapper.appendChild(btn);
    });

    document.body.appendChild(this.wrapper);
  }

  bindEvents() {
    this.mainBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.isOpen ? this.close() : this.open();
    };

    document.addEventListener("click", (e) => {
      if (this.isOpen && !this.wrapper.contains(e.target)) {
        this.close();
      }
    });
  }

  open() {
    this.isOpen = true;
    this.wrapper.classList.add("is-open");

    const itemElements = this.wrapper.querySelectorAll(".dx-radial-item");

    // Geometry for the quadrant (Top-Left from the button's perspective)
    const startAngle = 180; // Left
    const endAngle = 270; // Top
    const angleRange = endAngle - startAngle;

    itemElements.forEach((btn, index) => {
      // 1. Calculate which "Tier" or "Level" this button belongs to
      const level = Math.floor(index / this.itemsPerLevel);

      // 2. Calculate its position inside its specific level (0, 1, or 2)
      const indexInLevel = index % this.itemsPerLevel;

      // 3. Determine the radius (distance) for this level
      const radius = this.baseRadius + level * this.levelSpacing;

      // 4. Calculate the specific angle slots
      let angle;
      if (this.itemsPerLevel === 1) {
        angle = 225; // Dead center diagonal if only 1 item per level
      } else {
        // Distribute evenly between 180 and 270 based on fixed slots
        angle =
          startAngle + (angleRange / (this.itemsPerLevel - 1)) * indexInLevel;
      }

      // 5. Convert Polar to Cartesian coordinates
      const rad = angle * (Math.PI / 180);
      const x = Math.round(Math.cos(rad) * radius);
      const y = Math.round(Math.sin(rad) * radius);

      // Apply transform
      btn.style.transform = `translate(${x}px, ${y}px) scale(1)`;
      btn.style.opacity = "1";
    });
  }

  close() {
    this.isOpen = false;
    this.wrapper.classList.remove("is-open");

    const itemElements = this.wrapper.querySelectorAll(".dx-radial-item");
    itemElements.forEach((btn) => {
      btn.style.transform = `translate(0, 0) scale(0.5)`;
      btn.style.opacity = "0";
    });
  }
}
document.addEventListener("DOMContentLoaded", () => {
  // 1. Initialize your standalone modules (they wait silently in the background)
  window.dxColorImporter = new ElementorDXColorImporter();

  // (Future) window.dxTypographyManager = new ElementorDXTypographyManager();

  // 2. Initialize the Radial Menu and map the items to the modules
  window.dxRadialMenu = new ElementorDXRadialMenu({
    items: [
      {
        title: "Color Importer",
        // SVG Palette Icon
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z"></path><path d="M12 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path><path d="M7 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path><path d="M17 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path><path d="M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path></svg>`,
        action: () => {
          // Trigger the Color Importer's open method
          if (window.dxColorImporter) {
            window.dxColorImporter.open();
          }
        },
      },
      // Example of how easy it is to add your next tool:
      {
        title: "Typography Tools",
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>`,
        action: () => {
          if (window.dxTypographyImporter) {
            window.dxTypographyImporter.open();
          }
        },
      },

      {
        title: "Toggle 8pt Grid",
        // SVG Grid Icon
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>`,
        action: () => {
          if (window.dxGridOverlay) {
            window.dxGridOverlay.toggle();
          }
        },
      },
      {
        title: "Toggle Hierarchy Lens",
        // Contrast / Grayscale SVG Icon
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 0 0 20z" fill="currentColor"></path></svg>`,
        action: () => {
          if (window.dxHierarchy) {
            window.dxHierarchy.toggle();
          }
        },
      },

      {
        title: "Toggle Naked Wireframe",
        // Classic Web Layout Icon
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`,
        action: () => {
          if (window.dxWireframe) {
            window.dxWireframe.toggle();
          }
        },
      },

      {
        title: "X-Ray Class Inspector",
        // Viewfinder / Scanner SVG Icon
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><rect x="9" y="9" width="6" height="6"></rect></svg>`,
        action: () => {
          if (window.dxXRay) {
            window.dxXRay.open();
          }
        },
      },
    ],
  });
});
