var lineCanvas = document.getElementById("lineCanvas");
var lineContext = lineCanvas.getContext("2d");
var rect = lineCanvas.getBoundingClientRect();

var graphCanvas = document.getElementById("graphCanvas");
var graphContext = graphCanvas.getContext("2d");
var graphRect = graphCanvas.getBoundingClientRect();

var crosshairCanvas = document.getElementById("crosshairCanvas");
var crosshairContext = crosshairCanvas.getContext("2d");

var lineButton = document.getElementById("lineButton");
var deleteLineButton = document.getElementById("deleteLineButton");

var canvasDiv = document.getElementById("canvasDiv");

lineContext.strokeStyle = "#72b914";
graphContext.strokeStyle = "#888888";
crosshairContext.strokeStyle = "rgba(0, 0, 200, 0.3)";

var xPos;
var yPos;
var pressed = 0;
var lines = [];
var lineButtonPressed = false;
var deleteLineButtonPressed = false;
var buttonDictionary = {
    "lineButton": lineButtonPressed,
    "deleteLineButton": deleteLineButtonPressed
};
var scalingFactor = 0;
var frameSizeMax = 180;
var frameSizeMin = 20;
var halfCanvasHeight = graphCanvas.height / 2;
var lineWidth = 1;
var max = Number.MIN_SAFE_INTEGER;
var min = Number.MAX_SAFE_INTEGER;
var lineMax = Number.MIN_SAFE_INTEGER;
var lineMin = Number.MAX_SAFE_INTEGER;
var scaledPrice = 0;
var timeScale = 10;
var initialCanvasWidth = graphCanvas.width;

var graphPoints = [];

function drawLineRect() { // draws rectangle on canvas - not used
    lineContext.fillStyle = "rgba(0, 0, 200, 0.5)";
    lineContext.fillRect(0, 0, 150, 75);
}

function drawGraphRect() {
    graphContext.fillStyle = "rgba(0, 200, 0, 0.5)";
    graphContext.fillRect(75, 0, 150, 75);
}

function drawLine() {
    if (pressed != 0) { // stops from drawing a line after two mouse presses
        drawAll();
        lineContext.moveTo(xPos, yPos); //  line start
        endXPos = event.clientX - rect.left + canvasDiv.scrollLeft;
        endYPos = event.clientY - rect.top;
        lineContext.lineTo(endXPos, endYPos);
        lineContext.stroke();
        writeMessage();
    }
}

function drawCrosshair() {
    xPosCrosshair = event.clientX - rect.left + canvasDiv.scrollLeft; // x and y cordinates of mouse on canvas
    yPosCrosshair = event.clientY - rect.top;
    clearCrosshairCanvas();
    crosshairContext.moveTo(0, yPosCrosshair); //  line start
    crosshairContext.lineTo(lineCanvas.width, yPosCrosshair);
    crosshairContext.stroke();
    crosshairContext.moveTo(xPosCrosshair, 0);
    crosshairContext.lineTo(xPosCrosshair, lineCanvas.height);
    crosshairContext.stroke();

    document.getElementById("coordinates").innerHTML =
        "Mouse Position: " +
        (event.clientX - rect.left + canvasDiv.scrollLeft) / 50.45 + ", <br> " + // prints out the x axis divided by ~50
        Math.round((((event.clientY - rect.top - 20) / scalingFactor) + min ) * -100000) / 100000  + // prints out the mouse position - 20 (padding) divided by the scalingFactor, + min -> rounded to 5 decimal places
        ", scroll pos: " + canvasDiv.scrollLeft;
}

function drawAll() {
    clearLineCanvas();
    for (var i = 0; i <= lines.length - 1; i++) { // length starts from 1 not 0
        lineContext.moveTo(lines[i].start.x, scaleLine(lines[i].start.y));
        lineContext.lineTo(lines[i].end.x, scaleLine(lines[i].end.y));
        lineContext.stroke();
    }
    // console.log("line: " + scalingFactor + ", " + lines[lines.length - 1].end.y + ", " + lines[lines.length - 1].end.y * scalingFactor);
}

function writeMessage() { // changes id=coordinates text to the mouse position on the canvas 
    document.getElementById("coordinates").innerHTML =
        "Mouse Position: " +
        (event.clientX - rect.left + canvasDiv.scrollLeft) + ", " +
        (event.clientY - rect.top) +
        ", scroll pos: " + canvasDiv.scrollLeft;
}

