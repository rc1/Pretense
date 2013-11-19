# Pretense

A inbrowser mockup image viewer/slideshow. See design mockup (.png images) in the browser.

# Installation

    npm install pretense --save

# Usage

## Starting Pretense

    $ cd folder-full-of-images
    $ pretense

Then you can add/remove/edit images. 

## Viewing in browser

Open `http://localhost:4000/` in Chrome/Safari/Firefox. The browser will load last image found  

## Browser


# Command line options

* `d` <String> - _optional_ the directory to load image files from. Default: the current directory.
* `c` - _optional_ use a centered layout. Default: false.
* `b` <String> - _optional_ css background colour (used onlu behind the images when layout is not centered)
* `p` <Number> - _optional_ the port to serve image from.
* `f` - _optional_ browser will load the last image. Useful for presentations

