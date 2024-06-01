import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";
import { generateId, injectCss, injectJs, wait, show_message } from "../../ComfyUI-Thumbnails/js/shared_utils.js";
var thumbnailSizeDefault = 100;

// we don;t need that at all
// loadScript('/ComfyUIThumbnails/js/imagesloaded.pkgd.min.js').catch((e) => {
  // console.log(e)
// })

function getListFromStorage(listName){
  let listJson = localStorage.getItem(listName);
  let list = (listJson === null) ? [] : JSON.parse(listJson);
  return list;
}

function pushItemToStorage(listName, item){
  var list = getListFromStorage(listName);
  list.push(item)
  localStorage.setItem(listName, JSON.stringify(list));
}

// Adds filtering to combo context menus
async function deleteImage(filenameUri, thisRoot) {
  // console.log('deleteImage filename',filenameUri)
  // console.log('deleteImage thisRoot', thisRoot)
  
  // let prev_text = update_all_button.innerText;
  // update_all_button.innerText = "Updating all...(ComfyUI)";
  // update_all_button.disabled = true;
  // update_all_button.style.backgroundColor = "gray";

  try {
    // var mode = manager_instance.datasrc_combo.value;

    // update_all_button.innerText = "Updating all...";
    const response = await api.fetchApi(`/ComfyUIThumbnails/delete?value=${filenameUri}`);
    // const response = await api.fetchApi(`/manager/delete?value=${filenameUri}`);
    const response_json = await response.json();
    // console.log('response',response)
    // console.log('response.json()', response_json)

    if (response.status == 403) {
      show_message(`Error deleting image ${filenameUri}: OS refused`);
      return false;
    }

    if (response.status == 400) {
      show_message(`Error deleting image ${filenameUri}: not found`);
      return false;
    }

    if(response.status == 200 || response.status == 201) {
      // console.log('response_json',response_json);   // {found: 'E:\\GPT\\ComfyUI\\input\\file-01 - Copy (3).jpg', filename: 'file-01 - Copy (3).jpg', status: 'success'}
      // console.log('deleteImage event',event);
      let filenameDecoded = decodeURIComponent(filenameUri);
      // let nodeList = thisRoot.querySelectorAll(".litemenu-entry")
      let childToDelete = thisRoot.querySelectorAll(`[data-value="${filenameDecoded}"]`)[0]
      // let childToDelete = event.target.parentNode.parentNode.querySelectorAll(`[data-value="${filenameDecoded}"]`)[0]
      // console.log('btnDelete childToDelete',childToDelete);
      // this works but somehow it's reset later on. I haven't found what controls the content of values in LiteGraph.ContextMenu = function (values, options)
      thisRoot.removeChild(childToDelete) && pushItemToStorage('deletedImages', filenameDecoded);

      // let failed_list = "";
      // if(response_json.failed.length > 0) {
        // failed_list = "<BR>FAILED: "+response_json.failed.join(", ");
      // }

      // let updated_list = "";
      // if(response_json.updated.length > 0) {
        // updated_list = "<BR>UPDATED: "+response_json.updated.join(", ");
      // }

      // show_message(
        // "Image deleted: ${filenameUri}"
        // +failed_list
        // +updated_list
        // );

      // const rebootButton = document.getElementById('cm-reboot-button5');
      // rebootButton.addEventListener("click",
        // function() {
          // if(rebootAPI()) {
            // manager_dialog.close();
          // }
        // });
    }
    else {
      show_message(`Error deleting image ${response_json.filename}: status = ${response_json.status}`);
    }

    return true;
  }
  catch (exception) {
    show_message(`Failed to delete image ${filenameUri} / ${exception}`);
    return false;
  }
  // finally {
    // console.log('finally')
    // remove image from the list
    
    // update_all_button.disabled = false;
    // update_all_button.innerText = prev_text;
    // update_all_button.style.backgroundColor = "";
  // }
}

function urlExists(url) {
  var http = new XMLHttpRequest();
  http.open('HEAD', url, false);
  http.send();
  return http.status!=404;
}

async function checkLink(url) { return (await fetch(url)).ok }

