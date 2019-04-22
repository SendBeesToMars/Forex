let lineCanvas = document.getElementById("lineCanvas");
let lineContext = lineCanvas.getContext("2d");
let rect = lineCanvas.getBoundingClientRect();

let graphCanvas = document.getElementById("graphCanvas");
let graphContext = graphCanvas.getContext("2d");
let graphRect = graphCanvas.getBoundingClientRect();

let indicatorCanvas = document.getElementById("indicatorCanvas");
let indicatorContext = indicatorCanvas.getContext("2d");

let crosshairCanvas = document.getElementById("crosshairCanvas");
let crosshairContext = crosshairCanvas.getContext("2d");

let lineButton = document.getElementById("lineButton");
let deleteLineButton = document.getElementById("deleteLineButton");

let canvasDiv = document.getElementById("canvasDiv");
let pairForm = document.getElementById("pairForm");

let modal = document.getElementById("myModal");
let span = document.getElementsByClassName("close")[0];

let contextMenu = document.getElementById("contextMenu");

lineContext.strokeStyle = "#72b914";
graphContext.strokeStyle = "#888888";
crosshairContext.strokeStyle = "rgba(0, 0, 200, 0.3)";

let colour1 = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
let colour2 = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
let colour3 = '#'+(Math.random()*0xFFFFFF<<0).toString(16);

let xPos;
let yPos;
let pressed = 0;
let lines = [];
let graphPoints = [];
let functions = {
    renderGraphSection: () => renderGraphSection(),
    renderLines: () => renderLines(),
    clearIndicators: () => clearIndicator(),
    sma1: () => renderSimpleMovingAverage(20, colour3),
    sma2: () => renderSimpleMovingAverage(5, colour2),
    ema1: () => renderExponentialMovingAverage(20, colour1),
    ema2: () => renderExponentialMovingAverage(10, colour2),
    bollinger1: () => renderBollingerBands(20, 2, colour3)
};

let lineButtonPressed = false;
let deleteLineButtonPressed = false;
let buttonDictionary = {
    "lineButton": lineButtonPressed,
    "deleteLineButton": deleteLineButtonPressed
};
let scalingFactor = 0;
const frameSizeMax = 180;
const frameSizeMin = 20;
const halfCanvasHeight = graphCanvas.height / 2;
const lineWidth = 1;
let max = Number.MIN_SAFE_INTEGER;
let min = Number.MAX_SAFE_INTEGER;
let scaledPrice = 0;
let timeScale = 10;
let initialCanvasWidth = graphCanvas.width;


function drawLineRect() { // draws rectangle on canvas - not used
    lineContext.fillStyle = "rgba(0, 0, 200, 0.5)";
    lineContext.fillRect(0, 0, 150, 75);
}

function drawGraphRect() {
    indicatorContext.beginPath();
    indicatorContext.moveTo(75, 50);
    indicatorContext.lineTo(100, 75);
    indicatorContext.lineTo(100, 25);
    indicatorContext.fill();
}

function drawLine() {
    if (pressed != 0) { // stops from drawing a line after two mouse presses
        renderLines();
        lineContext.moveTo(xPos, yPos); //  line start
        if((event.clientX != undefined) && (event.clientY != undefined)){ // checks if mouse coordniates are valid
            endXPos = event.clientX - rect.left + canvasDiv.scrollLeft;
            endYPos = event.clientY - rect.top;
        }
        lineContext.lineTo(endXPos, endYPos);
        lineContext.stroke();
        writeMessage();
    }
}

