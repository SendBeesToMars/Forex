var lineCanvas = document.getElementById("lineCanvas");
var lineContext = lineCanvas.getContext("2d");
var rect = lineCanvas.getBoundingClientRect();

var graphCanvas = document.getElementById("graphCanvas");
var graphContext = graphCanvas.getContext("2d");
var rect = graphCanvas.getBoundingClientRect();

var lineButton = document.getElementById("lineButton");
var deleteLineButton = document.getElementById("deleteLineButton");

var canvasDiv = document.getElementById("canvasDiv");

var xPos;
var yPos;
var pressed = 0;
var lines = [];
var lineButtonPressed = false;
var deleteLineButtonPressed = false;
var scalingFactor = 1000000;

var graphPoints = [];

function drawCanvas() {
    lineContext.fillStyle = "rgb(255, 0, 0)";
    lineContext.fillRect(0, 0, 150, 75);
}

function drawGraph() {
    graphContext.fillStyle = "rgb(255, 0, 0)";
    graphContext.fillRect(0, 0, 150, 75);
}

function drawLine() {
    if (pressed != 0) { // stops from drawing a line after two mouse presses
        lineContext.clearRect(0, 0, lineCanvas.width, lineCanvas.height); // clears canvas   
        lineContext.beginPath(); // needed to clear canvas if drawing lines
        lineContext.moveTo(xPos, yPos); //  line start
        endXPos = event.clientX - rect.left + canvasDiv.scrollLeft;
        endYPos = event.clientY - rect.top;
        lineContext.lineTo(endXPos, endYPos);
        lineContext.stroke();
        writeMessage();
    }
}

function drawAll() {
    for (var i = 0; i < lines.length; i++) {
        if (i == 0) {
            lineContext.clearRect(0, 0, lineCanvas.width, lineCanvas.height); // clears canvas 
            lineContext.beginPath(); // needed to clear canvas if drawing lines
        }
        lineContext.moveTo(lines[i].start.x, lines[i].start.y);
        lineContext.lineTo(lines[i].end.x, lines[i].end.y);
        lineContext.stroke();
    }
}

function writeMessage() {
    document.getElementById("coordinates").innerHTML =
        "Mouse Position: " +
        (event.clientX - rect.left + canvasDiv.scrollLeft) + ", " +
        (event.clientY - rect.top) +
        ", scroll pos: " + canvasDiv.scrollLeft;
}

function mouseDownFunction(event) {
    xPos = event.clientX - rect.left + canvasDiv.scrollLeft; // x and y cordinates of mouse on canvas
    yPos = event.clientY - rect.top;
    if (lineButtonPressed && event.button == 0) { // if line button pressed, and check if button pressed was left click
        pressed++;

        if (pressed == 1) { //  draws start of point
            lineObj.updateStart(xPos, yPos); // sets the start point in object
            lineContext.moveTo(xPos, yPos);
        } else if (pressed == 2) { //  draws a line from point start to mouse position
            lineObj.updateEnd(xPos, yPos);
            lineContext.lineTo(xPos, yPos);
            lines.push(lineObj.clone());
            pressed = 0;
            drawAll();
        }
    } else if (deleteLineButtonPressed && event.button == 0) {
        lineButtonPressed = false;
        deleteLine(xPos, yPos);
    }
}