var addImg = async function(div, thisRoot){
  // http://127.0.0.1:8188/view?filename=__revAnimated_v122-house.png&type=input&subfolder=&t=1716949459831
  // http://127.0.0.1:8188/view?filename=__revAnimated_v122-house.png&type=input
  // https://css-tricks.com/piecing-together-approaches-for-a-css-masonry-layout/
  let filename = div.getAttribute('data-value');
  // remove iamges that were deleted in this session; there will be a bug if you re-add it, it won't show up. 
  // therefore, must intercept onDragDrop called (widgets.js:507)
  // if (!checkLink(src)) return; // does not work fast enough
  // if (!urlExists(src)) return; // works but still slow and producces errors in console
  // let deletedImages = getListFromStorage()
  let deletedImages = getListFromStorage('deletedImages')
  // console.log('filename',filename,'deletedImages',deletedImages);
  if (deletedImages.includes(filename)) return;
  
  let filenameUri = encodeURIComponent(filename);
  let src = `view?filename=${filenameUri}&type=input`;
  // preload image and detect size
  let img=new Image();
  img.onload = function() {
    div.dataset.size = `${this.width}x${this.height}`;
    // spanSize.dataset.size = `${this.width}x${this.height}`;
    // spanSize.innerHTML = `${this.width}x${this.height}`;
  }
  img.src=src;


  let thumbnailSize = app.ui.settings.getSettingValue("Thumbnails.thumbnailSize");
  thumbnailSize = (thumbnailSize == undefined) ? thumbnailSizeDefault : thumbnailSize;
  let maxHeight = thumbnailSize
  
  // i'd like to have so sense of which images are bigger then others
  // let maxHeight = thumbnailSize * (Math.random() * (1.5 - 1) + 1)
  
  let enableNames = app.ui.settings.getSettingValue("Thumbnails.enableNames");
  enableNames = (enableNames == undefined) ? false : enableNames;
  let title = (enableNames) ? '' : filename;
  // console.log('enableNames',enableNames)
  // console.log('fontSize', fontSize)
  // console.log('filename', filename, 'filenameUri', filenameUri)
  // console.log('div.value', div.value)   // div.value is the filenameDecoded!
  // console.log('thisRoot', thisRoot)

  // add css to the div
  div.classList.add("masonry-item");
  // show or hide thumbnail name
  if (!enableNames) { div.classList.add('hideText'); } else { div.classList.add('showText'); }
  // 'beforeBegin', 'afterBegin', 'beforeEnd', or 'afterEnd'.
  // insert thumbnail inside div
  div.insertAdjacentHTML( 'afterBegin', `<img decoding="async" loading="lazy" width="400" height="400" style="max-height:${maxHeight}px" class="masonry-content" src="${src}" alt="${filenameUri}" title="${title}">` );
  
  // we need a separate span for size as font-size maybe 0 in the div
  // let spanSize = document.createElement("span");
  // spanSize.classList.add("spanSize");
  // div.appendChild(spanSize)

  // add delete button at top-right
  // div.insertAdjacentHTML( 'afterBegin', `<button type="button" class="btn btn-secondary btn-delete" onclick="event.preventDefault();">❌</button>` );
  // div.insertAdjacentHTML( 'afterBegin', `<button type="button" class="btn btn-secondary btn-delete" data-filename="${filenameUri}">❌</button>` );
  let btnDelete = document.createElement("button");
  btnDelete.appendChild(document.createTextNode("❌"));
  btnDelete.classList.add("btn");
  btnDelete.classList.add("btn-secondary");
  btnDelete.classList.add("btn-delete");
  btnDelete.dataset.filename = filenameUri;
  div.appendChild(btnDelete)
  
  btnDelete.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    // console.log('btnDelete event',event)
    // console.log('btnDelete event.target.dataset.filename', event.target.dataset.filename)
    // console.log('img',event.target.parentNode)
    deleteImage(event.target.dataset.filename, thisRoot);
  });

  // update_all_button =
    // $el("button.cm-button", {
      // type: "button",
      // textContent: "Update All",
      // onclick:
        // () => updateAll(this.update_check_checkbox, self)
    // });
    
  // console.log('div',div)
  return div
}