function drawCrosshair() {
    let xPosCrosshair;
    let yPosCrosshair;
    if((event.clientX != undefined) && (event.clientY != undefined)){ // checks if mouse coordniates are valid
        xPosCrosshair = event.clientX - rect.left + canvasDiv.scrollLeft; // x and y cordinates of mouse on canvas
        yPosCrosshair = event.clientY - rect.top;
    }
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

function renderLines() {
    clearLineCanvas();
    for (let i = 0; i <= lines.length - 1; i++) { // length starts from 1 not 0
        lineContext.beginPath();
        lineContext.moveTo(lines[i].start.x, scaleLine(lines[i].start.y));
        lineContext.lineTo(lines[i].end.x, scaleLine(lines[i].end.y));
        lineContext.stroke();
    }
}

function writeMessage() { // changes id=coordinates text to the mouse position on the canvas 
    document.getElementById("coordinates").innerHTML =
        "Mouse Position: " +
        (event.clientX - rect.left + canvasDiv.scrollLeft) + ", " +
        (event.clientY - rect.top) +
        ", scroll pos: " + canvasDiv.scrollLeft;
}

function mouseDownFunction(event) {
    if((event.clientX != undefined) && (event.clientY != undefined)){ // checks if mouse coordniates are valid
        xPos = event.clientX - rect.left + canvasDiv.scrollLeft; // x and y cordinates of mouse on canvas
        yPos = event.clientY - rect.top;
    }
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
            renderLines();
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

function clearIndicator() {
    indicatorContext.clearRect(0, 0, crosshairContext.canvas.width, crosshairContext.canvas.height); // clears canvas 
    indicatorContext.beginPath(); // needed to clear canvas if drawing lines
}

function deleteLine(x, y) { // deletes manual drawn line(s) under x and y coordinates on canvas
    for (let i = 0; i < lines.length; i++) { // loops through every line in the array
        // var mouseToLineEndLen = Math.hypot(x - lines[i].end.x, y - lines[i].end.y); // gets distance from x/y to line end 
        let mouseToLineEndLen = Math.hypot(x - lines[i].end.x, y - scaleLine(lines[i].end.y)); // gets distance from x/y to line end 

        let mouseToLineStartLen = Math.hypot(x - lines[i].start.x, y - scaleLine(lines[i].start.y)); // gets distance from x/y to line start

        let lineLen = Math.hypot(lines[i].end.x - lines[i].start.x, scaleLine(lines[i].end.y) - scaleLine(lines[i].start.y)); // gets line length

        if (mouseToLineEndLen + mouseToLineStartLen < lineLen + .8 && // checks if distance of (x/y + start) + (x/y + end) is less than line length + proximity of .8
            mouseToLineEndLen + mouseToLineStartLen > lineLen - .8) { // checks if distance of (x/y + start) + (x/y + end) is greater than line length - proximity of .8
            lines.splice(i, 1); // removes the line from array
            renderLines();  // redraws all the lines in the array
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
        let clone = new LineObject(this.start.x, this.start.y);
        clone.updateEnd(this.end.x, this.end.y);
        return clone;
    }
}

let lineObj = new LineObject();

function GraphObject(price, time) {
    this.price = price;
    this.time = time;
}

GraphObject.prototype = {
    clone: function () {
        let clone = new GraphObject(this.price, this.time)
        return clone;
    }
}

let graphObj = new GraphObject();

// FIXME: there is a maximum width a canvas can have. express window seems to have a max canvasDiv.scrollLeft of 32,767 https://stackoverflow.com/questions/6081483/maximum-size-of-a-canvas-element
function graphWidthAdjust() {
    if((timeScale * graphPoints.length) > initialCanvasWidth/2) {    // checks if graph has reached center of canvas
        graphCanvas.width += timeScale;
        lineCanvas.width += timeScale;
        crosshairCanvas.width += timeScale;
        indicatorCanvas.width += timeScale;
        drawCrosshair();
        renderLines();
        if(initialCanvasWidth + canvasDiv.scrollLeft >= graphCanvas.width - timeScale){ // checks if scroll position is far right
            canvasDiv.scrollTo(initialCanvasWidth + canvasDiv.scrollLeft, 0); // scrolls div to far right - window.scrollTo(x,y) 
        } 
    }
    renderAll();
}

function renderGraphSection(){ // only draw the visable portion of the graph
    clearGraphCanvas();
    max = Number.MIN_SAFE_INTEGER;
    min = Number.MAX_SAFE_INTEGER;
    getMinMax();
    for (let i = Math.ceil(canvasDiv.scrollLeft / timeScale); i < (canvasDiv.scrollLeft + initialCanvasWidth) / timeScale; i++) { // goes though all the points in the visable area
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

function getMinMax(){
    for (let i = Math.ceil(canvasDiv.scrollLeft / timeScale); i < (canvasDiv.scrollLeft + initialCanvasWidth) / timeScale; i++) {
        if (graphPoints[i + 1] !== undefined) { // checks if i + 1 exists
            if (graphPoints[i].price > max) { // gets min and max using current price
                max = graphPoints[i].price
            }
            if (graphPoints[i].price < min) {
                min = graphPoints[i].price
            }
        }
    }
}

function getPriceForGraph(i) {
    scalingFactor = ((graphCanvas.height) - 45) / (max - min); //  (canvas.max(200) - margin from the bottom) - canvas.min(0) / (price.max - price.min) = scaling factor
    scaledPrice = ((graphPoints[i].price - min) * scalingFactor) + frameSizeMin; // gets current price - minimum, then scales it to the canvas size. + adds 20 as a margin from the top

    return scaledPrice;
}

function getScaledPrice(i, price) {
    scalingFactor = ((graphCanvas.height) - 45) / (max - min); //  (canvas.max(200) - margin from the bottom) - canvas.min(0) / (price.max - price.min) = scaling factor
    scaledPrice = ((price[i] - min) * scalingFactor) + frameSizeMin; // gets current price - minimum, then scales it to the canvas size. + adds 20 as a margin from the top

    return scaledPrice;
}

function renderSimpleMovingAverage(sampleSize, colour){
    
    indicatorContext.strokeStyle = colour;

    let sma = getSma(sampleSize);
    
    renderArray(sma);
}

function getSma(sampleSize){
    let sum;
    let sma = [];
    sma.length = sampleSize;
    for (let i = 0; i <graphPoints.length; i++) {
        sum = 0;
        if (graphPoints[i -(sampleSize - 1)] !== undefined && graphPoints[i] !== undefined) { // checks if graph point exists exists
            for(let j = i; j > i - sampleSize; j--){
                sum += graphPoints[j].price;
            }
            sma.push(sum/sampleSize);
        }
    }
    return sma;
}

function renderExponentialMovingAverage(sampleSize, colour){
    indicatorContext.strokeStyle = colour; // "#9494FF"  gets random colour
    let ema = [];
    let sma = getSma(sampleSize);
    let average;
    let multiplier = 2 / (sampleSize + 1);
    ema.length = sampleSize;

    for (let i = 0; i <graphPoints.length; i++) {
        if (graphPoints[i - sampleSize] !== undefined && graphPoints[i] !== undefined) { // checks if graph point exists exists
            if(sampleSize == i){
                ema[i - 1] = sma[i];
            }
            average = (graphPoints[i].price - ema[i - 1]) * multiplier + ema[i - 1];
            ema.push(average);
        }
    }

    renderArray(ema);
}

function renderBollingerBands(sampleSize, standardDeviationMultiplier, colour){
    indicatorContext.strokeStyle = colour; // "#9494FF"  gets random colour
    upperBand = [];
    lowerBand = [];
    upperBand.length = sampleSize;
    lowerBand.length = sampleSize;
    let sma = getSma(sampleSize);
    let sum = 0;
    let standardDeviation;

    for (let i = 0; i <graphPoints.length; i++) {
        if (graphPoints[i -(sampleSize - 1)] !== undefined && graphPoints[i] !== undefined && sma[i] !== undefined) { // checks if graph point exists exists
            sum = 0;
            for(let j = i; j > i - sampleSize; j--){
                sum += Math.pow(graphPoints[j].price - sma[i],2) ;
            }
            standardDeviation = Math.sqrt(sum / (sampleSize - 1));
            upperBand.push(sma[i] + (standardDeviation * standardDeviationMultiplier));
            lowerBand.push(sma[i] - (standardDeviation * standardDeviationMultiplier));
        }
    }

    renderArray(upperBand);
    renderArray(lowerBand);

}

function renderArray(array){
    for (let i = Math.ceil(canvasDiv.scrollLeft / timeScale); i < (canvasDiv.scrollLeft + initialCanvasWidth) / timeScale; i++) { // goes though all the points in the visable area
        if (graphPoints[i + 1] !== undefined) { // checks if i + 1 exists
            indicatorContext.lineWidth = lineWidth;
            indicatorContext.beginPath(); // needed to clear canvas if drawing lines
            indicatorContext.moveTo((i) * timeScale,
                getScaledPrice(i, array));
            indicatorContext.lineTo((i + 1) * timeScale,
                getScaledPrice(i + 1, array));
            indicatorContext.stroke();
        }
    }
}

function renderAll(){
    for(let i = 0; i < Object.keys(functions).length; i++){
        functions[Object.keys(functions)[i]]();
    }
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
    let isEscape = false;
    if ("key" in evt) {
        isEscape = (evt.key === "Escape" || evt.key === "Esc");
    } else {
        isEscape = (evt.keyCode === 27);
    }

    if (isEscape) {
        pressed = 0;
        renderLines();

        contextMenu.style.display = "none";
        menuState = 0;
    }
};

lineCanvas.addEventListener("mousemove", drawLine); //   on mouse move inside canvas execute writeMessage
lineCanvas.addEventListener("mousemove", drawCrosshair);

lineCanvas.addEventListener("mousedown", mouseDownFunction); //   on left click inside canvas execute mouseDownFunction

lineButton.addEventListener("click", function () {
    toggleButton("lineButton", buttonDictionary["lineButton"]);
});
deleteLineButton.addEventListener("click", function () {
    toggleButton("deleteLineButton", buttonDictionary["deleteLineButton"]);
});

canvasDiv.addEventListener("scroll", function(){
    renderAll();
});

document.addEventListener("keydown", keyPress);

pairForm.onsubmit = function(event){
    for(const prop of Object.keys(lines)){
        delete lines[prop];
    }
    for(const prop of Object.keys(graphPoints)){
        delete graphPoints[prop];
    }
    lines = [];
    graphPoints = [];
    clearGraphCanvas();
    graphCanvas.width = initialCanvasWidth;
    lineCanvas.width = initialCanvasWidth;
    crosshairCanvas.width = initialCanvasWidth;
    event.preventDefault();
    doSend(document.getElementById("pair").value);
};


    /*********************************************************************************
    // Modal box
    /*********************************************************************************/

indicatorForm.onsubmit = function(event){
    event.preventDefault();
    modal.style.display = "block";
}

window.onclick = () => {
    if(event.target == modal){
        modal.style.display = "none";
    }
    contextMenu.style.display = "none";
    menuState = 0;
}

span.onclick = () => {
    modal.style.display = "none";
}

    /*********************************************************************************
    // Right click menu
    /*********************************************************************************/

var menuState = 0;
canvasDiv.addEventListener("contextmenu", () => {
    event.preventDefault();
    toggleMenu();
});

function toggleMenu(){
    if(menuState !== 1){
        menuState = 1;
        contextMenu.style.display = "block";
        contextMenu.style.left = getMouseCoords().x + "px";
        contextMenu.style.top = getMouseCoords().y + "px";
    }
}

function getMouseCoords(){
    if((event.clientX != undefined) && (event.clientY != undefined)){ // checks if mouse coordniates are valid
        xPos = event.clientX - rect.left; // x and y cordinates of mouse on canvas
        yPos = event.clientY - rect.top;
    }
    return{
        x: xPos,
        y: yPos
    }
}