class ElementorDXActionToolbar {
  constructor() {
    this.panels = [
      {
        id: "color",
        wrapperId: "dx-color-importer-wrapper",
        icon: "🎨",
        title: "Colors",
      },
      {
        id: "typo",
        wrapperId: "dx-typo-importer-wrapper",
        icon: "🅰️",
        title: "Typography",
      },
      {
        id: "godmode",
        wrapperId: "dx-godmode-wrapper",
        icon: "⚡",
        title: "God Mode",
      },
    ];
    this.init();
  }

  init() {
    this.injectStyles();
    this.setupTopBarObserver();
    this.hijackPanelBehaviors();
  }

  injectStyles() {
    if (document.getElementById("dx-action-toolbar-styles")) return;

    const style = document.createElement("style");
    style.id = "dx-action-toolbar-styles";
    style.textContent = `
      /* DX Toolbar Button Group */
      .dx-topbar-group {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-left: 12px;
        padding-left: 12px;
        border-left: 1px solid rgba(255, 255, 255, 0.1);
        height: 32px;
      }
      .dx-topbar-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: 1px solid transparent;
        color: #a4afb7;
        font-size: 14px;
        width: 32px;
        height: 32px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .dx-topbar-btn:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.1);
      }
      .dx-topbar-btn.dx-active {
        background: rgba(97, 206, 112, 0.1);
        border-color: #61ce70;
        color: #fff;
      }

      /* Override Individual Floating Panels to Snap as Dropdowns */
      #dx-color-importer-wrapper,
      #dx-typo-importer-wrapper,
      #dx-godmode-wrapper {
        top: 55px !important; /* Force snap right below Elementor top bar */
        left: 60px !important; /* Align to the left side where the toolbar is */
        right: auto !important;
        bottom: auto !important;
        box-shadow: 0 10px 40px rgba(0,0,0,0.6) !important;
        transition: opacity 0.2s, transform 0.2s !important;
        transform-origin: top left !important;
      }

      /* Hide the drag handles since they are now docked */
      #dx-drag-handle,
      #dx-typo-drag-handle,
      #dx-gm-drag-handle {
        cursor: default !important;
      }
      
      /* Hide the original God Mode toggle button */
      #dx-godmode-toggle {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  setupTopBarObserver() {
    // We observe the body to wait for Elementor's v2 Top Bar to mount
    const observer = new MutationObserver(() => {
      // Targeting the left-side MuiGrid container in Elementor's header
      const topBarLeftGrid = document.querySelector(
        "header.MuiAppBar-root .MuiToolbar-root > .MuiBox-root > .MuiGrid-container:first-child",
      );

      if (topBarLeftGrid && !document.getElementById("dx-action-toolbar")) {
        this.injectToolbar(topBarLeftGrid);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  injectToolbar(targetContainer) {
    const toolbar = document.createElement("div");
    toolbar.id = "dx-action-toolbar";
    toolbar.className = "dx-topbar-group";

    this.panels.forEach((panel) => {
      const btn = document.createElement("button");
      btn.className = "dx-topbar-btn";
      btn.title = `Toggle ${panel.title}`;
      btn.innerHTML = panel.icon;
      btn.dataset.target = panel.id;

      btn.addEventListener("click", () => this.togglePanel(panel.id));
      toolbar.appendChild(btn);
    });

    // Append our DX Studio toolbar to the end of Elementor's left-side stack
    targetContainer.appendChild(toolbar);
  }

  togglePanel(targetId) {
    const buttons = document.querySelectorAll(".dx-topbar-btn");
    let isClosing = false;

    this.panels.forEach((panel) => {
      const wrapper = document.getElementById(panel.wrapperId);
      const btn = document.querySelector(
        `.dx-topbar-btn[data-target="${panel.id}"]`,
      );

      if (!wrapper) return;

      if (panel.id === targetId) {
        // If clicking the currently active panel, close it
        if (
          wrapper.style.display === "flex" ||
          wrapper.style.display === "block" ||
          btn.classList.contains("dx-active")
        ) {
          wrapper.style.display = "none";
          btn.classList.remove("dx-active");
          isClosing = true;
        } else {
          // Open target panel
          wrapper.style.display =
            panel.wrapperId === "dx-godmode-wrapper" ? "flex" : "block";

          // Force internal bodies to be visible (overriding the minimize logic)
          const internalBody = wrapper.querySelector('div[id$="-body"]');
          if (internalBody) internalBody.style.display = "block";

          btn.classList.add("dx-active");
        }
      } else {
        // Hide all other panels
        wrapper.style.display = "none";
        if (btn) btn.classList.remove("dx-active");
      }
    });
  }

  hijackPanelBehaviors() {
    // Continuously check and force-hide the panels initially until toggled by the toolbar
    const hideInterval = setInterval(() => {
      let allFound = true;

      this.panels.forEach((panel) => {
        const wrapper = document.getElementById(panel.wrapperId);
        if (wrapper) {
          // Only hide on initial load if the toolbar hasn't marked it active
          const btn = document.querySelector(
            `.dx-topbar-btn[data-target="${panel.id}"]`,
          );
          if (!btn || !btn.classList.contains("dx-active")) {
            wrapper.style.display = "none";
          }
        } else {
          allFound = false;
        }
      });

      // Clear interval once all modules have injected their wrappers
      if (allFound) clearInterval(hideInterval);
    }, 500);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ElementorDXActionToolbar();
});
