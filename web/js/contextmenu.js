import { app } from "../../../scripts/app.js";

// Adds context menu entries, code partly from pyssssscustom-scripts

function addMenuHandler(nodeType, cb) {
  const getOpts = nodeType.prototype.getExtraMenuOptions;
  nodeType.prototype.getExtraMenuOptions = function () {
    const r = getOpts.apply(this, arguments);
    cb.apply(this, arguments);
    return r;
  };
}

app.registerExtension({
  name: "ThumbnailsContextmenu",
  async setup(app) {
    app.ui.settings.addSetting({
      id: "Thumbnails.enableNames",
      name: "[📷] Load Image: Show File names",
      defaultValue: false,
      type: "boolean",
      options: (value) => [
        { value: true, text: "On", selected: value === true },
        { value: false, text: "Off", selected: value === false },
      ],
    });
    app.ui.settings.addSetting({
      id: "Thumbnails.enableThumbnails",
      name: "[📷] Load Image: Show Thumbnails",
      defaultValue: true,
      type: "boolean",
      options: (value) => [
        { value: true, text: "On", selected: value === true },
        { value: false, text: "Off", selected: value === false },
      ],
    });
    app.ui.settings.addSetting({
      id: "Thumbnails.thumbnailSize",
      name: "[📷] Load Image: Thumbnails Size",
      defaultValue: 100,
      type: "integer"
    });
  }
});