function mouseDownFunction(event) {
    xPos = event.clientX - rect.left + canvasDiv.scrollLeft; // x and y cordinates of mouse on canvas
    yPos = event.clientY - rect.top;
    if (buttonDictionary["lineButton"] && event.button == 0) { // if draw line button pressed, and if button pressed was left click
        pressed++;
        if (pressed == 1) { //  draws start of point
            lineObj.updateStart(xPos, (yPos - 20)/scalingFactor + min); // sets the start point in object
            lineContext.moveTo(xPos, yPos);
        } else if (pressed == 2) { //  sets the end of line, and pushes a clone of this point to lines array
            lineObj.updateEnd(xPos, (yPos - 20)/scalingFactor + min);
            lineContext.lineTo(xPos, yPos);
            lines.push(lineObj.clone());
            pressed = 0;

            drawAll();
        }
    } else if (buttonDictionary["deleteLineButton"] && event.button == 0) { // else if delete button pressed and using left click
        buttonDictionary["lineButton"] = false;
        deleteLine(xPos, yPos);
    }
}

function clearLineCanvas() {
    lineContext.clearRect(0, 0, lineContext.canvas.width, lineContext.canvas.height); // clears canvas   
    lineContext.beginPath(); // needed to clear canvas if drawing lines
    lineContext.strokeStyle = "#72b914"; // apply colour to line
}

function clearGraphCanvas() {
    graphContext.clearRect(0, 0, graphContext.canvas.width, graphContext.canvas.height); // clears canvas 
    graphContext.beginPath(); // needed to clear canvas if drawing lines
    graphContext.strokeStyle = "#888888"; // apply colour to graph
}

function clearCrosshairCanvas() {
    crosshairContext.clearRect(0, 0, crosshairContext.canvas.width, crosshairContext.canvas.height); // clears canvas 
    crosshairContext.beginPath(); // needed to clear canvas if drawing lines
    crosshairContext.strokeStyle = "rgba(0, 0, 200, 0.3)"; // apply colour to croshair
}
function deleteLine(x, y) { // deletes manual drawn line(s) under x and y coordinates on canvas
    for (var i = 0; i < lines.length; i++) { // loops through every line in the array
        // var mouseToLineEndLen = Math.hypot(x - lines[i].end.x, y - lines[i].end.y); // gets distance from x/y to line end 
        var mouseToLineEndLen = Math.hypot(x - lines[i].end.x, y - scaleLine(lines[i].end.y)); // gets distance from x/y to line end 

        var mouseToLineStartLen = Math.hypot(x - lines[i].start.x, y - scaleLine(lines[i].start.y)); // gets distance from x/y to line start

        var lineLen = Math.hypot(lines[i].end.x - lines[i].start.x, scaleLine(lines[i].end.y) - scaleLine(lines[i].start.y)); // gets line length

        if (mouseToLineEndLen + mouseToLineStartLen < lineLen + .8 && // checks if distance of (x/y + start) + (x/y + end) is less than line length + proximity of .8
            mouseToLineEndLen + mouseToLineStartLen > lineLen - .8) { // checks if distance of (x/y + start) + (x/y + end) is greater than line length - proximity of .8
            lines.splice(i, 1); // removes the line from array
            drawAll();  // redraws all the lines in the array
        }
    }
}

function scaleLine(input){
    return ((input - min) * scalingFactor) + frameSizeMin;
}

function LineObject(xPos, yPos) {
    this.start = {
            x: xPos,
            y: yPos
        },
        this.end = {
            x: xPos,
            y: yPos
        }
}

LineObject.prototype = {
    reset: function (xPos, yPos) {
        this.start.x = this.end.x = xPos;
        this.start.y = this.end.y = yPos;
    },
    updateStart: function (xPos, yPos) {
        this.start.x = xPos;
        this.start.y = yPos;
    },
    updateEnd: function (xPos, yPos) {
        this.end.x = xPos;
        this.end.y = yPos;
    },
    clone: function () {
        var clone = new LineObject(this.start.x, this.start.y);
        clone.updateEnd(this.end.x, this.end.y);
        return clone;
    }
}

var lineObj = new LineObject();

function GraphObject(price, time) {
    this.price = price;
    this.time = time;
}

