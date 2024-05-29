version = 1.01

class ComfyUIThumbnails:
  RETURN_TYPES = ()
  OUTPUT_NODE = False

  def INPUT_TYPES():
    return None

NODE_CLASS_MAPPINGS = {
  'ComfyUIThumbnails': ComfyUIThumbnails,
}

NODE_DISPLAY_NAME_MAPPINGS = {
  'ComfyUIThumbnails': 'ComfyUI Thumbnails',
}
