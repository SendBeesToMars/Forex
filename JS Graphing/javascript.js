var canvas = document.getElementById("myCanvas");
var canvas2 = document.getElementById("myCanvas2");
var lineButton = document.getElementById("lineButton");


var ctx = canvas.getContext("2d");
var ctx2 = canvas2.getContext("2d");
var rect = canvas.getBoundingClientRect();
var xPos;
var yPos;
var pressed = 0;
var lines = [];
var lineButtonPressed = false;

function drawCanvas() {
    it
    ctx.fillStyle = "rgb(255, 0, 0)";
    ctx.fillRect(0, 0, 150, 75);
    ctx2.fillStyle = "rgb(255, 0, 0)";
    ctx2.fillRect(0, 0, 150, 75);
}


function drawLine() {
    if (pressed != 0) { // stops from drawing a line after two mouse presses
        ctx.clearRect(0, 0, canvas.width, canvas.height); // clears canvas   
        ctx.beginPath(); // needed to clear canvas if drawing lines
        ctx.moveTo(xPos, yPos); //  line start
        endXPos = event.clientX - rect.left;
        endYPos = event.clientY - rect.top;
        ctx.lineTo(endXPos, endYPos);
        ctx.stroke();
        writeMessage();
    }
}

function drawAll() {
    for (var i = 0; i < lines.length; i++) {
        if (i == 0) {
            console.log("clear");
            ctx2.clearRect(0, 0, canvas.width, canvas.height); // clears canvas 
        }
        ctx2.beginPath(); // needed to clear canvas if drawing lines
        ctx2.moveTo(lines[i].start.x, lines[i].start.y);
        ctx2.lineTo(lines[i].end.x, lines[i].end.y);
        ctx2.stroke();
    }
}

function writeMessage() {
    document.getElementById("coordinates").innerHTML =
        "Mouse Position: " +
        (event.clientX - rect.left) + ", " +
        (event.clientY - rect.top);
}

function mouseDownFunction(event) {
    if (lineButtonPressed) {
        pressed++;
        xPos = event.clientX - rect.left; // x and y cordinates of mouse on canvas
        yPos = event.clientY - rect.top;
        if (pressed == 1) { //  draws start of point
            lineObj.reset(xPos, yPos);
            ctx.moveTo(xPos, yPos);
        } else if (pressed == 2) { //  draws a line from point start to mouse position
            lineObj.updateStart(xPos, yPos);
            ctx.lineTo(xPos, yPos)
            lines.push(lineObj.clone());
            pressed = 0;
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

function lineButtonFunction() {
    if (lineButtonPressed) {
        lineButtonPressed = false;
        document.getElementById("lineButton").innerHTML = "Draw Line";
        document.getElementById("lineButton").classList.remove("lineButtonOn");
        document.getElementById("lineButton").classList.add("lineButtonOff");
    } else {
        lineButtonPressed = true;
        document.getElementById("lineButton").innerHTML = "Draw Line";
        document.getElementById("lineButton").classList.remove("lineButtonOff");
        document.getElementById("lineButton").classList.add("lineButtonOn");
    }
}


canvas.addEventListener("mousemove", drawLine); //   on mouse move inside canvas execute writeMessage

canvas.addEventListener("mousedown", mouseDownFunction); //   on left click inside canvas execute setLineStart

lineButton.addEventListener("click", lineButtonFunction);