function deleteLine(x, y) {

    for (var i = 0; i < lines.length; i++) {
        var mouseToLineEndLen = Math.hypot(x - lines[i].end.x, y - lines[i].end.y);

        var mouseToLineStartLen = Math.hypot(x - lines[i].start.x, y - lines[i].start.y);

        var lineLen = Math.hypot(lines[i].end.x - lines[i].start.x, lines[i].end.y - lines[i].start.y);

        if (mouseToLineEndLen + mouseToLineStartLen < lineLen + .8 &&
            mouseToLineEndLen + mouseToLineStartLen > lineLen - .8) {
            console.log("Mouse is on line: " + i);
            lines.splice(i, 1);
            console.log("Line: " + i + " deleted");
            drawAll();
        }
    }

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


function getMousePoint() {
    var unixTime = new Date();

    xPos = event.clientX - rect.left + canvasDiv.scrollLeft; // x and y cordinates of mouse on canvas
    yPos = event.clientY - rect.top;

    graphObj.price = xPos;

    graphObj.time = unixTime.getTime();

    graphPoints.push(graphObj.clone());

    console.log(graphPoints);

    plotGraphMouse();
}

function plotGraphMouse() {
    for (var i = 1; i < graphPoints.length; i++) {
        if (i >= 1) {
            graphContext.beginPath(); // needed to clear canvas if drawing lines

            graphContext.moveTo(graphPoints[i - 1].point.x, graphPoints[i - 1].point.y);
            graphContext.lineTo(graphPoints[i].point.x, graphPoints[i].point.y);
            graphContext.stroke();
        }
    }
}

function plotGraph() {
    var baseTime = Math.floor(graphPoints[0].time / 1000);
    var basePrice = graphPoints[0].price;
    for (var i = 1; i < graphPoints.length; i++) {
        if (i >= 1) {
            graphContext.beginPath(); // needed to clear canvas if drawing lines

            //            graphContext.moveTo((Math.floor(graphPoints[i - 1].time / 1000) - baseTime) * 5, graphPoints[i - 1].price * 20);
            //            graphContext.lineTo((Math.floor(graphPoints[i].time / 1000) - baseTime) * 5, graphPoints[i].price * 20);
            graphContext.moveTo((Math.floor(graphPoints[i - 1].time / 1000) - baseTime) * 5,
                getPriceForGraph(i - 1));
            graphContext.lineTo((Math.floor(graphPoints[i].time / 1000) - baseTime) * 5,
                getPriceForGraph(i));
            graphContext.stroke();

            console.log(getPriceForGraph(i));
        }
    }
}

function getPriceForGraph(i) {
    var basePrice = graphPoints[0].price;
    movementCalc = ((((graphPoints[i].price - basePrice) * scalingFactor) + (100)).toFixed(6));
    if (movementCalc > 180 || movementCalc < 20) {
        graphContext.scale(1, .8);
        // ToDo: *******************************************************************************************************************
        // scaling works, but needs to reposition graph to middle of canvas
        // fix line thickness when scaled down
        // fix movement calc > and < when scaled down ( multiply values by 1.2 ? if scale down factor is .8)
    }
    return movementCalc;
}


function scrollPosition(event) {
    console.log("scrolled: " + lineCanvas.scrollLeft);
    document.getElementById("scrollPos").innerHTML = "hello there";
}

function lineButtonFunction() {
    if (lineButtonPressed) {
        lineButtonPressed = false;
        document.getElementById("lineButton").classList.remove("lineButtonOn");
        document.getElementById("lineButton").classList.add("lineButtonOff");
    } else {
        lineButtonPressed = true;
        document.getElementById("lineButton").classList.remove("lineButtonOff");
        document.getElementById("lineButton").classList.add("lineButtonOn");
    }
}

function deleteLineButtonFunction() {
    if (deleteLineButtonPressed) {
        deleteLineButtonPressed = false;
        document.getElementById("deleteLineButton").classList.remove("lineButtonOn");
        document.getElementById("deleteLineButton").classList.add("lineButtonOff");
    } else {
        deleteLineButtonPressed = true;
        document.getElementById("deleteLineButton").classList.remove("lineButtonOff");
        document.getElementById("deleteLineButton").classList.add("lineButtonOn");
    }
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
        lineContext.clearRect(0, 0, lineCanvas.width, lineCanvas.height); // clears canvas 
        lineContext.beginPath(); // needed to clear canvas if drawing lines
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
}, false)


lineCanvas.addEventListener("mousemove", drawLine); //   on mouse move inside canvas execute writeMessage

lineCanvas.addEventListener("mousedown", mouseDownFunction); //   on left click inside canvas execute mouseDownFunction

lineButton.addEventListener("click", lineButtonFunction);
deleteLineButton.addEventListener("click", deleteLineButtonFunction);

document.addEventListener("keydown", keyPress);

//lineCanvas.addEventListener("mousedown", getMousePoint);
