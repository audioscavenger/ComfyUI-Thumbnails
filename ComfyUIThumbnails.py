import os
import sys
import server
from aiohttp import web
import aiohttp
# import json
# import zipfile
import urllib.request
import pathlib
from urllib.parse import unquote

from server import PromptServer
import manager_core as core
import cm_global
import folder_paths
import nodes

version = 1.30

# # No need ot declare an empty class:
# class ComfyUIThumbnails:
  # RETURN_TYPES = ()
  # OUTPUT_NODE = False

  # def INPUT_TYPES():
    # return None


def findFile(name, path):
  for root, dirs, files in os.walk(path):
    if name in files:
      return os.path.join(root, name)



@PromptServer.instance.routes.get("/customnode/deleteImage")
async def deleteImage(request):
  debug = False
  if debug: print(f"ComfyUIThumbnails request: {request}")
  if debug: print(f"ComfyUIThumbnails request.rel_url: {request.rel_url}")
  if debug: print(f"ComfyUIThumbnails request.rel_url.query: {request.rel_url.query}")    # <MultiDictProxy('value': '__revAnimated_v122-house.webp')>

  input_dir = folder_paths.get_input_directory()
  res = {'found': None, 'filename': None, 'status': 'missing'}
  
  if "value" in request.rel_url.query:
    filename = unquote(unquote(request.rel_url.query['value']))
    res['filename'] = filename
    
    if debug: print(f"ComfyUIThumbnails filename: {filename}", file=sys.stderr)
    found = findFile(filename, input_dir)
    if not found:
      if debug: print(f"ComfyUIThumbnails 400 {found} not found", file=sys.stderr)
      res['status'] = 'not found'
      return web.json_response(res, status=400, content_type='application/json')

    if debug: print(f"ComfyUIThumbnails deleting {found}", file=sys.stderr)
    res['found'] = found
    try:
      os.remove(found)
      if debug: print(f"ComfyUIThumbnails 201 deleted {found}", file=sys.stderr)
      res['status'] = 'success'
      # return web.Response(status=201)
      return web.json_response(res, status=201, content_type='application/json')
    except Exception as e:
      print(f"ComfyUIThumbnails 400 delete {found} fail: {e}", file=sys.stderr)
      res['status'] = e
      return web.json_response(res, status=400, content_type='application/json')

  print(f"ComfyUIThumbnails 400 no filename", file=sys.stderr)
  return web.json_response(res, status=400, content_type='application/json')


# we override the original ComfyUI\nodes.py class LoadImage to list subfolders
class LoadImageThumbnails:
# class LoadImage:
  @classmethod
  def INPUT_TYPES(s):
    input_dir = folder_paths.get_input_directory()
    # input_dir = 'E:\\GPT\\ComfyUI'
    # If we add a / at the end of each folder so Comfy.ContextMenuFilterThumbnails extension can identify them as such, they are removed by another class
    folders = [f"{f}" for f in os.listdir(input_dir) if os.path.isdir(os.path.join(input_dir, f))]
    # print(f"LoadImage folders = {folders}", file=sys.stderr)
    files   = [f for f in os.listdir(input_dir) if os.path.isfile(os.path.join(input_dir, f))]
    # print(f"LoadImage files   = {files}", file=sys.stderr)

    # the js extension has no problem receiving a list of mixed strings nad objects! Let's use it at our advantage haha
    # This is the format we need for each folder found:
    folders = [{'name': 'misc', 'files': ['qr-nqzw-high-768.png', 'qr-with-error.png']}]
    folders.extend(sorted(files, key=str.upper))
    # print(f"LoadImage allFiles= {folders}", file=sys.stderr)
    
    
    # sorted(files,key=str.upper).extend(folders)
    return {
      "required": {
        "image": (files, {"image_upload": True})
      },
    }

  CATEGORY = "image"

  RETURN_TYPES = ("IMAGE", "MASK")
  FUNCTION = "load_image"

  def load_image(self, image):
    image_path = folder_paths.get_annotated_filepath(image)
    
    img = node_helpers.pillow(Image.open, image_path)
    
    output_images = []
    output_masks = []
    w, h = None, None

    excluded_formats = ['MPO']
    
    for i in ImageSequence.Iterator(img):
      i = node_helpers.pillow(ImageOps.exif_transpose, i)

      if i.mode == 'I':
        i = i.point(lambda i: i * (1 / 255))
      image = i.convert("RGB")

      if len(output_images) == 0:
        w = image.size[0]
        h = image.size[1]
      
      if image.size[0] != w or image.size[1] != h:
        continue
      
      image = np.array(image).astype(np.float32) / 255.0
      image = torch.from_numpy(image)[None,]
      if 'A' in i.getbands():
        mask = np.array(i.getchannel('A')).astype(np.float32) / 255.0
        mask = 1. - torch.from_numpy(mask)
      else:
        mask = torch.zeros((64,64), dtype=torch.float32, device="cpu")
      output_images.append(image)
      output_masks.append(mask.unsqueeze(0))

    if len(output_images) > 1 and img.format not in excluded_formats:
      output_image = torch.cat(output_images, dim=0)
      output_mask = torch.cat(output_masks, dim=0)
    else:
      output_image = output_images[0]
      output_mask = output_masks[0]

    return (output_image, output_mask)

  @classmethod
  def IS_CHANGED(s, image):
    image_path = folder_paths.get_annotated_filepath(image)
    m = hashlib.sha256()
    with open(image_path, 'rb') as f:
      m.update(f.read())
    return m.digest().hex()

  @classmethod
  def VALIDATE_INPUTS(s, image):
    if not folder_paths.exists_annotated_filepath(image):
      return "Invalid image file: {}".format(image)

    return True


NODE_CLASS_MAPPINGS = {
  'LoadImageThumbnails': LoadImageThumbnails,
}

NODE_DISPLAY_NAME_MAPPINGS = {
  'LoadImage': 'Load Image +Tumbnails',
}
