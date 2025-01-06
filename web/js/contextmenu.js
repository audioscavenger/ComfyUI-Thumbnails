import { app } from "../../../scripts/app.js";

// Adds context menu entries, code partly from pyssssscustom-scripts

//  ██████  ██████  ████████ ██  ██████  ███    ██ ███████ 
// ██    ██ ██   ██    ██    ██ ██    ██ ████   ██ ██      
// ██    ██ ██████     ██    ██ ██    ██ ██ ██  ██ ███████ 
// ██    ██ ██         ██    ██ ██    ██ ██  ██ ██      ██ 
//  ██████  ██         ██    ██  ██████  ██   ████ ███████ 

const options = {
  // name: "ThumbnailsContextmenu",
  // name: "Comfy.ThumbnailsContextmenu",
  name: "Thumbnails.ContextMenuOptions",
  async setup(app) {
    app.ui.settings.addSetting({
      id: "Thumbnails.ContextMenuOptions.thumbnailSize",
      name: "[📷] Load Image: Thumbnails Size",
      defaultValue: 100,
      type: "integer"
    });
    app.ui.settings.addSetting({
      id: "Thumbnails.ContextMenuOptions.enableNames",
      name: "[📷] Load Image: Show File names",
      defaultValue: false,
      type: "boolean",
      // options: (value) => [
      //   { value: true, text: "On", selected: value === true },
      //   { value: false, text: "Off", selected: value === false },
      // ],
    });
    app.ui.settings.addSetting({
      id: "Thumbnails.ContextMenuOptions.enableThumbnails",
      name: "[📷] Load Image: Enable Thumbnails",
      defaultValue: true,
      type: "boolean",
      // options: (value) => [
      //   { value: true, text: "On", selected: value === true },
      //   { value: false, text: "Off", selected: value === false },
      // ],
    });
  }
}
app.registerExtension(options);
