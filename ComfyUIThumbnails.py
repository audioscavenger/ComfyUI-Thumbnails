from server import PromptServer
import manager_core as core
import cm_global
from urllib.parse import unquote

import os
import sys
import server
from aiohttp import web
import aiohttp
# import json
# import zipfile
import urllib.request
import folder_paths
import pathlib

version = 1.21

class ComfyUIThumbnails:
  RETURN_TYPES = ()
  OUTPUT_NODE = False

  def INPUT_TYPES():
    return None


def findFile(name, path):
  for root, dirs, files in os.walk(path):
    if name in files:
      return os.path.join(root, name)


@PromptServer.instance.routes.get("/ComfyUIThumbnails/delete")
# @PromptServer.instance.routes.get("/manager/delete")
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


NODE_CLASS_MAPPINGS = {
  'ComfyUIThumbnails': ComfyUIThumbnails,
}

NODE_DISPLAY_NAME_MAPPINGS = {
  'ComfyUIThumbnails': 'ComfyUI Thumbnails',
}
