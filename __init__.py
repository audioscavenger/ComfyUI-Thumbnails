# Load Image thumbnails and show input subfolders

"""
@author: AudioscavengeR
@title: LoadImageThumbnails
@nickname: LoadImageThumbnails
@description: Load Image thumbnails and show input subfolders.
"""

# this works to remove a class, but then we cannot replace it somehow
import nodes
# print(f"nodes.NODE_CLASS_MAPPINGS {nodes.NODE_CLASS_MAPPINGS}")                              # {'LoadImage': <class ..>, .. }
# print(f"nodes.NODE_CLASS_MAPPINGS['LoadImage'] {nodes.NODE_CLASS_MAPPINGS['LoadImage']}")    # <class 'nodes.LoadImage'>
# nodes.NODE_CLASS_MAPPINGS = dict(
  # filter((lambda item: not item[0] == "LoadImage"), nodes.NODE_CLASS_MAPPINGS.items())
# )

# print(f"nodes.NODE_CLASS_MAPPINGS.LoadImage {nodes.NODE_CLASS_MAPPINGS.LoadImage}")                                 # AttributeError: 'dict' object has no attribute 'LoadImage'
# print(f"nodes.NODE_DISPLAY_NAME_MAPPINGS.LoadImage {nodes.NODE_DISPLAY_NAME_MAPPINGS.LoadImage}")                   # AttributeError: 'dict' object has no attribute 'LoadImage'

# we overwrite the original LoadImage from ComfyUI and I'm not sure it's the right thing to do; actually it's not as LoadImage is not loaded yet
# nodes.NODE_CLASS_MAPPINGS.pop('LoadImage', None)
# nodes.NODE_DISPLAY_NAME_MAPPINGS.pop('LoadImage', None)

from .LoadImageThumbnails import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS
# print(f"NODE_CLASS_MAPPINGS {NODE_CLASS_MAPPINGS}")                                             # {'LoadImageThumbnails': <class 'ComfyUI-Thumbnails.LoadImageThumbnails.LoadImageThumbnails'>}
# print(f"NODE_DISPLAY_NAME_MAPPINGS {NODE_DISPLAY_NAME_MAPPINGS}")                               # {'LoadImageThumbnails': 'Load Image+Thumbnails'}

# here we override the default LoadImage node with our own. It's okay since we do not modify the IN or OUT
nodes.NODE_CLASS_MAPPINGS['LoadImage'] = NODE_CLASS_MAPPINGS['LoadImage']
nodes.NODE_DISPLAY_NAME_MAPPINGS['LoadImage'] = NODE_DISPLAY_NAME_MAPPINGS['LoadImage']

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS', "WEB_DIRECTORY"]


WEB_DIRECTORY = "./web"
from aiohttp import web
from server import PromptServer
from pathlib import Path

if hasattr(PromptServer, "instance"):
  # NOTE: we add an extra static path to avoid comfy mechanism
  # that loads every script in web.
  PromptServer.instance.app.add_routes(
      [web.static("/LoadImageThumbnails", (Path(__file__).parent.absolute() / "assets").as_posix())]
  )

