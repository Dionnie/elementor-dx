/**
 * ElementorDX - CSS Classes Pill UI (Two-Way Sync + Debounce Fix)
 * Features a toggleable Enhanced UI that perfectly sits below the Classic field,
 * syncing in real-time and properly triggering Elementor's save state.
 */
class ElementorDXCssClasses {
  constructor() {
    this.colors = [
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#ec4899",
      "#06b6d4",
    ];
    this.checkTimeout = null; // Used for debouncing the DOM observer
    this.init();
  }

  init() {
    this.setupObserver();
  }

  setupObserver() {
    const panel = document.getElementById("elementor-panel");
    if (!panel) return;

    // Initial check in case panel is already open
    setTimeout(() => this.checkForCssControls(), 150);

    const observer = new MutationObserver(() => {
      // THE FIX: Debounce the rendering.
      // This waits 150ms after the LAST DOM mutation before firing.
      // It ensures heavy widgets (like Containers) finish building completely.
      clearTimeout(this.checkTimeout);
      this.checkTimeout = setTimeout(() => this.checkForCssControls(), 150);
    });

    observer.observe(panel, { childList: true, subtree: true });
  }

  checkForCssControls() {
    // Catch core Elementor (_css_classes) and third-party widgets (css_classes)
    const cssControls = document.querySelectorAll(
      ".elementor-control-_css_classes, .elementor-control-css_classes",
    );
    cssControls.forEach((control) => this.injectPillsUI(control));
  }

  getColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
    return this.colors[hash % this.colors.length];
  }

  injectPillsUI(control) {
    // Prevent duplicate injections
    if (control.querySelector(".dx-css-toggle-btn")) return;

    const controlField = control.querySelector(".elementor-control-field");
    // Target both standard and non-standard input settings
    const originalInput = control.querySelector(
      'input[data-setting="_css_classes"], input[data-setting="css_classes"]',
    );
    const inputWrapper = control.querySelector(
      ".elementor-control-input-wrapper",
    );
    const label = control.querySelector(".elementor-control-title");

    if (!controlField || !originalInput || !inputWrapper || !label) return;

    const isEnhanced = localStorage.getItem("dx_css_mode_enhanced") === "true";

    // 1. Format the Native Input Row
    inputWrapper.style.display = "flex";
    inputWrapper.style.alignItems = "center";
    inputWrapper.style.gap = "8px";
    originalInput.style.flexGrow = "1";

    // 2. Create the Toggle Button
    const toggleBtn = document.createElement("i");
    toggleBtn.className = "eicon-exchange dx-css-toggle-btn";
    toggleBtn.title = "Toggle Enhanced Classes UI";
    toggleBtn.style.cssText = `
        cursor: pointer; font-size: 14px; 
        color: ${isEnhanced ? "#61ce70" : "#a4afb7"}; transition: 0.2s;
        flex-shrink: 0;
    `;

    toggleBtn.onmouseover = () => (toggleBtn.style.color = "#fff");
    toggleBtn.onmouseout = () =>
      (toggleBtn.style.color =
        localStorage.getItem("dx_css_mode_enhanced") === "true"
          ? "#61ce70"
          : "#a4afb7");

    inputWrapper.prepend(toggleBtn);

    // 3. Create the Enhanced Wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "dx-pills-wrapper";
    wrapper.style.cssText = `
        display: ${isEnhanced ? "flex" : "none"}; flex-wrap: wrap; gap: 5px; padding: 6px; 
        border: 1px solid #404145; border-radius: 3px; 
        align-items: center; cursor: text;
        margin-top: 10px; width: 100%; flex-basis: 100%;
    `;

    const pillsContainer = document.createElement("div");
    pillsContainer.style.cssText = "display: flex; flex-wrap: wrap; gap: 5px;";

    const adderInput = document.createElement("input");
    adderInput.type = "text";
    adderInput.placeholder = "Add class...";
    adderInput.style.cssText = `
        flex-grow: 1; background: transparent; border: none; 
        color: #a4afb7; outline: none; min-width: 80px; 
        font-size: 14px; padding: 2px 4px; font-family: monospace;
    `;

    wrapper.appendChild(pillsContainer);
    wrapper.appendChild(adderInput);

    controlField.style.flexWrap = "wrap";
    controlField.appendChild(wrapper);

    // 4. Central Syncing Engine
    let isSyncing = false;

    const sanitizeAndSync = (stringToClean) => {
      const rawArray = stringToClean
        .replace(/[,.]/g, " ")
        .split(/\s+/)
        .filter((c) => c !== "");
      const uniqueArray = [...new Set(rawArray)];
      const cleanString = uniqueArray.join(" ");

      if (originalInput.value !== cleanString) {
        isSyncing = true;
        originalInput.value = cleanString;

        originalInput.dispatchEvent(new Event("input", { bubbles: true }));
        originalInput.dispatchEvent(new Event("change", { bubbles: true }));

        if (typeof jQuery !== "undefined") {
          jQuery(originalInput).trigger("input");
        }

        isSyncing = false;
      }

      return uniqueArray;
    };

    // 5. Render Logic
    const renderPills = (forceSanitize = true, stringToProcess = null) => {
      pillsContainer.innerHTML = "";

      let classes = [];
      if (forceSanitize) {
        const sourceString =
          stringToProcess !== null ? stringToProcess : originalInput.value;
        classes = sanitizeAndSync(sourceString);
      } else {
        classes = [
          ...new Set(
            originalInput.value
              .replace(/[,.]/g, " ")
              .split(/\s+/)
              .filter((c) => c !== ""),
          ),
        ];
      }

      classes.forEach((cls) => {
        const pill = document.createElement("span");
        const baseColor = this.getColor(cls);

        pill.style.cssText = `
            display: inline-flex; align-items: center; 
            background: ${baseColor}; color: #fff; 
            padding: 3px 8px; border-radius: 12px; 
            font-size: 14px; font-weight: 500; font-family: monospace;
            transition: background 0.2s ease;
        `;

        const text = document.createElement("span");
        text.innerText = cls;

        const removeBtn = document.createElement("i");
        removeBtn.className = "eicon-close";
        removeBtn.style.cssText =
          "margin-left: 6px; cursor: pointer; font-size: 9px; opacity: 0.6; transition: all 0.2s ease;";

        removeBtn.onmouseover = () => {
          if (!removeBtn.dataset.armed) removeBtn.style.opacity = "1";
        };
        removeBtn.onmouseout = () => {
          if (!removeBtn.dataset.armed) removeBtn.style.opacity = "0.6";
        };

        let armTimer;

        removeBtn.onclick = (e) => {
          e.stopPropagation();
          if (!removeBtn.dataset.armed) {
            removeBtn.dataset.armed = "true";
            removeBtn.className = "eicon-trash";
            removeBtn.style.opacity = "1";
            pill.style.background = "#ef4444";

            armTimer = setTimeout(() => {
              delete removeBtn.dataset.armed;
              removeBtn.className = "eicon-close";
              removeBtn.style.opacity = "0.6";
              pill.style.background = baseColor;
            }, 2000);
          } else {
            clearTimeout(armTimer);
            const newClasses = classes.filter(
              (c) => c !== cls && c.trim() !== "",
            );
            renderPills(true, newClasses.join(" "));
          }
        };

        pill.appendChild(text);
        pill.appendChild(removeBtn);
        pillsContainer.appendChild(pill);
      });
    };

    // 6. Toggle Logic
    toggleBtn.addEventListener("click", () => {
      const currentlyEnhanced = wrapper.style.display === "flex";
      const newMode = !currentlyEnhanced;

      localStorage.setItem("dx_css_mode_enhanced", newMode);

      if (newMode) {
        wrapper.style.display = "flex";
        toggleBtn.style.color = "#61ce70";
        renderPills(true);
      } else {
        wrapper.style.display = "none";
        toggleBtn.style.color = "#a4afb7";
      }
    });

    if (isEnhanced) renderPills(true);

    // 7. Classic Field Events
    originalInput.addEventListener("input", () => {
      if (isSyncing) return;
      if (wrapper.style.display === "flex") renderPills(false);
    });

    originalInput.addEventListener("blur", () => {
      if (wrapper.style.display === "flex") {
        renderPills(true);
      } else {
        sanitizeAndSync(originalInput.value);
      }
    });

    // 8. Enhanced UI Events
    const processAdderInput = (val) => {
      if (val.trim()) {
        const combinedClasses = originalInput.value + " " + val;
        renderPills(true, combinedClasses);
      }
      adderInput.value = "";
    };

    adderInput.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        processAdderInput(adderInput.value);
      }
    });

    adderInput.addEventListener("paste", (e) => {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData("text");
      processAdderInput(paste);
    });

    adderInput.addEventListener("blur", () => {
      processAdderInput(adderInput.value);
    });

    wrapper.addEventListener("click", () => adderInput.focus());
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ElementorDXCssClasses();
});
