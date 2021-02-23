# Yet another SVG to GCode converter.

I have tested a few, no one worked as expected, so I took my best js skills (haha) to make my own converter.
It worked for many of my cases.

# Why javascript ? Why inside a browser ?
Well, it was for me the easiest way to get it ready quickly : browsers provide very high level methods on SVG objects, especially :

* `getTotalLength()`
* `getPointAtLength()`

These only two methods made me immediately sing _That's the way I like it !_  
So I made it this way instead of a pythonish or clojurish thing. (although Clojure would have been a very cool language to write this)

One difficulty was the compound paths management. Finally it was just a matter of :
* Giving all the paths absolute coordinates
* Splitting paths on M commands in the data string

# How do I use it ?

You might want to optimize your file with [svgo](https://github.com/svg/svgo) before processing, but it's not necessary.

* First off, you must convert your drawing into **paths, and only paths**.

* Simply paste your SVG text into the first field (no XML header, only from &lt;svg&gt; to &lt;/svg&gt; included)

* Set the desired segment length. I typically use 0.5

* Click the **Convert to GCode** button. The browser may hang a bit and ask you if you're sure you want to continue the script execution: say yes... Every time.

* Your GCode appears in the second field.
* The SVG file is displayed
* A preview of the parsed SVG is displayed too. No worries if the image is cropped, I'm just too busy to make it work better for now. PRs are welcome :)
* You can now copy-paste the generated G-Code in a file, and load it into [bCNC](https://github.com/vlachoudis/bCNC), or any G-Code sender (but I must admit bCNC is the best)

# Stuff that helped

This program uses [Snap.svg](http://snapsvg.io/) for its cool function that makes path coordinates absolute.

It also uses Bootstrap, because, you know, [Bootstrap](https://getbootstrap.com) :)

# Notes

You can customize pen up and down commands usuing the PEN_UP and PEN_DOWN globals in [app.js](app.js).

The program doesn't care about your svg units, it just uses numbers (the generated GCode is set to mm by default).

Hope this program works for you too :)


# What's missing ?
* Don't do the the pen up/pen-down if the distance to go is below some threshold.
* Make this program CLI-friendly

Feel free to enhance it !

And I hope this program will work for you too :)