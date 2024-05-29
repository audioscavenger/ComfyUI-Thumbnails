import { app } from "../../../scripts/app.js";
import { generateId, injectCss, injectJs, wait } from "../../ComfyUI-Thumbnails/js/shared_utils.js";

// we don;t need that at all
// loadScript('/ComfyUIThumbnails/js/imagesloaded.pkgd.min.js').catch((e) => {
  // console.log(e)
// })

// Adds filtering to combo context menus

var addImg = function(div){
  // http://127.0.0.1:8188/view?filename=__revAnimated_v122-house.png&type=input&subfolder=&t=1716949459831
  // http://127.0.0.1:8188/view?filename=__revAnimated_v122-house.png&type=input
  // https://css-tricks.com/piecing-together-approaches-for-a-css-masonry-layout/
  let filename = encodeURIComponent(div.getAttribute('data-value'));
  let thumbnailSize = app.ui.settings.getSettingValue("Thumbnails.thumbnailSize");
  thumbnailSize = (thumbnailSize == undefined) ? 100 : thumbnailSize;
  let enableNames = app.ui.settings.getSettingValue("Thumbnails.enableNames");
  enableNames = (enableNames == undefined) ? false : enableNames;
  let fontSize = enableNames ? 'inherit' : '0';
  console.log('enableNames',enableNames)
  console.log('fontSize',fontSize)
  // console.log('filename',filename)

  // 'beforeBegin', 'afterBegin', 'beforeEnd', or 'afterEnd'.
  div.style.fontSize = fontSize;
  div.insertAdjacentHTML( 'afterBegin', `<img decoding="async" loading="lazy" width="400" height="400" style="max-height:${thumbnailSize}px" class="masonry-content" src="view?filename=${filename}&type=input" alt="${filename}">` );
  div.classList.add("masonry-item");
  // console.log('div',div)
  return div
}

// we should override the core extensions/core/contextMenuFilter.js but I don't know how. Can't use the same name.
const ext = {
  // name: "Comfy.ContextMenuFilter",
  // name: "Thumbnails.ContextMenuFilterThumbnails",
  name: "Comfy.ContextMenuFilterThumbnails",
  init() {
    const ctxMenu = LiteGraph.ContextMenu;

    LiteGraph.ContextMenu = function (values, options) {
      const ctx = ctxMenu.call(this, values, options);

      // If we are a dark menu (only used for combo boxes) then add a filter input
      if (options?.className === "dark" && values?.length > 10) {
        // we are not replacing the menu filter, otherwise when images are filtered, the original filter listener would take over
        let filter = document.getElementsByClassName("comfy-context-menu-filter")[0];
        // originalFilter.parentNode.removeChild(originalFilter);
        
        // let filter = document.createElement("input");
        filter.classList.add("comfy-context-menu-filter");
        filter.placeholder = "Filter images";
        // this.root.prepend(filter);

        const items = Array.from(this.root.querySelectorAll(".litemenu-entry"));
        let displayedItems = [...items];
        let enableThumbnails = app.ui.settings.getSettingValue("Thumbnails.enableThumbnails");
        enableThumbnails = (enableThumbnails == undefined) ? true : enableThumbnails;
        if (app.ui.settings.getSettingValue("Thumbnails.enableThumbnails") === true) {
          let displayedItems = [...items.map(addImg)];
        }
        
        let itemCount = displayedItems.length;
        // console.log('items',items)
        // console.log(`itemCount: ${itemCount}`)

        // We must request an animation frame for the current node of the active canvas to update.
        requestAnimationFrame(() => {
          const currentNode = LGraphCanvas.active_canvas.current_node;
          const clickedComboValue = currentNode.widgets
            ?.filter(w => w.type === "combo" && w.options.values.length === values.length)
            .find(w => w.options.values.every((v, i) => v === values[i]))
            ?.value;

          let selectedIndex = clickedComboValue ? values.findIndex(v => v === clickedComboValue) : 0;
          if (selectedIndex < 0) {
            selectedIndex = 0;
          } 
          let selectedItem = displayedItems[selectedIndex];
          updateSelected();

          // Apply highlighting to the selected item
          function updateSelected() {
            selectedItem?.style.setProperty("background-color", "");
            selectedItem?.style.setProperty("color", "");
            selectedItem = displayedItems[selectedIndex];
            selectedItem?.style.setProperty("background-color", "#ccc", "important");
            selectedItem?.style.setProperty("color", "#000", "important");
          }

          const positionList = () => {
            const rect = this.root.getBoundingClientRect();

            // If the top is off-screen then shift the element with scaling applied
            if (rect.top < 0) {
              const scale = 1 - this.root.getBoundingClientRect().height / this.root.clientHeight;
              const shift = (this.root.clientHeight * scale) / 2;
              this.root.style.top = -shift + "px";
            }
          }

          // Arrow up/down to select items
          filter.addEventListener("keydown", (event) => {
            switch (event.key) {
              case "ArrowUp":
                event.preventDefault();
                if (selectedIndex === 0) {
                  selectedIndex = itemCount - 1;
                } else {
                  selectedIndex--;
                }
                updateSelected();
                break;
              case "ArrowRight":
                event.preventDefault();
                selectedIndex = itemCount - 1;
                updateSelected();
                break;
              case "ArrowDown":
                event.preventDefault();
                if (selectedIndex === itemCount - 1) {
                  selectedIndex = 0;
                } else {
                  selectedIndex++;
                }
                updateSelected();
                break;
              case "ArrowLeft":
                event.preventDefault();
                selectedIndex = 0;
                updateSelected();
                break;
              case "Enter":
                selectedItem?.click();
                break;
              case "Escape":
                this.close();
                break;
            }
          });

          filter.addEventListener("input", () => {
            // Hide all items that don't match our filter
            const term = filter.value.toLocaleLowerCase();
            // When filtering, recompute which items are visible for arrow up/down and maintain selection.
            displayedItems = items.filter(item => {
              const isVisible = !term || item.textContent.toLocaleLowerCase().includes(term);
              // item.style.display = isVisible ? "block" : "none";
              item.style.display = isVisible ? "inline-grid" : "none";
              item.style.display = isVisible ? "inline-grid" : "none";  // we double it to overrive the core filter that is still active
              return isVisible;
            });

            selectedIndex = 0;
            if (displayedItems.includes(selectedItem)) {
              selectedIndex = displayedItems.findIndex(d => d === selectedItem);
            }
            itemCount = displayedItems.length;

            updateSelected();

            // If we have an event then we can try and position the list under the source
            if (options.event) {
              let top = options.event.clientY - 10;

              const bodyRect = document.body.getBoundingClientRect();
              const rootRect = this.root.getBoundingClientRect();
              if (bodyRect.height && top > bodyRect.height - rootRect.height - 10) {
                top = Math.max(0, bodyRect.height - rootRect.height - 10);
              }

              this.root.style.top = top + "px";
              positionList();
            }
          });

          requestAnimationFrame(() => {
            // Focus the filter box when opening
            filter.focus();

            positionList();
          });
        })
      }

      return ctx;
    };
    
    LiteGraph.ContextMenu.prototype = ctxMenu.prototype;
  },
}

const cssPromise = injectCss("extensions/ComfyUI-Thumbnails/css/contextMenuFilterThumbnails.css");
// const jsPromise = injectJs("https://cdnjs.cloudflare.com/ajax/libs/jquery.imagesloaded/4.1.4/imagesloaded.pkgd.min.js");
app.registerExtension(ext);