// we should override the core extensions/core/contextMenuFilter.js but I don't know how. Can't use the same name.
const ext = {
  // name: "Comfy.ContextMenuFilter",
  // name: "Thumbnails.ContextMenuFilterThumbnails",
  name: "Comfy.ContextMenuFilterThumbnails",
  init() {
    // reset storage of deleted images
    localStorage.setItem('deletedImages', JSON.stringify([]));
    const ctxMenu = LiteGraph.ContextMenu;

    LiteGraph.ContextMenu = function (values, options) {                                        // we must find what is passing values to this function and alter the list there
      // values is a list of all the files in input folder                                      // or maybe the issue is that we should delete the original Comfy.ContextMenuFilter?
      const ctx = ctxMenu.call(this, values, options);
      // console.log('this',this)
      // console.log('values',values)    // list of all the files in input folder, or empty images:
      // console.log('values?.length',values?.length)
      //    "1536 x 640   (landscape)"
      //    "1344 x 768   (landscape)"
      // console.log('options',options)
      
      // current_node has:
      // title                            = Load Image / SDXL Empty Latent Image (rgthree) / ..
      // type                             = LoadImage / SDXL Empty Latent Image (rgthree) / ..
      // properties['Node name for S&R']  = LoadImage / SDXL Empty Latent Image (rgthree) / ..
      
      // new bug discovered! when you switch from one load image node dropdown to another, the values are correct but not the current_node! it just lags behind
      // to fix it, simply select Load Image before clicking the drop down.
      // const thisCurrentNode = LGraphCanvas.active_canvas.current_node;
      const thisCurrentNode = options.event.view.LGraphCanvas.active_canvas.current_node;
      // console.log('thisCurrentNode.type', thisCurrentNode.type)
      if (thisCurrentNode?.type !== "LoadImage") return ctx;
      
      // If we are a dark menu (only used for combo boxes) then add a filter input, only for > 10 values
      // the filter is added by the original Comfy.ContextMenuFilter extension that we cannot de-register, haven't found a way yet
      // therefore, we must use the same conditions
      if (options?.className === "dark" && values?.length > 10) {
        // console.log('options?.className',options?.className)
        // we are not replacing the menu filter, otherwise when images are filtered, the original filter listener would take over
        let filter = document.getElementsByClassName("comfy-context-menu-filter")[0];

        // originalFilter.parentNode.removeChild(originalFilter);
        // let filter = document.createElement("input");
        // filter.classList.add("comfy-context-menu-filter");
        filter.placeholder = "Filter images";
        // this.root.prepend(filter);

        let thisRoot = this.root
        // console.log('thisRoot before',thisRoot)
        // console.log('getListFromStorage',getListFromStorage('deletedImages'))
        // we need to find what controls the content of values in LiteGraph.ContextMenu = function (values, options) and the buildup of ".litemenu-entry"
        for (var deletedImage of getListFromStorage('deletedImages')) {
          let childToDelete = thisRoot.querySelectorAll(`[data-value="${decodeURIComponent(deletedImage)}"]`)[0]
          // console.log('deletedImage',deletedImage,'childToDelete',childToDelete)
          if (childToDelete) thisRoot.removeChild(childToDelete)
        }
        // console.log('thisRoot after',thisRoot)

        let items = Array.from(thisRoot.querySelectorAll(".litemenu-entry"));
        // console.log('items',items)
        let displayedItems = [...items];
        
        let enableThumbnails = app.ui.settings.getSettingValue("Thumbnails.enableThumbnails");
        enableThumbnails = (enableThumbnails == undefined) ? true : enableThumbnails;
        // we only care about LoadImage types, that actually load images from input folder
        if (enableThumbnails === true) {
          // let displayedItems = [...items.map(addImg)];
          // console.log('thisRoot',thisRoot)
          let displayedItems = [...items.map(function(x) { return addImg(x, thisRoot) })];    // we pass this to addImg for the btnDelete event to delete the item
        }
        
        let itemCount = displayedItems.length;
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

          filter.addEventListener("input", (event) => {
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

          requestAnimationFrame((event) => {
            // Focus the filter box when opening
            filter.focus();

            positionList();
          });
        })

      } // dark

      return ctx;
    };
    
    LiteGraph.ContextMenu.prototype = ctxMenu.prototype;
  },
}

const cssPromise = injectCss("extensions/ComfyUI-Thumbnails/css/contextMenuFilterThumbnails.css");
// const jsPromise = injectJs("https://cdnjs.cloudflare.com/ajax/libs/jquery.imagesloaded/4.1.4/imagesloaded.pkgd.min.js");
app.registerExtension(ext);







// apis are defined in E:\GPT\ComfyUI\custom_nodes\ComfyUI-Manager\glob\manager_server.py