GraphObject.prototype = {
    clone: function () {
        var clone = new GraphObject(this.price, this.time)
        return clone;
    }
}

var graphObj = new GraphObject();

function graphWidthAdjust() {
    if((timeScale * graphPoints.length) > initialCanvasWidth/2){    // checks if graph has reached center of canvas
        graphCanvas.width += timeScale;
        lineCanvas.width += timeScale;
        crosshairCanvas.width += timeScale;
        drawAll();
        drawCrosshair(canvasDiv.scrollLeft);
        if(initialCanvasWidth + canvasDiv.scrollLeft >= graphCanvas.width - timeScale){ // checks if scroll position is far right
            canvasDiv.scrollTo(initialCanvasWidth + canvasDiv.scrollLeft, 0); // scrolls div to far right - window.scrollTo(x,y) 
        } 
    }
    redrawGraphSection();
}

function redrawGraphSection(){ // only draw the visable portion of the graph
    clearGraphCanvas();
    console.log(canvasDiv.scrollLeft);
    for (var i = Math.ceil(canvasDiv.scrollLeft / timeScale); i < (canvasDiv.scrollLeft + initialCanvasWidth) / timeScale; i++) {
        if (graphPoints[i + 1] !== undefined) { // checks if i + 1 exists
            graphContext.lineWidth = lineWidth;
            graphContext.beginPath(); // needed to clear canvas if drawing lines
            graphContext.moveTo((i) * timeScale,
                getPriceForGraph(i));
            graphContext.lineTo((i + 1) * timeScale,
                getPriceForGraph(i + 1));
            graphContext.stroke();
        }
    }
}

function getPriceForGraph(i) {
    if (graphPoints[i].price > max) { // gets min and max using current price
        max = graphPoints[i].price
    }
    if (graphPoints[i].price < min) {
        min = graphPoints[i].price
    }

    scalingFactor = ((graphCanvas.height) - 45) / (max - min); //  (canvas.max(200) - margin from the bottom) - canvas.min(0) / (price.max - price.min) = scaling factor
    scaledPrice = ((graphPoints[i].price - min) * scalingFactor) + frameSizeMin; // gets current price - minimum, then scales it to the canvas size. + adds 20 as a margin from the top

    return scaledPrice;
}

function toggleButton(buttonId, buttonActive) {
    if (buttonActive) {
        buttonActive = false;
        document.getElementById(buttonId).classList.remove("buttonOn");
        document.getElementById(buttonId).classList.add("buttonOff");
    } else {
        buttonActive = true;
        document.getElementById(buttonId).classList.remove("buttonOff");
        document.getElementById(buttonId).classList.add("buttonOn");
    }
    buttonDictionary[buttonId] = buttonActive;
}

function keyPress(evt) { //  if Esc is pressed then stop drawing line
    evt = evt || window.event;
    var isEscape = false;
    if ("key" in evt) {
        isEscape = (evt.key === "Escape" || evt.key === "Esc");
    } else {
        isEscape = (evt.keyCode === 27);
    }

    if (isEscape) {
        pressed = 0;
        drawAll();
    }
};

lineCanvas.addEventListener("contextmenu", function (event) {
    event.preventDefault();
    var ctxMenu = document.getElementById("ctxMenu");
    ctxMenu.style.display = "block";
    ctxMenu.style.left = (event.pageX - 10) + "px";
    ctxMenu.style.top = (event.pageY - 10) + "px";
}, false);

lineCanvas.addEventListener("mousemove", function (event) {
    var ctxMenu = document.getElementById("ctxMenu");
    ctxMenu.style.display = "";
    ctxMenu.style.left = "";
    ctxMenu.style.top = "";
}, false);


lineCanvas.addEventListener("mousemove", drawLine); //   on mouse move inside canvas execute writeMessage
lineCanvas.addEventListener("mousemove", drawCrosshair);

lineCanvas.addEventListener("mousedown", mouseDownFunction); //   on left click inside canvas execute mouseDownFunction

lineButton.addEventListener("click", function () {
    toggleButton("lineButton", buttonDictionary["lineButton"]);
});
deleteLineButton.addEventListener("click", function () {
    toggleButton("deleteLineButton", buttonDictionary["deleteLineButton"]);
});

canvasDiv.addEventListener("scroll", redrawGraphSection);

document.addEventListener("keydown", keyPress);
