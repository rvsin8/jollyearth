"""Compatibility entry point: build the original Earthbound turtle.

The former external-specimen importer is archived as non-executable source under
pipeline/assets/green-sea-turtle/archived-external-predecessor/. It is not used.
"""
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name('create_green_turtle.py')), run_name='__main__')
