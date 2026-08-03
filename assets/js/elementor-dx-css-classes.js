class ElementorDXCssClasses {
  constructor() {
    this.checkTimeout = null;
    this.init();
  }

  init() {
    this.setupObserver();
  }

  setupObserver() {
    const panel = document.getElementById("elementor-panel");
    if (!panel) return;

    setTimeout(() => this.checkForCssControls(), 150);

    const observer = new MutationObserver(() => {
      clearTimeout(this.checkTimeout);
      this.checkTimeout = setTimeout(() => this.checkForCssControls(), 150);
    });

    observer.observe(panel, { childList: true, subtree: true });
  }

  checkForCssControls() {
    const cssControls = document.querySelectorAll(
      ".elementor-control-_css_classes, .elementor-control-css_classes",
    );
    cssControls.forEach((control) => this.injectPillsUI(control));
  }

  injectPillsUI(control) {
    if (control.querySelector(".dx-css-toggle-btn")) return;

    const controlField = control.querySelector(".elementor-control-field");
    const originalInput = control.querySelector(
      'input[data-setting="_css_classes"], input[data-setting="css_classes"]',
    );
    const inputWrapper = control.querySelector(
      ".elementor-control-input-wrapper",
    );
    const label = control.querySelector(".elementor-control-title");

    if (!controlField || !originalInput || !inputWrapper || !label) return;

    const isEnhanced = localStorage.getItem("dx_css_mode_enhanced") === "true";

    // 1. Format Native Input
    inputWrapper.style.setProperty("display", "flex", "important");
    inputWrapper.style.setProperty("align-items", "center", "important");
    inputWrapper.style.setProperty("gap", "8px", "important");
    originalInput.style.setProperty("flex-grow", "1", "important");

    // 2. Inject Toggle Button (Inline Immunity)
    const toggleBtn = document.createElement("i");
    toggleBtn.className = "eicon-exchange dx-css-toggle-btn";
    toggleBtn.title = "Toggle Enhanced Classes UI";
    toggleBtn.style.cssText = `
        cursor: pointer !important; font-size: 14px !important; 
        color: ${isEnhanced ? "#F2ADF3" : "#a4afb7"} !important; transition: 0.2s !important;
        flex-shrink: 0 !important; margin: 0 !important; padding: 0 !important;
    `;

    toggleBtn.onmouseover = () =>
      toggleBtn.style.setProperty(
        "color",
        isEnhanced ? "#620856" : "#fff",
        "important",
      );
    toggleBtn.onmouseout = () =>
      toggleBtn.style.setProperty(
        "color",
        localStorage.getItem("dx_css_mode_enhanced") === "true"
          ? "#F2ADF3"
          : "#a4afb7",
        "important",
      );

    inputWrapper.prepend(toggleBtn);

    // 3. Create the Shadow Host for the Pills UI
    const host = document.createElement("div");
    host.className = "dx-css-host";
    host.style.cssText = "width: 100%; flex-basis: 100%; margin-top: 10px;";

    const shadow = host.attachShadow({ mode: "open" });

    const styles = document.createElement("style");
    styles.innerHTML = `
      :host { all: initial; font-family: sans-serif; display: ${isEnhanced ? "block" : "none"}; }
      * { box-sizing: border-box; }
      
      .dx-pills-wrapper {
        display: flex; flex-wrap: wrap; gap: 6px; padding: 8px; 
        border: 1px solid #444; border-radius: 4px; 
        align-items: center; cursor: text; width: 100%;
        background: #1e1e1e; transition: border-color 0.2s;
      }
      .dx-pills-wrapper:focus-within { border-color: #F2ADF3; }
      
      .dx-pills-container { display: flex; flex-wrap: wrap; gap: 6px; }
      
      .dx-pill {
        display: inline-flex; align-items: center; 
        background: #222; color: #ddd; border: 1px solid #444;
        padding: 4px 10px; border-radius: 12px; 
        font-size: 11px; font-weight: bold; font-family: monospace;
        transition: all 0.2s ease; user-select: none;
      }
      .dx-pill:hover { background: #2A0624; color: #F2ADF3; border-color: #F2ADF3; transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
      
      .dx-pill-close { margin-left: 6px; cursor: pointer; font-size: 10px; font-weight: bold; opacity: 0.6; transition: all 0.2s ease; }
      .dx-pill-close:hover { opacity: 1; color: #ef4444; }
      .dx-pill.is-armed { background: #ef4444 !important; color: #fff !important; border-color: #ef4444 !important; }
      
      .dx-adder-input {
        flex-grow: 1; background: transparent; border: none; 
        color: #ddd; outline: none; min-width: 80px; 
        font-size: 11px; padding: 4px; font-family: monospace;
        appearance: none; -webkit-appearance: none;
      }
      .dx-adder-input::placeholder { color: #666; }
    `;
    shadow.appendChild(styles);

    const wrapper = document.createElement("div");
    wrapper.className = "dx-pills-wrapper";

    const pillsContainer = document.createElement("div");
    pillsContainer.className = "dx-pills-container";

    const adderInput = document.createElement("input");
    adderInput.className = "dx-adder-input";
    adderInput.type = "text";
    adderInput.placeholder = "Add class...";

    wrapper.appendChild(pillsContainer);
    wrapper.appendChild(adderInput);
    shadow.appendChild(wrapper);

    controlField.style.setProperty("flex-wrap", "wrap", "important");
    controlField.appendChild(host);

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
        if (typeof jQuery !== "undefined")
          jQuery(originalInput).trigger("input");
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
        pill.className = "dx-pill";

        const text = document.createElement("span");
        text.innerText = cls;

        const removeBtn = document.createElement("span");
        removeBtn.className = "dx-pill-close";
        removeBtn.innerText = "×";

        let armTimer;

        removeBtn.onclick = (e) => {
          e.stopPropagation();
          if (!removeBtn.dataset.armed) {
            removeBtn.dataset.armed = "true";
            pill.classList.add("is-armed");
            armTimer = setTimeout(() => {
              delete removeBtn.dataset.armed;
              pill.classList.remove("is-armed");
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
      const currentlyEnhanced = host.style.display === "block";
      const newMode = !currentlyEnhanced;
      localStorage.setItem("dx_css_mode_enhanced", newMode);

      if (newMode) {
        host.style.display = "block";
        toggleBtn.style.setProperty("color", "#F2ADF3", "important");
        renderPills(true);
      } else {
        host.style.display = "none";
        toggleBtn.style.setProperty("color", "#a4afb7", "important");
      }
    });

    if (isEnhanced) renderPills(true);

    // 7. Classic Field Events
    originalInput.addEventListener("input", () => {
      if (isSyncing) return;
      if (host.style.display === "block") renderPills(false);
    });

    originalInput.addEventListener("blur", () => {
      if (host.style.display === "block") renderPills(true);
      else sanitizeAndSync(originalInput.value);
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

    adderInput.addEventListener("blur", () =>
      processAdderInput(adderInput.value),
    );
    wrapper.addEventListener("click", () => adderInput.focus());
  }
}
