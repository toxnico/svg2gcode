# Yet another SVG to GCode converter.

I have teted a few, no one worked as expected, so I took my best js skills to make one.
It worked for many of my cases.

First off, you must convert your drawing into **paths, and only paths**.

You might have to optimize your file with [svgo](https://github.com/svg/svgo) before processing, but it's not necessary

This program uses [Snap.svg](http://snapsvg.io/) for its cool function that makes path coordinates absolute.

It also uses Bootstrap, because, you know, Bootstrap :)

You can customize pen up and down commands usuing the PEN_UP and PEN_DOWN parameters.

The program doesn't care about your svg units, it just uses numbers (the generated GCode is set to mm by default).

For segment length, I usually use 0.1 but the process is a bit longer.

Hope this program works for you too :)