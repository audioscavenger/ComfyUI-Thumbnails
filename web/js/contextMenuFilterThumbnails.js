import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";
import { generateId, injectCss, injectJs, wait, show_message } from "../../ComfyUI-Thumbnails/js/shared_utils.js";  // oddly, we should not add /web in the path
var thumbnailSizeDefault = 100;
var imagesExt = ['apng', 'png', 'avif', 'gif', 'jpg', 'jpeg', 'j2k', 'j2p', 'jxl', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'tif']

var debug = false
var log = false
// var debug = true
// var log = true

// we don't need that at all
// /ComfyUIThumbnails is defined in __init__.py as pointing to assets/
// loadScript('/ComfyUIThumbnails/js/imagesloaded.pkgd.min.js').catch((e) => {
  // console.log(e)
// })

function getDictFromStorage(dictName){
  let dictJson = localStorage.getItem(dictName);
  let dict = (dictJson === null) ? {} : JSON.parse(dictJson);
  return dict;
}

function pushDictToStorage(dictName, dict){
  localStorage.setItem(dictName, JSON.stringify(dict));
}

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

async function deleteNode(filename, thisRoot) {
  let childToDelete = thisRoot.querySelectorAll(`[data-value="${filename}"]`)[0]
  // let childToDelete = event.target.parentNode.parentNode.querySelectorAll(`[data-value="${filename}"]`)[0]
  // console.log('btnDelete childToDelete',childToDelete);
  // this works but somehow it's reset later on. I haven't found what controls the content of values in LiteGraph.ContextMenu = function (values, options)
  thisRoot.removeChild(childToDelete) && pushItemToStorage('thumbnails.DeletedImages', filename);
}

