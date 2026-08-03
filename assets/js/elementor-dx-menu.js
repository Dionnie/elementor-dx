class ElementorDXGridMenu {
  constructor(config = {}) {
    this.items = config.items || [];
    this.isOpen = localStorage.getItem("dx_menu_open") === "true";
    this.wrapper = null;
    this.triggerBtn = null;
    this.titleScreen = null;
    this.toastTimer = null;

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    if (document.getElementById("dx-menu-window-wrapper")) return;
    this.injectStyles();
    this.injectDOM();
    this.bindEvents();

    if (this.isOpen) {
      this.open(false);
    }
  }

  injectStyles() {
    const styles = document.createElement("style");
    styles.id = "dx-menu-styles";
    styles.innerHTML = `
      .dx-master-trigger-btn {
        position: fixed; bottom: 30px; right: 30px; z-index: 99997;
        width: 56px; height: 56px; border-radius: 50%;
        background: #F2ADF3; /* Medium Pink */
        color: #2A0624; /* Dark Burgundy */
        border: none; cursor: pointer;
        box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        display: flex; align-items: center; justify-content: center;
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s, background 0.2s, color 0.2s;
        padding: 0; 
      }
      .dx-master-trigger-btn:hover { background: #620856; color: #F2ADF3; transform: scale(1.05); }
      .dx-master-trigger-btn.is-hidden { transform: scale(0); opacity: 0; pointer-events: none; }

      .dx-menu-min-btn { background: transparent; border: none; color: #aaa; padding: 6px; cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; margin-right: -4px; }
      .dx-menu-min-btn:hover { background: #333; color: #fff; }

      .dx-menu-header-screen {
        background: #1e1e1e;
        border: 1px solid #333; border-radius: 4px; padding: 6px 8px;
        text-align: center; font-size: 10px; color: #F2ADF3;
        font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;
        margin-bottom: 12px; transition: color 0.2s; min-height: 14px;
      }

      .dx-menu-grid-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }

      .dx-menu-grid-item {
        width: 100%; aspect-ratio: 1; border-radius: 6px;
        background: #1e1e1e; color: #a4afb7; border: 1px solid #444;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        padding: 0; transition: all 0.2s;
      }
      
      .dx-menu-grid-item:hover { 
        background: #2A0624; color: #F2ADF3; border-color: #620856; 
        transform: translateY(-2px); box-shadow: 0 4px 8px rgba(0,0,0,0.4); 
      }
      
      .dx-menu-grid-item.is-active-tool {
        background: #2A0624; color: #F2ADF3; border-color: #F2ADF3;
        box-shadow: inset 0 0 0 1px #F2ADF3, 0 4px 8px rgba(0,0,0,0.4);
      }

      .dx-master-trigger-btn svg { width: 24px !important; height: 24px !important; min-width: 24px !important; min-height: 24px !important; fill: none !important; stroke: currentColor !important; stroke-width: 2 !important; display: block !important; }
      .dx-menu-grid-item svg { width: 18px !important; height: 18px !important; min-width: 18px !important; min-height: 18px !important; fill: none !important; stroke: currentColor !important; stroke-width: 2 !important; display: block !important; }
    `;
    document.head.appendChild(styles);
  }

  injectDOM() {
    this.triggerBtn = document.createElement("button");
    this.triggerBtn.className = "dx-master-trigger-btn";
    this.triggerBtn.innerHTML = `<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
    document.body.appendChild(this.triggerBtn);

    this.wrapper = document.createElement("div");
    this.wrapper.id = "dx-menu-window-wrapper";
    this.wrapper.style.cssText = `
      position: fixed; bottom: 40px; right: 40px; width: 200px; background: #2b2b2b;
      border: 1px solid #444; border-radius: 6px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      z-index: 999999; font-family: sans-serif; display: none; flex-direction: column;
    `;

    this.wrapper.innerHTML = `
      <div id="dx-menu-drag-handle" style="cursor: grab; background: #1e1e1e; padding: 10px 12px; border-radius: 6px 6px 0 0; border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center;">
        <h4 style="margin:0; color:#fff; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; pointer-events: none;">DX TOOLS</h4>
        <div style="display:flex; gap:4px; align-items:center;">
          <button id="dx-menu-btn-minimize" class="dx-menu-min-btn"><svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
          <button id="dx-menu-btn-close" class="dx-menu-min-btn"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
      </div>
      <div id="dx-menu-body" style="padding: 12px;">
        <div id="dx-menu-title-screen" class="dx-menu-header-screen">SELECT A TOOL</div>
        <div id="dx-menu-grid" class="dx-menu-grid-container"></div>
      </div>
    `;

    document.body.appendChild(this.wrapper);
    this.titleScreen = document.getElementById("dx-menu-title-screen");
    const gridContainer = document.getElementById("dx-menu-grid");

    this.items.forEach((item) => {
      const btn = document.createElement("button");
      btn.className = "dx-menu-grid-item";
      btn.innerHTML = item.icon;

      btn.onmouseenter = () => {
        this.titleScreen.innerText = item.title;
        this.titleScreen.style.color = "#fff";
      };
      btn.onmouseleave = () => {
        this.titleScreen.innerText = "SELECT A TOOL";
        this.titleScreen.style.color = "#F2ADF3";
      };

      btn.onclick = (e) => {
        e.preventDefault();
        if (typeof item.action === "function") item.action();
      };

      gridContainer.appendChild(btn);
    });

    this.makeDraggable(
      this.wrapper,
      document.getElementById("dx-menu-drag-handle"),
    );

    setInterval(() => {
      this.items.forEach((item, index) => {
        const btn = gridContainer.children[index];
        if (item.getState && item.getState()) {
          btn.classList.add("is-active-tool");
        } else {
          btn.classList.remove("is-active-tool");
        }
      });
    }, 500);
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
      element.style.bottom = "auto";
    };
    const closeDragElement = () => {
      document.onmouseup = null;
      document.onmousemove = null;
      handle.style.cursor = "grab";
    };
  }

  bindEvents() {
    document.getElementById("dx-menu-btn-minimize").onclick = (e) => {
      e.preventDefault();
      const body = document.getElementById("dx-menu-body");
      body.style.display = body.style.display === "none" ? "block" : "none";
    };
    document.getElementById("dx-menu-btn-close").onclick = (e) => {
      e.preventDefault();
      this.close();
    };
    this.triggerBtn.onclick = (e) => {
      e.preventDefault();
      this.open();
    };
  }

  showToast(msg) {
    if (!this.titleScreen) return;
    this.titleScreen.innerText = msg;
    this.titleScreen.style.color = "#F2ADF3";
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.titleScreen.innerText = "SELECT A TOOL";
      this.titleScreen.style.color = "#F2ADF3";
    }, 1500);
  }

  open(animate = true) {
    this.isOpen = true;
    localStorage.setItem("dx_menu_open", "true");
    this.wrapper.style.display = "flex";
    this.triggerBtn.classList.add("is-hidden");
  }

  close() {
    this.isOpen = false;
    localStorage.setItem("dx_menu_open", "false");
    this.wrapper.style.display = "none";
    this.triggerBtn.classList.remove("is-hidden");
  }
}

// ----------------------------------------------------
// GLOBAL INITIALIZATION & REGISTRATION
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // 1. Safely initialize ALL standalone modules
  if (typeof ElementorDXColorImporter !== "undefined")
    window.dxColorImporter = new ElementorDXColorImporter();
  if (typeof ElementorDXTypographyImporter !== "undefined")
    window.dxTypographyImporter = new ElementorDXTypographyImporter();
  if (typeof ElementorDXGridOverlay !== "undefined")
    window.dxGridOverlay = new ElementorDXGridOverlay();
  if (typeof ElementorDXHierarchyLens !== "undefined")
    window.dxHierarchy = new ElementorDXHierarchyLens();
  if (typeof ElementorDXWireframe !== "undefined")
    window.dxWireframe = new ElementorDXWireframe();
  if (typeof ElementorDXClassFinder !== "undefined")
    window.dxClassFinder = new ElementorDXClassFinder();

  // 2. Initialize the Grid Menu
  window.dxGridMenu = new ElementorDXGridMenu({
    items: [
      {
        title: "Color Importer",
        icon: `<svg viewBox="0 0 24 24"><path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z"></path><path d="M12 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path><path d="M7 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path><path d="M17 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path><path d="M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path></svg>`,
        action: () => {
          if (window.dxColorImporter) window.dxColorImporter.open();
        },
        getState: () => {
          return window.dxColorImporter && window.dxColorImporter.isOpen;
        },
      },
      {
        title: "Typography Tools",
        icon: `<svg viewBox="0 0 24 24"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>`,
        action: () => {
          if (window.dxTypographyImporter) window.dxTypographyImporter.open();
        },
        getState: () => {
          return (
            window.dxTypographyImporter && window.dxTypographyImporter.isOpen
          );
        },
      },
      {
        title: "Toggle 8pt Grid",
        icon: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg>`,
        action: () => {
          if (window.dxGridOverlay) {
            window.dxGridOverlay.toggle();
            window.dxGridMenu.showToast(
              window.dxGridOverlay.getState()
                ? "GRID ENABLED"
                : "GRID DISABLED",
            );
          }
        },
        getState: () => {
          return window.dxGridOverlay && window.dxGridOverlay.getState();
        },
      },
      {
        title: "Hierarchy Lens",
        icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a10 10 0 0 0 0 20z" fill="currentColor"></path></svg>`,
        action: () => {
          if (window.dxHierarchy) {
            window.dxHierarchy.toggle();
            window.dxGridMenu.showToast(
              window.dxHierarchy.getState() ? "LENS ENABLED" : "LENS DISABLED",
            );
          }
        },
        getState: () => {
          return window.dxHierarchy && window.dxHierarchy.getState();
        },
      },
      {
        title: "Naked Wireframe",
        icon: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`,
        action: () => {
          if (window.dxWireframe) {
            window.dxWireframe.toggle();
            window.dxGridMenu.showToast(
              window.dxWireframe.getState()
                ? "WIREFRAME ENABLED"
                : "WIREFRAME DISABLED",
            );
          }
        },
        getState: () => {
          return window.dxWireframe && window.dxWireframe.getState();
        },
      },
      {
        title: "Class Finder",
        icon: `<svg viewBox="0 0 24 24"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><rect x="9" y="9" width="6" height="6"></rect></svg>`,
        action: () => {
          if (window.dxClassFinder) window.dxClassFinder.open();
        },
        getState: () => {
          // CHANGED: Now checks if the window is open, just like the Color & Typography tools
          return window.dxClassFinder && window.dxClassFinder.isOpen;
        },
      },
    ],
  });
});
