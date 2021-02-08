var PEN_UP = "M3 S100";
var PEN_DOWN = "M3 S0";
var PEN_DELAY = 0.3;

function header() {
    var lines = [
        "G21 (set units to millimeters)",
        penUp()
    ]
    return lines.join("\n");
}

function footer() {
    var lines = [
        
        "G0 X0 Y0 (go home)"
    ]
    return lines.join("\n");
}

function penCommand(command, delay) {
    var str = command;
    if (delay)
        str += "\n" + "G4 P" + delay.toString();
    return str;
}

function penUp() {
    return penCommand(PEN_UP, PEN_DELAY);
}

function penDown() {
    return penCommand(PEN_DOWN, PEN_DELAY);
}

function convert()
{
    var f = new FormData(document.getElementById("frm"));
    
    var container = document.getElementById("svg-container");
    container.innerHTML = f.get("svg").trim();

    var s = Snap(container.firstChild);
    var allPaths = s.selectAll("path").items;

    //absolutize all the paths
    for(var i=0;i< allPaths.length;i++)
    {
        var data = allPaths[i].node.getAttribute("d");
        
        var absolute_raw = Snap.path.toAbsolute(data).map(a=> a.join(" "));

        var abs = absolute_raw.join(" ");
        
        allPaths[i].node.setAttribute("d", abs);
    }

    var gcode = process(container.firstChild, f.get("segmentLength"));

    document.getElementById("txt-gcode").value = gcode;
}

//splits a compound path into the number of compounds
function splitCompoundPath(separator, path){
    var d = path.getAttribute("d");

    var subPaths = d.split(separator)
                    .filter(l=>l!= "");
    
    return subPaths.map(sp => {
        var div = document.createElement("svg");
        div.innerHTML = path.outerHTML;
        var newPath = div.childNodes[0];
        newPath.setAttribute("d", separator + sp);
        //setting id may not be necessary
        newPath.setAttribute("id", "haha_" + Math.round(Math.random() * 1000000000000));
        return newPath;
    });

}


function splitPathsByMoveCommand(moveCmd, paths){
    var subPathsSplitted = [];
    for(var p of paths){
        var subPaths = splitCompoundPath(moveCmd, p);
        for(var sp of subPaths){
            subPathsSplitted.push(sp);
            p.parentElement.appendChild(sp);
        }

        p.parentElement.removeChild(p);
    }

    return subPathsSplitted;
}

function preprocess(paths){
    
    

    paths = removeDuplicatePaths(paths);
    
    paths = splitPathsByMoveCommand("M", paths);


    var parent = paths[0].parentElement;
    while(parent.tagName != "svg")
        parent = parent.parentElement;

    
    return parent.innerHTML;
}

function process(svg, segmentLength) {

    
    var cnv = document.getElementById("cnv");
    var ctx = cnv.getContext("2d");
    
    var paths = Array.from(svg.querySelectorAll("path"));

    svg.innerHTML = preprocess(paths);
    


    paths = Array.from(svg.querySelectorAll("path"));

    paths = removeDuplicatePaths(paths);
    

    var pathsEnhanced = paths.map(enhancePath);

    var sortedPaths = sortPaths(pathsEnhanced);

    var allPoints = sortedPaths.map(p=>pathToPoints(p, segmentLength));

    var allGCode = [];

    allGCode.push(header());
    
    ctx.clearRect(0,0,499,499);

    for (var i = 0; i < allPoints.length; i++) {

        
        drawPoints(ctx, allPoints[i]);

        var gcode = pointsToGCode(allPoints[i]);
        allGCode.push(gcode.join("\n"));

    }

    allGCode.push(footer());
    return allGCode.join("\n");
}

//Sorts the path list to minimize rapid moves between two consecutive paths. Reverses paths directions if needed.
function sortPaths(paths){

    var output = [];
    //add the first path untouched
    paths[0].isProcessed = true;
    output.push(paths[0]);

    var currentPath = paths[0];
    //process all unprocessed paths
    
    while(paths.filter(p=>p.isProcessed).length < paths.length)
    {
        var positionAfterDraw = currentPath.mustBeReversed ? currentPath.startPoint : currentPath.endPoint;

        //calculate the distance from current position to start and end points of all unprocessed paths
        var unprocessed = paths.filter(p=> !p.isProcessed);
        unprocessed.forEach(p=>{
            p.startPointDistance = distanceBetween(positionAfterDraw, p.startPoint);
            p.endPointDistance = distanceBetween(positionAfterDraw, p.endPoint);
        });

        var pathWithClosestStartPoint = unprocessed.sort((a,b)=> a.startPointDistance > b.startPointDistance)[0];
        var pathWithClosestEndPoint = unprocessed.sort((a,b)=> a.endPointDistance > b.endPointDistance)[0];

        if(pathWithClosestEndPoint.endPointDistance < pathWithClosestStartPoint.startPointDistance)
        {
            currentPath = pathWithClosestEndPoint;
            currentPath.mustBeReversed = true;
        }
        else
        {
            currentPath = pathWithClosestStartPoint;
        }

        currentPath.isProcessed = true;
        output.push(currentPath);

    }

    return output;
}

function removeDuplicatePaths(paths){
    var output = [];

    for(var p of paths){
        var data = p.getAttribute("d");

        var exists = output.find(i=> i.getAttribute("d") == data);
        if(!exists)
            output.push(p);
    }
    return output;
}

//adds information to a path : start and end coords
function enhancePath(p){
    p.startPoint = p.getPointAtLength(0);
    p.endPoint = p.getPointAtLength(p.getTotalLength());
    p.isProcessed = false;
    p.mustBeReversed = false;
    return p;
}

function distanceBetween(p1, p2){
    return Math.sqrt(Math.pow(p1.x-p2.x, 2) + Math.pow(p1.y-p2.y, 2));
}

//generates a GCode command. Y is inverted to respect a classic coord space.
function pointsToGCode(points) {
    var output = [];

    for (var i = 0; i < points.length; i++) {
        var pt = points[i];
        if (i == 0) {
            //first point : rapid move
            output.push(`G0 X${pt.x} Y${-pt.y}`);
            output.push(penDown());
        }
        else {
            //other points : normal move
            output.push(`G1 X${pt.x} Y${-pt.y}`);
        }
    }
    output.push(penUp());
    
    return output;
}

//Produces an array of points (x,y) from a given path.
function pathToPoints(path, segmentLength) {
    var length = path.getTotalLength();
    var segmentCount = Math.ceil(length / segmentLength);
    var adjustedSegmentLength = length / segmentCount;

    var intervals = [];
    for (var i = 0; i < length + adjustedSegmentLength; i += adjustedSegmentLength) {
        intervals.push(i);
    }

    //rounding correction for last point
    if (intervals[intervals.length - 1] > length) {
        intervals[intervals.length - 1] = length;
    }

    // if the path is closed, we add the first point at the end
    var pathData = path.getAttribute("d");
    if (pathData.endsWith("Z"))
        intervals.push(0);

    var points = intervals.map((i) => path.getPointAtLength(i));

    //reverse direction if necessary
    if(path.mustBeReversed)
        points.reverse();

    return points;
        
}

//Draw to the canvas
function drawPoints(ctx, points) {

    if (points.length < 2)
        return;

    ctx.beginPath();
    //ctx.lineWidth = 1;
    ctx.moveTo(points[0].x, points[0].y);

    for (var i = 1; i < points.length; i++) {
        var p = points[i];

        ctx.lineTo(p.x, (p.y));
        ctx.stroke();
    }
}


