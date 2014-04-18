# Pretense

Pre-visualisation tool for screen based/web design. Live updates a browser with any images add to a folder. Pretense allows quick exports from Adobe Illustrator to be viewed in situ for example. It behaves like a slideshow to show the evolution in design or to be used in presentation.

The client side implementation is a single JS library, so custom HTML can be easily made to demostate more complex layouts.

# Installation

    npm install pretense --save

# Usage

## Starting Pretense

    $ cd folder-full-of-images
    $ pretense

Then you can add/remove/edit images from that folder 

## Viewing

Open `http://localhost:4000/` in Chrome/Safari/Firefox. 

The webpage will load the last image in the current folder. Images are always ordered numerically/alphabetically. So it makes sense to name image '00 test.png', '01 test.png' and so on.

When a change happens to a folder, the webpage will display the last new images out of all the new images. If a file was deleted it will display the last image in the directory.

# Command line options

* `-d <String>` _optional_ the directory to load image files from. Default: the current directory.
* `-p <Number>` _optional_ the port to serve image from.
* `init:jade` _optional_ creates a template.jade file in the current directory (for making a custom HTML file)
* `init:servant` _optional_ creates a [https://github.com/rc1/Servant](Servant) startup script and template.jade file.