// @PromptServer.instance.routes.get("/manager/default_ui")
// async def default_ui_mode(request):
    // if "value" in request.rel_url.query:
        // set_default_ui_mode(request.rel_url.query['value'])
        // core.write_config()
    // else:
        // return web.Response(text=core.get_config()['default_ui'], status=200)

    // return web.Response(status=200)

/* 
// ----------- E:\GPT\ComfyUI\custom_nodes\ComfyUI-Manager\js\comfyui-manager.js
class ManagerMenuDialog extends ComfyDialog {
  createControlsLeft() {
    let self = this;
    default_ui_combo.addEventListener('change', function (event) {
      api.fetchApi(`/manager/default_ui?value=${event.target.value}`);
    });
    api.fetchApi('/manager/dbl_click/policy')
      .then(response => response.text())
      .then(data => {
        dbl_click_policy_combo.value = data;
        set_double_click_policy(data);
      });
    api.fetchApi('/manager/share_option')
      .then(response => response.text())
      .then(data => {
        share_combo.value = data || 'all';
        share_option = data || 'all';
      });

    share_combo.addEventListener('change', function (event) {
      const value = event.target.value;
      share_option = value;
      api.fetchApi(`/manager/share_option?value=${value}`);
      const shareButton = document.getElementById("shareButton");
      if (value === 'none') {
        shareButton.style.display = "none";
      } else {
        shareButton.style.display = "inline-block";
      }
    });
    return [
      $el("div", {}, [this.update_check_checkbox, uc_checkbox_text]),
      $el("br", {}, []),
      this.datasrc_combo,
      channel_combo,
      preview_combo,
      badge_combo,
      default_ui_combo,
      share_combo,
      component_policy_combo,
      dbl_click_policy_combo,
      $el("br", {}, []),

      $el("br", {}, []),
      $el("filedset.cm-experimental", {}, [
          $el("legend.cm-experimental-legend", {}, ["EXPERIMENTAL"]),
          $el("button.cm-experimental-button", {
            type: "button",
            textContent: "Snapshot Manager",
            onclick:
              () => {
                if(!SnapshotManager.instance)
                SnapshotManager.instance = new SnapshotManager(app, self);
                SnapshotManager.instance.show();
              }
          }),
          $el("button.cm-experimental-button", {
            type: "button",
            textContent: "Install PIP packages",
            onclick:
              () => {
                var url = prompt("Please enumerate the pip packages to be installed.\n\nExample: insightface opencv-python-headless>=4.1.1\n", "");

                if (url !== null) {
                  install_pip(url, self);
                }
              }
          }),
          $el("button.cm-experimental-button", {
            type: "button",
            textContent: "Unload models",
            onclick: () => { free_models(); }
          })
        ]),
    ];
  }
  constructor() {
    super();

    const close_button = $el("button", { id: "cm-close-button", type: "button", textContent: "Close", onclick: () => this.close() });

    const content =
        $el("div.comfy-modal-content",
          [
            $el("tr.cm-title", {}, [
                $el("font", {size:6, color:"white"}, [`ComfyUI Manager Menu`])]
              ),
            $el("br", {}, []),
            $el("div.cm-menu-container",
              [
                $el("div.cm-menu-column", [...this.createControlsLeft()]),
                $el("div.cm-menu-column", [...this.createControlsMid()]),
                $el("div.cm-menu-column", [...this.createControlsRight()])
              ]),

            $el("br", {}, []),
            close_button,
          ]
        );

    content.style.width = '100%';
    content.style.height = '100%';

    this.element = $el("div.comfy-modal", { id:'cm-manager-dialog', parent: document.body }, [ content ]);
  }
}

 */
/* 
app.registerExtension({
	name: "Comfy.ManagerMenu",
	init() {
		$el("style", {
			textContent: style,
			parent: document.head,
		});
	},
	async setup() {
		let orig_clear = app.graph.clear;
		app.graph.clear = function () {
			orig_clear.call(app.graph);
			load_components();
		};

		load_components();

		const menu = document.querySelector(".comfy-menu");
		const separator = document.createElement("hr");

		separator.style.margin = "20px 0";
		separator.style.width = "100%";
		menu.append(separator);

		const managerButton = document.createElement("button");
		managerButton.textContent = "Manager";
		managerButton.onclick = () => {
				if(!manager_instance)
					setManagerInstance(new ManagerMenuDialog());
				manager_instance.show();
			}
		menu.append(managerButton);
...

 */



