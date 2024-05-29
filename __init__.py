# Load Image thumbnails and show input subfolders

"""
@author: AudioscavengeR
@title: ComfyUI Thumbnails
@nickname: ComfyUI Thumbnails
@description: Load Image thumbnails and show input subfolders.
"""


from .ComfyUIThumbnails import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

WEB_DIRECTORY = "./web"

# __all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS', "WEB_DIRECTORY"]
__all__ = ["WEB_DIRECTORY"]


from aiohttp import web
from server import PromptServer
from pathlib import Path

if hasattr(PromptServer, "instance"):
  # NOTE: we add an extra static path to avoid comfy mechanism
  # that loads every script in web.
  PromptServer.instance.app.add_routes(
      [web.static("/ComfyUIThumbnails", (Path(__file__).parent.absolute() / "assets").as_posix())]
  )

