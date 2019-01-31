var canvas = document.getElementById("myCanvas");
var canvas2 = document.getElementById("myCanvas2");

var ctx = canvas.getContext("2d");
var ctx2 = canvas2.getContext("2d");
var rect = canvas.getBoundingClientRect();
var xPos;
var yPos;
var pressed = 0;
var lines = [];
var line = [];

function drawCanvas() {
    ctx.fillStyle = "rgb(255, 0, 0)";
    ctx.fillRect(0, 0, 150, 75);
    ctx2.fillStyle = "rgb(255, 0, 0)";
    ctx2.fillRect(0, 0, 150, 75);
}


function drawLine() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // clears canvas   
    ctx.beginPath(); // needed to clear canvas if drawing lines
    ctx.moveTo(xPos, yPos); //  line start
    endXPos = event.clientX - rect.left;
    endYPos = event.clientY - rect.top;
    ctx.lineTo(endXPos, endYPos);
    ctx.stroke();
    writeMessage();
}

function drawPermanent() {
    for (var ls = 0; ls < lines.length; ls++) {
        ctx2.moveTo(lines[ls].start.x, lines[ls].start.y);
        ctx2.lineTo(lines[ls].end.x, lines[ls].end.y);
        ctx2.stroke();
    }
    //    ctx2.moveTo(0, 0); //  line start
    //    ctx2.lineTo(200, 100);
    //    ctx2.stroke();
}

function writeMessage() {
    document.getElementById("coordinates").innerHTML = "Mouse Position: " + (event.clientX - rect.left) + ", " + (event.clientY - rect.top);
}

function mouseDownFunction(event) {
    pressed++;
    xPos = event.clientX - rect.left; //set start position of line
    yPos = event.clientY - rect.top;
    if (pressed == 1) {
        lineObj.start.x = xPos;
        lineObj.start.y = yPos;
        ctx.moveTo(xPos, yPos);
        //line.push([xPos, yPos]);
    } else if (pressed == 2) {
        lineObj.end.x = xPos;
        lineObj.end.y = yPos;
        ctx.lineTo(xPos, yPos)
        //line.push([xPos, yPos]);
        //lines.push(line);
        //line = [];
        lines.push(lineObj);
        pressed = 0;
        drawPermanent();
        console.log(lineObj);
    }
}

var lineObj = new Object();
lineObj = {
    start: {
        x: xPos,
        y: yPos
    },
    end: {
        x: xPos,
        y: yPos
    }
}


canvas.addEventListener("mousemove", drawLine) //   on mouse move inside canvas execute writeMessage

canvas.addEventListener("mousedown", mouseDownFunction) //   on left click inside canvas execute setLineStart
