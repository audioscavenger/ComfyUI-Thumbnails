# Load Image thumbnails and show input subfolders

"""
@author: AudioscavengeR
@title: ComfyUI Thumbnails
@nickname: ComfyUI Thumbnails
@description: Load Image thumbnails and show input subfolders.
"""

# this works to remove a class, but then we cannot replace it somehow
import nodes
# print(f"nodes.NODE_CLASS_MAPPINGS {nodes.NODE_CLASS_MAPPINGS}")                              # {'LoadImage': <class ..>, .. }
# print(f"nodes.NODE_CLASS_MAPPINGS['LoadImage'] {nodes.NODE_CLASS_MAPPINGS['LoadImage']}")    # <class 'nodes.LoadImage'>
# nodes.NODE_CLASS_MAPPINGS = dict(
  # filter((lambda item: not item[0] == "LoadImage"), nodes.NODE_CLASS_MAPPINGS.items())
# )

from .ComfyUIThumbnails import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS
# print(f"nodes.NODE_CLASS_MAPPINGS {NODE_CLASS_MAPPINGS}")                                 # {'LoadImage': <class 'ComfyUI-Thumbnails.ComfyUIThumbnails.LoadImageThumbnails'>}

# we overwrite the original LoadImage from ComfyUI and I'm not sure it's the right thing to do
# nodes.NODE_CLASS_MAPPINGS['LoadImage'] = NODE_CLASS_MAPPINGS['LoadImage']
nodes.NODE_CLASS_MAPPINGS['LoadImage'] = NODE_CLASS_MAPPINGS['LoadImageThumbnails']

WEB_DIRECTORY = "./web"

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS', "WEB_DIRECTORY"]


from aiohttp import web
from server import PromptServer
from pathlib import Path

if hasattr(PromptServer, "instance"):
  # NOTE: we add an extra static path to avoid comfy mechanism
  # that loads every script in web.
  PromptServer.instance.app.add_routes(
      [web.static("/ComfyUIThumbnails", (Path(__file__).parent.absolute() / "assets").as_posix())]
  )

