# [📷] Load Image Thumbnails for ComfyUI
Load Image thumbnails, delete images, browse input subfolders.

<p align="center">
 <img src="assets/ComfyUI-Thumbnails-featured-meme.webp" />
</p>

## Options

![ComfyUI-Thumbnails-options](/assets/ComfyUI-Thumbnails-options.webp)

| Attribute | Default |
| --- | --- |
| `Show File Names` | False |
| `Show Thumbnails` | True |
| `Thumbnails Size` | 100 |

Thumbnails are lazy loaded, and sized by their max-height. It looks better that way, almost like a masonery. Example without filenames:

![ComfyUI-Thumbnails-options](/assets/ComfyUI-Thumbnails-search-without-filenames.webp)


## Installation
### Manual Download
1. Open a terminal inside the 'custom_nodes' folder located in your ComfyUI installation dir
2. Use the `git clone` command to clone the [ComfyUI-Thumbnails](https://github.com/audioscavenger/ComfyUI-Thumbnails) repo under ComfyUI\custom_nodes\
```
git clone https://github.com/audioscavenger/ComfyUI-Thumbnails
```

## Known Issues
When you switch/select from an Empty Latent Image preset, then select the images dropdown right after, thumbnails are not loaded. To fix this, simply select the Load Image node first / click the drop down a second time. The event that carries the current_node does not propagate immediately, this seems like a bug.

## RoadMap
TODO:

### WIP 1.30
- [ ] browse subfolders of input
  - [x] pass subfolders as objects in py
  - [x] show subfolders as folder icon
  - [x] disable deleteBtn on folders
  - [x] remove litegraph event listener
  - [ ] build actual lost for files and subfolders in py
  - [ ] replace thisRoot content with new subfolder content
  - [ ] add .. folder to go back
  - [ ] have a good night sleep

### release 1.22
- definitely chose api name as `/customnode/deleteImage`

### release 1.21
- bugfix for nodes taht load inexistant images like SDXL Empty Latent etc

### release 1.20
- added slide-in size
- pre-load images
- delete images
- show image name on hover

### release 1.10
- published in comfy-registry

### release 1.0.1
- added option to hide filenames

### release 1.00
- It just works... stole some code from KJNodes again


## :ribbon: Licence
[AGPL 3.0](https://choosealicense.com/licenses/gpl-3.0/)



## :beer: Buy me a beer
Like my work? This tool helped you? Want to sponsor more awesomeness like this?

<p align="center">
 <a href="https://www.paypal.com/donate/?hosted_button_id=CD7P7PK3WP8WU"><img src="/assets/paypal-Donate-QR-Code.png" /></a>
</p>