// apis are defined in ComfyUI\custom_nodes\ComfyUI-Manager\glob\manager_server.py
// apis are defined in ComfyUI\custom_nodes\ComfyUI-Thumbnails\ComfyUIThumbnails.py
// Adds filtering to combo context menus
async function deleteImage(filenameUri, thisRoot) {
  if (log) console.log('deleteImage filename', filenameUri)   // badgers%20-%20Copy.png
  if (log) console.log('deleteImage thisRoot', thisRoot)      // <div class="litegraph litecontextmenu litemenubar-panel dark" ..
  
  // let prev_text = update_all_button.innerText;
  // update_all_button.innerText = "Updating all...(ComfyUI)";
  // update_all_button.disabled = true;
  // update_all_button.style.backgroundColor = "gray";

  try {
    const response = await api.fetchApi(`/customnode/deleteImage?value=${filenameUri}`);
    const response_json = await response.json();
    if (debug) console.debug('response', response);               // Response { type: "basic", url: "http://127.0.0.1:8188/api/customnode/deleteImage?value=badgers%20-%20Copy.png", redirected: false, status: 201, ok: true, statusText: "Created", headers: Headers(8), body: ReadableStream, bodyUsed: true }
    if (debug) console.debug('response.json()', response_json);   // Object { found: "E:\\GPT\\ComfyUI\\input\\badgers - Copy.png", filename: "badgers - Copy.png", status: "success" }

    if (response.status == 403) {
      show_message(`Error deleting image ${filenameUri}: OS refused`);
      return false;
    }

    if (response.status == 400) {
      show_message(`Error deleting image ${filenameUri}: not found`);
      return false;
    }

    if(response.status == 200 || response.status == 201) {
      if (debug) console.debug('response_json',response_json);    // {found: 'E:\\GPT\\ComfyUI\\input\\file-01 - Copy (3).jpg', filename: 'file-01 - Copy (3).jpg', status: 'success'}
      // if (debug) console.debug('deleteImage event', event);    // this is now undefined, as 'event' is deprecated.ts(6385)
      let filenameDecoded = decodeURIComponent(filenameUri);
      // let nodeList = thisRoot.querySelectorAll(".litemenu-entry")
      deleteNode(filenameDecoded, thisRoot)
      
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
    // if (debug) console.debug('finally')
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

// addImg() builds the masonery of images by pulling them from the /view api defined in ComfyUI\server.py
// folders     = [{name:name1, files:[filename1, ..]}, ..]
// foldersDict = {{name1: [filename1, ..], ..}
// 1.25: foldersDict = getListFromStorage('thumbnails.Folders') = [{ "name": "name1", "files": ["file11.png", "file12.png"]}, { "name": "name2", "files": ["file21.png", "file22.png"]}]
// BUG: second time you click on load image, foldersDict is empty -> all folders are therefore removed due to invalid extension
// BUG: subfolder argument doesn't work anymore after switch to TS
// var addImg = async function(div, thisRoot, foldersDict){
var addImg = async function(div, thisRoot){
  // http://127.0.0.1:8188/view?filename=pose-01.jpg&type=input&subfolder=pose
  // http://127.0.0.1:8188/view?filename=ComfyUI_00011_.png&type=input
  // https://css-tricks.com/piecing-together-approaches-for-a-css-masonry-layout/
  if (debug) console.debug('addImg: div', div);
  if (debug) console.debug('addImg: thisRoot', thisRoot);
  if (debug) console.log('addImg: getListFromStorage', getListFromStorage('thumbnails.Folders'));

  let foldersDict = getDictFromStorage('thumbnails.Folders')  // 1.25: now we rebuild foldersDict here, it's the only way to not lose its content because we alter 'values' in ext
  if (debug) console.log('addImg: foldersDict', foldersDict);
  
  // add masonery css to the div
  div.classList.add("masonry-item");
  
  let filename = div.getAttribute('data-value');          // folder object: [object Object]
  let fileext = filename.split('.').pop();
  // let isFolder = (filename == fileext) ? true : false;
  let isFolder = (foldersDict[filename]) ? true : false;

  // if (log) console.log('addImg: filename=', filename); // folder object: [object Object]
  if (log) console.log(`addImg: filename=${filename} fileext=${fileext} isFolder=${isFolder} foldersDict[${filename}]=`, foldersDict[filename]);
  
  // refuse to show anything else then images and folders: as a matter of fact, LoadImage will not filter images and return every file
  // Therefore, we also filter out extensions not in imagesExt
  if (!isFolder && !imagesExt.includes(fileext)) {
    console.log(`addImg: deleteNode ${filename}`);
    deleteNode(filename, thisRoot)
    return;
  }
  
  // bypass images that were deleted in this session; there will be a bug if you re-add the same image name, as it won't show up indeed.
  // A browser refresh will empty the local storage and fix the bug
  // Therefore, we should intercept onDragDrop called (widgets.js:507) to fix this bug
  // if (!checkLink(src)) return; // does not work fast enough
  // if (!urlExists(src)) return; // works but still slow and producces errors in console
  // let thumbnails.DeletedImages = getListFromStorage()
  let deletedImages = getListFromStorage('thumbnails.DeletedImages')
  if (debug) console.debug('addImg: filename', filename, 'deletedImages', deletedImages);
  if (deletedImages.includes(filename)) return;
  
  let filenameUri = encodeURIComponent(filename);
  // /LoadImageThumbnails is defined in __init__.py as pointing to assets/
  let src = 'LoadImageThumbnails/folder.png';
  
  // handle 1 level of subfolders; we cannot have "/" in the filename, server.py crashes LoadImage otherwise
  // if (filename.slice(-1) !== '/') {
  if (!isFolder) {
    src = `view?filename=${filenameUri}&type=input`;
    // "/view?" + new URLSearchParams(filepath).toString() + app.getPreviewFormatParam() + app.getRandParam()

    // preload image and detect size
    let img=new Image();
    img.onload = function() {
      div.dataset.size = `${this.width}x${this.height}`;
    }
    img.src=src;
  } else {
    div.classList.add("folder");
    div.dataset.size = filename;
    div.dataset.files = foldersDict[filename];
    // let files
    if (debug) console.debug('addImg: foldersDict',foldersDict);
    // for (const folder of folders) {if (folder.name == filename) files = folder.files }
    
    // remove click eventListener inner_onclick() from litegraph.core.js: == removeListeners as we cannot remove a listener created outside this scope
    let divClone = div.cloneNode(true);
    div.replaceWith(divClone);
    div = divClone
  }

  let thumbnailSize = app.ui.settings.getSettingValue("Thumbnails.thumbnailSize");
  thumbnailSize = (thumbnailSize == undefined) ? thumbnailSizeDefault : thumbnailSize;
  let maxHeight = thumbnailSize
  
  // i'd like to have so sense of which images are bigger then others
  // let maxHeight = thumbnailSize * (Math.random() * (1.5 - 1) + 1)
  
  // if (debug) console.debug('addImg: app.ui.settings', app.ui.settings)
  // app.ui.settings.settingsValues = Object { "pysssss.SnapToGrid": true, "Thumbnails.enableNames": false, ... }
  let enableNames = app.ui.settings.getSettingValue("Thumbnails.enableNames");
  enableNames = (enableNames == undefined) ? false : enableNames;
  let title = (enableNames) ? '' : filename;
  // if (debug) console.debug('addImg: enableNames', enableNames)
  // if (debug) console.debug('addImg: fontSize', fontSize)
  // if (debug) console.debug('addImg: filename', filename, 'filenameUri', filenameUri)
  // if (debug) console.debug('addImg: div.value', div.value)   // div.value is the filenameDecoded!
  // if (debug) console.debug('addImg: thisRoot', thisRoot)

  // show or hide thumbnail name
  if (!enableNames) { div.classList.add('hideText'); } else { div.classList.add('showText'); }
  // 'beforeBegin', 'afterBegin', 'beforeEnd', or 'afterEnd'.
  // insert thumbnail inside div
  div.insertAdjacentHTML( 'afterBegin', `<img decoding="async" loading="lazy" width="400" height="400" style="max-height:${maxHeight}px" class="masonry-content" src="${src}" alt="${filenameUri}" title="${title}">` );
  
  // add delete button at top-right for images only
  if (!isFolder) {
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
      // console.log('addImg: btnDelete event',event)
      // console.log('addImg: btnDelete event.target.dataset.filename', event.target.dataset.filename)
      // console.log('addImg: img',event.target.parentNode)
      deleteImage(event.target.dataset.filename, thisRoot);
    });
  // } else {
  }

  // update_all_button =
    // $el("button.cm-button", {
      // type: "button",
      // textContent: "Update All",
      // onclick:
        // () => updateAll(this.update_check_checkbox, self)
    // });
    
  // if (debug) console.debug('addImg: return div', div)
  return div
}


// we should override the core extensions/core/contextMenuFilter.js but I don't know how. Can't use the same name.
// main problem to get subfolder images from input, is that ComfyUI\nodes.py class LoadImage does not load subfolders
// Therefore, we simply superseed the python class LoadImage!
const ext = {
  // name: "Comfy.ContextMenuFilter",
  // name: "Thumbnails.ContextMenuFilterThumbnails",
  name: "Comfy.ContextMenuFilterThumbnails",
  init(event) {
    if (debug) console.debug('Extension: init event ----------------', event);  // Object { vueAppReady: true, ui: {…}, logging: {…}, extensions: (201) […], extensionManager: Proxy, _nodeOutputs: {}, nodePreviewImages: {}, graph: {…}, ..
    // reset storage of deleted images
    localStorage.setItem('thumbnails.DeletedImages', JSON.stringify([]));
    const ctxMenu = LiteGraph.ContextMenu;
    if (debug) console.debug('Extension: ctxMenu ----------------', ctxMenu);   // function ContextMenu(values, options)

    // we should  find what is passing values to this function and alter the list there
    // values:  array of all the filenames as string in input folder for LoadImage, or custom values for other nodes (that we shall not process)
    // options: style stuff added to thisRoot
    LiteGraph.ContextMenu = function (values, options) {
      // console.log('myFunc.caller',myFunc.caller)
      
      // new bug discovered! when you switch from one load image node dropdown to another, the values are correct but not the current_node! it just lags behind
      // to fix it, simply select Load Image before clicking the drop down.
      // const thisCurrentNode = LGraphCanvas.active_canvas.current_node;
      const thisCurrentNode = options.event.view.LGraphCanvas.active_canvas.current_node;
      
      // exclude KJNodes empty latent presets and other similar fake image lists
      // if (debug) console.debug('Extension: this', this)                                   // Object { }  // empty after upgrade to TS
      if (debug) console.debug('Extension: thisCurrentNode', thisCurrentNode)
      if (debug) console.debug('Extension: thisCurrentNode.type', thisCurrentNode?.type)   // LoadImage
      if (thisCurrentNode?.type !== "LoadImage") return ctxMenu.call(this, values, options);

      let enableThumbnails = app.ui.settings.getSettingValue("Thumbnails.enableThumbnails");
      enableThumbnails = (enableThumbnails == undefined) ? true : enableThumbnails;
      
      // cleanup values from folder objects if any, keep only names
      if (debug) console.debug('Extension: options', options)
      if (log) console.debug('Extension: values before', values)  // [{"folder1":[file1,..]}, "file1.png", ..]
      if (debug) console.debug('Extension: values?.length before', values?.length)
      // item = "filename1.png" or object { "name": "name1", "files": ["file1.png", ..]}

      let foldersDict = getDictFromStorage('thumbnails.Folders')   // second pass and we cannot rebuild this as folder objects are removed from values
      let forDeletion = []
      // let folder = {}
      values.forEach((item, i) => {
        if (typeof item == 'object') {

          // build foldersDict that we will use later to rebuild ctx with new values; do not re-add same folder twice.
          if (!foldersDict[item.name]) foldersDict[item.name] = item?.files
          
          // just replace folder object with just its name // 1.24: doing that, second click will show no folders
          values[i] = item['name']

          // and mark it for deletion if not enableThumbnails
          if (!enableThumbnails) forDeletion.push(item['name'])
        }
      });
      pushDictToStorage('thumbnails.Folders', foldersDict);

      if (!enableThumbnails) values = values.filter(item => !forDeletion.includes(item))
      if (log) console.debug('Extension: forDeletion', forDeletion) // ["file1.png",  ..]
      if (log) console.debug('Extension: values after', values)     // ["folder1", "file1.png", ..]

      if (log) console.log('Extension: foldersDict', foldersDict) // {"misc": ["qr-error_corrected-example (1).png", ..], ..}
      
      // values is a list of all the files in input folder // or maybe the issue is that we should delete the original Comfy.ContextMenuFilter?
      let ctx = ctxMenu.call(this, values, options);
      if (debug) console.debug('Extension: ctx', ctx)
      if (!enableThumbnails) return ctx;
      if (debug) console.debug('Extension: values?.length after', values?.length)
      
      //    "1536 x 640   (landscape)"
      //    "1344 x 768   (landscape)"
      // if (debug) console.debug('Extension: options',options)         // {"scale": 1, "event": {"isTrusted": true, "deltaX": 0, "deltaY": 0, "canvasX": 12.2, "canvasY": 8.8}, "className": "dark", "scroll_speed": -0.1}

      // current_node has:
      // title                            = Load Image / SDXL Empty Latent Image (rgthree) / ..
      // type                             = LoadImage  / SDXL Empty Latent Image (rgthree) / ..
      // properties['Node name for S&R']  = LoadImage  / SDXL Empty Latent Image (rgthree) / ..


      // create ctx creates thisRoot, the input filter, and the div list
      // ctx = ctxMenu.call(this, ['misc', 'badgers.png','badgers.png','badgers.png','badgers.png','badgers.png','badgers.png'], options);


      // If we are a dark menu (only used for combo boxes) then add a filter input, only for > 10 values
      // the filter is added by the original Comfy.ContextMenuFilter extension that we cannot de-register, haven't found a way yet
      // at least we can override it for less than 10 images
      if (options?.className === "dark" && values?.length > 1) {
        // if (debug) console.debug('Extension: options?.className',options?.className)
        // we are not replacing the menu filter, otherwise when images are filtered, the original filter listener would take over
        let filter = document.getElementsByClassName("comfy-context-menu-filter")[0];

        // originalFilter.parentNode.removeChild(originalFilter);
        // let filter = document.createElement("input");
        // filter.classList.add("comfy-context-menu-filter");
        filter.placeholder = "Filter images";
        // this.root.prepend(filter);

        // let thisRoot = this.root                 // 'this' is undefined after October 2024 upgrade to TS
        let thisRoot = ctx.root
        if (debug) console.debug('Extension: thisRoot before', thisRoot)  // undefined after October 2024 upgrade to TS
        if (debug) console.debug('Extension: getListFromStorage', getListFromStorage('thumbnails.DeletedImages'))   // empty until you delete smth
        // we need to find what controls the content of values in LiteGraph.ContextMenu = function (values, options) and the buildup of ".litemenu-entry"
        for (var deletedImage of getListFromStorage('thumbnails.DeletedImages')) {
          let childToDelete = thisRoot.querySelectorAll(`[data-value="${decodeURIComponent(deletedImage)}"]`)[0]
          if (debug) console.debug('Extension: deletedImage', deletedImage, 'childToDelete', childToDelete)
          if (childToDelete) thisRoot.removeChild(childToDelete)
        }
        if (debug) console.debug('Extension: thisRoot after', thisRoot)  // undefined after October 2024 upgrade to TS

        let items = Array.from(thisRoot.querySelectorAll(".litemenu-entry"));
        // subfolders values are objects, but in the generated div items innerHTML/innerText, it's actually "[object Object]"
        if (log) console.debug('Extension: items', items)
        // Array(18) [ div.litemenu-entry.submenu, .. ]
        //    <div class="litemenu-entry submenu masonry-item" role="menuitem" data-value="[object Object]">
        //    <div class="litemenu-entry submenu masonry-item hideText" role="menuitem" data-value="badgers - Copy.png" data-size="1024x1024">
        //    ...
        let displayedItems = [...items];
        
        // we only care about LoadImage types, that actually load images from input folder
        if (enableThumbnails === true) {
          // let displayedItems = [...items.map(addImg)]; // we need to pass thisRoot as well
          // displayedItems = [...items.map(function(el) { return addImg(el, thisRoot, folders) })]; // we pass thisRoot to addImg so the btnDelete event can delete the item
          // displayedItems = [...items.map(function(el) { return addImg(el, thisRoot, foldersDict) })]; // we pass thisRoot to addImg so the btnDelete event can delete the item
          displayedItems = [...items.map(function(el) { return addImg(el, thisRoot) })]; // foldersDict is now getListFromStorage('thumbnails.Folders')
/*
filtering and removing elements here does not help. We need to alter values directly, before ctx is instanced

        } else {
          // remove folder objects if any
          // displayedItems = items.filter(el => el.innerText !== '[object Object]' ); // removing entried from the filter is insufficient, we need to delete the div too
          items = items.filter(el => { if (el.innerText !== '[object Object]') {return el} else {el.remove()} });
          displayedItems = [...items];
*/
        }
        if (log) console.log('Extension: displayedItems', displayedItems)
        
        let itemCount = displayedItems.length;
        if (debug) console.debug(`Extension: itemCount: ${itemCount}`)

        let divFolders = document.getElementsByClassName("folder");
        Array.from(divFolders).forEach(function(element) {
          element.addEventListener('click', (event) => {
            
          });
        });
    
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
          async function updateSelected() {
            // styles are now undefined for some reason, added more "?"
            selectedItem?.style?.setProperty("background-color", "");
            selectedItem?.style?.setProperty("color", "");
            selectedItem = displayedItems[selectedIndex];
            selectedItem?.style?.setProperty("background-color", "#ccc", "important");
            selectedItem?.style?.setProperty("color", "#000", "important");
          }

          const positionList = () => {
            // const rect = this.root.getBoundingClientRect();
            // const rect = ctx.root.getBoundingClientRect();
            const rect = thisRoot.getBoundingClientRect();

            // If the top is off-screen then shift the element with scaling applied
            if (rect.top < 0) {
              // const scale = 1 - this.root.getBoundingClientRect().height / this.root.clientHeight;
              // const scale = 1 - ctx.root.getBoundingClientRect().height / ctx.root.clientHeight;
              const scale = 1 - thisRoot.getBoundingClientRect().height / thisRoot.clientHeight;
              // const shift = (this.root.clientHeight * scale) / 2;
              // const shift = (ctx.root.clientHeight * scale) / 2;
              const shift = (thisRoot.clientHeight * scale) / 2;
              // this.root.style.top = -shift + "px";
              // ctx.root.style.top = -shift + "px";
              thisRoot.style.top = -shift + "px";
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
            // console.log('displayedItems',displayedItems)
            // console.log('items',items)
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

      // console.log('return ctx')
      return ctx;
    };
    
    LiteGraph.ContextMenu.prototype = ctxMenu.prototype;
  },
}

const cssPromise = injectCss("extensions/ComfyUI-Thumbnails/css/contextMenuFilterThumbnails.css");  // for some reason we cannot use the actual path /web/css
// const jsPromise = injectJs("https://cdnjs.cloudflare.com/ajax/libs/jquery.imagesloaded/4.1.4/imagesloaded.pkgd.min.js");
// const jsPromise = injectJs("https://cdnjs.cloudflare.com/ajax/libs/jquery.imagesloaded/5.0.0/imagesloaded.pkgd.min.js");
app.registerExtension(ext);







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



