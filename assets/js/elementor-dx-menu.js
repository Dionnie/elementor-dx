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
      /* Theme Immunity Reset */
      #dx-menu-window-wrapper, #dx-menu-window-wrapper *, .dx-master-trigger-btn, .dx-master-trigger-btn * {
        box-sizing: border-box !important; font-family: sans-serif !important; letter-spacing: normal !important; line-height: 1.5 !important;
      }
      #dx-menu-window-wrapper button, .dx-master-trigger-btn {
        appearance: none !important; -webkit-appearance: none !important; background: transparent !important; border: none !important; border-radius: 0 !important; padding: 0 !important; margin: 0 !important; box-shadow: none !important; outline: none !important; text-transform: none !important;
      }
      #dx-menu-window-wrapper button::before, #dx-menu-window-wrapper button::after, .dx-master-trigger-btn::before, .dx-master-trigger-btn::after { display: none !important; }

      /* Core Styles */
      .dx-master-trigger-btn {
        position: fixed !important; bottom: 30px !important; right: 30px !important; z-index: 99997 !important;
        width: 56px !important; height: 56px !important; border-radius: 50% !important;
        background: #F2ADF3 !important; color: #2A0624 !important;
        box-shadow: 0 4px 15px rgba(0,0,0,0.5) !important;
        display: flex !important; align-items: center !important; justify-content: center !important;
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s, background 0.2s, color 0.2s !important;
      }
      .dx-master-trigger-btn:hover { background: #620856 !important; color: #F2ADF3 !important; transform: scale(1.05) !important; }
      .dx-master-trigger-btn.is-hidden { transform: scale(0) !important; opacity: 0 !important; pointer-events: none !important; }

      .dx-menu-min-btn { color: #aaa !important; padding: 6px !important; cursor: pointer !important; border-radius: 4px !important; display: flex !important; align-items: center !important; justify-content: center !important; transition: all 0.2s !important; margin-right: -4px !important; }
      .dx-menu-min-btn:hover { background: #333 !important; color: #fff !important; }

      .dx-menu-header-screen {
        background: #1e1e1e !important; border: 1px solid #333 !important; border-radius: 4px !important; padding: 6px 8px !important;
        text-align: center !important; font-size: 10px !important; color: #F2ADF3 !important;
        font-weight: bold !important; text-transform: uppercase !important; letter-spacing: 0.5px !important;
        margin-bottom: 12px !important; transition: color 0.2s !important; min-height: 14px !important;
      }

      .dx-menu-grid-container { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; }

      .dx-menu-grid-item {
        width: 100% !important; aspect-ratio: 1 !important; border-radius: 6px !important;
        background: #1e1e1e !important; color: #a4afb7 !important; border: 1px solid #444 !important;
        cursor: pointer !important; display: flex !important; align-items: center !important; justify-content: center !important;
        transition: all 0.2s !important;
      }
      
      .dx-menu-grid-item:hover { 
        background: #2A0624 !important; color: #F2ADF3 !important; border-color: #620856 !important; 
        transform: translateY(-2px) !important; box-shadow: 0 4px 8px rgba(0,0,0,0.4) !important; 
      }
      
      .dx-menu-grid-item.is-active-tool {
        background: #2A0624 !important; color: #F2ADF3 !important; border-color: #F2ADF3 !important;
        box-shadow: inset 0 0 0 1px #F2ADF3, 0 4px 8px rgba(0,0,0,0.4) !important;
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
      position: fixed !important; bottom: 40px !important; right: 40px !important; width: 200px !important; background: #2b2b2b !important;
      border: 1px solid #444 !important; border-radius: 6px !important; box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
      z-index: 999999 !important; font-family: sans-serif !important; display: none !important; flex-direction: column !important;
    `;

    this.wrapper.innerHTML = `
      <div id="dx-menu-drag-handle" style="cursor: grab !important; background: #1e1e1e !important; padding: 10px 12px !important; border-radius: 6px 6px 0 0 !important; border-bottom: 1px solid #444 !important; display: flex !important; justify-content: space-between !important; align-items: center !important;">
        <h4 style="margin:0 !important; color:#fff !important; font-size:11px !important; text-transform:uppercase !important; letter-spacing:0.5px !important; pointer-events: none !important;">DX TOOLS</h4>
        <div style="display:flex !important; gap:4px !important; align-items:center !important;">
          <button id="dx-menu-btn-minimize" class="dx-menu-min-btn"><svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
          <button id="dx-menu-btn-close" class="dx-menu-min-btn"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
        </div>
      </div>
      <div id="dx-menu-body" style="padding: 12px !important;">
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
        this.titleScreen.style.setProperty("color", "#fff", "important");
      };
      btn.onmouseleave = () => {
        this.titleScreen.innerText = "SELECT A TOOL";
        this.titleScreen.style.setProperty("color", "#F2ADF3", "important");
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
      element.style.setProperty("bottom", "auto", "important");
    };
    const closeDragElement = () => {
      document.onmouseup = null;
      document.onmousemove = null;
      handle.style.setProperty("cursor", "grab", "important");
    };
  }

  bindEvents() {
    const btnMinimize = document.getElementById("dx-menu-btn-minimize");
    const btnClose = document.getElementById("dx-menu-btn-close");
    const bodyContent = document.getElementById("dx-menu-body");

    btnMinimize.onmousedown = (e) => e.stopPropagation();
    btnClose.onmousedown = (e) => e.stopPropagation();

    btnMinimize.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (bodyContent.style.display === "none") {
        bodyContent.style.setProperty("display", "block", "important");
        btnMinimize.innerHTML =
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
      } else {
        bodyContent.style.setProperty("display", "none", "important");
        btnMinimize.innerHTML =
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>';
      }
    };

    btnClose.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
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
    this.titleScreen.style.setProperty("color", "#F2ADF3", "important");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.titleScreen.innerText = "SELECT A TOOL";
      this.titleScreen.style.setProperty("color", "#F2ADF3", "important");
    }, 1500);
  }

  open(animate = true) {
    this.isOpen = true;
    localStorage.setItem("dx_menu_open", "true");
    this.wrapper.style.setProperty("display", "flex", "important");
    this.triggerBtn.classList.add("is-hidden");
  }

  close() {
    this.isOpen = false;
    localStorage.setItem("dx_menu_open", "false");
    this.wrapper.style.setProperty("display", "none", "important");
    this.triggerBtn.classList.remove("is-hidden");
  }
}

// ----------------------------------------------------
// GLOBAL INITIALIZATION & REGISTRATION
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
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
          return window.dxClassFinder && window.dxClassFinder.isOpen;
        },
      },
    ],
  });
});
