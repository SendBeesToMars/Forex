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

lineContext.strokeStyle = "#72b914";
graphContext.strokeStyle = "#888888";
crosshairContext.strokeStyle = "rgba(0, 0, 200, 0.3)";

let signedIn = false;
let xPos;
let yPos;
let pressed = 0;
let lines = [];
let graphPoints = [];
let functions = {
    renderGraphSection: () => renderGraphSection(),
    renderLines: () => renderLines(),
    clearIndicators: () => clearIndicator(),
    autoScroll: () => autoScroll(),
    getOrders: () => getOrders()
};

let initalFunctionLength = Object.keys(functions).length;

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
            endXPos = event.clientX - rect.left;
            endYPos = event.clientY - rect.top;
        }
        lineContext.lineTo(endXPos, endYPos);
        lineContext.stroke();
    }
}

function drawCrosshair() {
    clearCrosshairCanvas();
    crosshairContext.font = "12px Arial";
    if(!isNaN(event.clientY )){
        xPosCrosshair = event.clientX - rect.left + canvasDiv.scrollLeft; // x and y cordinates of mouse on canvas
        yPosCrosshair = event.clientY - rect.top;
        crosshairX = Math.round((event.clientX - rect.left + canvasDiv.scrollLeft) / timeScale);
        crosshairY = Math.round((((event.clientY - rect.top - 20) / scalingFactor) + min ) * -100000) / 100000;
    }
    
    max = Number.MIN_SAFE_INTEGER;
    min = Number.MAX_SAFE_INTEGER;
    getMinMax();

    crosshairContext.fillText(`${min.toFixed(5)*-1}`, initialCanvasWidth - 45, 25); //max
    crosshairContext.fillText(`${max.toFixed(5)*-1}`, initialCanvasWidth - 45, graphCanvas.height - 20); // min
    crosshairContext.fillStyle = '#B3B4EB'; //#f50
    crosshairContext.fillRect(initialCanvasWidth - 45, event.clientY - rect.top - 8, 45, 15); //box around current y
    crosshairContext.fillRect(event.clientX -25, graphCanvas.height - 32, crosshairContext.measureText(crosshairX + currentScroll).width + 15, 15); //box around current x
    crosshairContext.fillStyle = "#000"
    crosshairContext.fillText(`${crosshairY}`, initialCanvasWidth - 45, event.clientY - rect.top + 4); // current y
    crosshairContext.fillText(`${Math.round(crosshairX + (currentScroll / timeScale))}`, event.clientX - 18, graphCanvas.height - 20); // current x

    crosshairContext.moveTo(0, yPosCrosshair); //  line start
    crosshairContext.lineTo(lineCanvas.width - 45, yPosCrosshair);
    crosshairContext.stroke();
    crosshairContext.moveTo(xPosCrosshair, 0);
    crosshairContext.lineTo(xPosCrosshair, lineCanvas.height);
    crosshairContext.stroke();
}

function renderLines() {
    clearLineCanvas();
    for (let i = 0; i <= lines.length - 1; i++) { // length starts from 1 not 0
        lineContext.beginPath();
        lineContext.moveTo(lines[i].start.x - ((currentScroll/timeScale) * timeScale), scaleLine(lines[i].start.y));
        lineContext.lineTo(lines[i].end.x - ((currentScroll/timeScale) * timeScale), scaleLine(lines[i].end.y));
        lineContext.stroke();
    }
}


function mouseDownFunction(event) {
    if((event.clientX != undefined) && (event.clientY != undefined)){ // checks if mouse coordniates are valid
        xPos = event.clientX - rect.left; // x and y cordinates of mouse on canvas
        yPos = event.clientY - rect.top;
    }
    if (buttonDictionary["lineButton"] && event.button == 0) { // if draw line button pressed, and if button pressed was left click
        pressed++;
        if (pressed == 1) { //  draws start of point
            lineObj.updateStart(xPos + currentScroll, (yPos - 20)/scalingFactor + min); // sets the start point in object
            lineContext.moveTo(xPos, yPos);
        } else if (pressed == 2) { //  sets the end of line, and pushes a clone of this point to lines array
            lineObj.updateEnd(xPos + currentScroll, (yPos - 20)/scalingFactor + min);
            lineContext.lineTo(xPos, yPos);
            lines.push(lineObj.clone());
            pressed = 0;
            renderLines();
        }
    } else if (buttonDictionary["deleteLineButton"] && event.button == 0) { // else if delete button pressed and using left click
        buttonDictionary["lineButton"] = false;
        deleteLine(xPos + currentScroll, yPos);
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

function autoScroll(){
    if((graphPoints.length * timeScale) - initialCanvasWidth/1.95 < currentScroll ){
        if((graphPoints.length * timeScale) - initialCanvasWidth/2 > 0){
            currentScroll = Math.round((graphPoints.length * timeScale) - initialCanvasWidth/2); // scrolls div to far right - window.scrollTo(x,y) 
        } 
    }
}

function renderGraphSection(){ // only draw the visable portion of the graph
    clearGraphCanvas();
    max = Number.MIN_SAFE_INTEGER;
    min = Number.MAX_SAFE_INTEGER;
    getMinMax();
    for (let i = Math.ceil(currentScroll / timeScale), j = 0; i < Math.ceil(currentScroll / timeScale) + (initialCanvasWidth / timeScale) && (j < initialCanvasWidth / timeScale); i++, j++) { // goes though all the points in the visable area
        if (graphPoints[i + 1] !== undefined) { // checks if i + 1 exists
            graphContext.lineWidth = lineWidth;
            graphContext.beginPath(); // needed to clear canvas if drawing lines
            graphContext.moveTo((j) * timeScale,
                getPriceForGraph(i));
            graphContext.lineTo((j + 1) * timeScale,
                getPriceForGraph(i + 1));
            graphContext.stroke();
        }
    }
}

function getMinMax(){
    for (let i = Math.ceil(currentScroll / timeScale); i < (currentScroll + initialCanvasWidth) / timeScale; i++) {
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
    indicatorContext.strokeStyle = colour;
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
    indicatorContext.strokeStyle = colour;
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
    for (let i = Math.ceil(currentScroll / timeScale), j = 0; i < Math.ceil(currentScroll / timeScale) + (initialCanvasWidth / timeScale) && (j < initialCanvasWidth / timeScale); i++, j++) { // goes though all the points in the visable area
        if (graphPoints[i + 1] !== undefined) { // checks if i + 1 exists
            indicatorContext.lineWidth = lineWidth;
            indicatorContext.beginPath(); // needed to clear canvas if drawing lines
            indicatorContext.moveTo((j) * timeScale,
                getScaledPrice(i, array));
            indicatorContext.lineTo((j + 1) * timeScale,
                getScaledPrice(i + 1, array));
            indicatorContext.stroke();
        }
    }
}

function renderAll(){
    for(let i = 0; i < Object.keys(functions).length; i++){
        functions[Object.keys(functions)[i]]();
    }
    if(graphPoints.length > 1){
        for(let i = 0; i < 2; i++){
            document.getElementsByClassName("posBtns")[i].style.display = "inline";
        }
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

lineCanvas.addEventListener("mousemove", drawLine); //   on mouse move inside canvas execute drawLine
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
    drawCrosshair();
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

    
let modal = document.getElementById("myModal");
let modalText = document.getElementById("modalText");
let span = document.getElementsByClassName("close")[0];
let contextMenu = document.getElementById("contextMenu");
let dropdownContent = document.getElementById("dropdownContent");

window.onclick = () => {
    if(event.target == modal){
        closeModal();
    }
    contextMenu.style.display = "none";
    menuState = 0;
}

span.onclick = () => {
    closeModal();
}

document.getElementById("modalIndicatorCancel").onclick = () => {
    closeModal();
};

function closeModal(){
    modal.style.display = "none";
    modalText.classList.remove("sma");
    modalText.classList.remove("ema");
    modalText.classList.remove("bbands");
    document.getElementById("sdevDiv").style.display = "none";
    document.getElementById("modalLogin").style.display = "none";

    dropdownContent.innerHTML = ""; // clears the anchors so they dont stack
    for(let i = initalFunctionLength; i < Object.keys(functions).length; i++){
        dropdownContent.innerHTML += `<a class="dropdownContentAnchor" href="#">${Object.keys(functions)[i]}<span style="float:right">&times;</span></a>`;
    }
}

    /*********************************************************************************
    // Right click menu + Modal box
    /*********************************************************************************/

var menuState = 0;
canvasDiv.addEventListener("contextmenu", () => { // default right click menu listener
    event.preventDefault();
    toggleMenu();
    menuState = 0;
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

let smaAnchor = document.getElementById("sma");
let emaAnchor = document.getElementById("ema");
let bbandsAnchor = document.getElementById("bbands");
let selectedIndicator;

let modalOk = document.getElementById("modalOk");
let modalCancel = document.getElementById("modalCancel");
let periodPicker = document.getElementById("periodPicker");
let colourPicker = document.getElementById("colourPicker");
let sdevPicker = document.getElementById("sdevPicker");

smaAnchor.onclick = () => {
    modalText.innerHTML = "Simple Moving Average";
    periodPicker.value = 14;
    modal.style.display = "block";
    selectedIndicator = "sma";
}

emaAnchor.onclick = () => {
    modalText.innerHTML = "Exponential Moving Average";
    periodPicker.value = 30;
    modal.style.display = "block";
    selectedIndicator = "ema";
}

bbandsAnchor.onclick = () => {
    document.getElementById("sdevDiv").style.display = "block";
    periodPicker.value = 20;
    modalText.innerHTML = "Bollinger Bands";
    modal.style.display = "block";
    selectedIndicator = "bbands";
}

modalOk.onclick = () => {
    let period = parseInt(periodPicker.value);
    let colour = "#"+colourPicker.value;
    let standardDeviation = parseInt(sdevPicker.value);
    switch(selectedIndicator){
        case "sma":
            functions[`Simple Moving Average (${period})`] = () => renderSimpleMovingAverage(period, colour);
            break;
        case "ema":
            functions[`Exponential Moving Average (${period})`] = () => renderExponentialMovingAverage(period, colour);
            break;
        case "bbands":
            functions[`Bollinger Bands (${period}, ${standardDeviation})`] = () => renderBollingerBands(period, standardDeviation, colour);
            break;
        default:
            break;
    }
    closeModal();
    renderAll();
    getIndicatorOnclick();
}

let functionsList = document.getElementById("functionsList");

modalCancel.onclick = () => {
    closeModal();

    for(let i = 3; i < Object.keys(functions).length; i++){
        console.log(Object.keys(functions)[i]);
    }
}

    /*********************************************************************************
    // Indicator dropwdon - deletion
    /*********************************************************************************/

let dropdownContentAnchor = document.getElementsByClassName("dropdownContentAnchor");

function getIndicatorOnclick(){
    for(let i = 0; i < dropdownContentAnchor.length; i++){
        dropdownContentAnchor[i].onclick = () => {
            slice = dropdownContentAnchor[i].innerText.slice(0, -1); // removes the x symbol
            delete functions[slice];    // removes key-value pair in functions of selected indicator
            dropdownContent.removeChild(dropdownContentAnchor[i]);
        }
    }
    renderAll();
}

/*********************************************************************************
// Mouse click/drag scrolling
/*********************************************************************************/
let isDown = false;
let scrollLeft = 0;
let currentScroll = 0;
let startX;

canvasDiv.onmousedown = () => {
    startX = event.clientX - rect.left;
    scrollLeft = currentScroll;
    isDown = true;
}

canvasDiv.onmouseleave = () => {
    isDown = false;
}

canvasDiv.onmouseup = () => {
    isDown = false;
}

canvasDiv.onmousemove = () => {
    event.preventDefault();
    if(!isDown) return;
    const x = event.clientX - rect.left;
    const walk = x - startX;
    if(scrollLeft - walk >= 0 && scrollLeft - walk < (graphPoints.length * timeScale) - initialCanvasWidth/2 ){
        currentScroll = scrollLeft - walk;   
    }
    renderAll();
    drawCrosshair();
}

/*********************************************************************************
// Resize canvas to div
/*********************************************************************************/

let firstPoint = 0;

window.onresize = () => { resize(); }
function resize(){
    graphCanvas.width = canvasDiv.offsetWidth - 2;
    lineCanvas.width = canvasDiv.offsetWidth - 2;
    crosshairCanvas.width = canvasDiv.offsetWidth - 2;
    indicatorCanvas.width = canvasDiv.offsetWidth - 2;
    initialCanvasWidth = canvasDiv.offsetWidth - 2;
    renderLines();
    renderAll();
}
resize();


/*********************************************************************************
// Login
/*********************************************************************************/

let loginButton = document.getElementById("loginButton");
let loginForm = document.getElementById("modalLoginForm");
let userName;

loginForm.onsubmit = ()=> {
    event.preventDefault();
    userName = loginForm.elements[0].value;
    document.title = `Trading Demo - USER: ${userName}`;

    signedIn = true;
    
    doSend(`username:${userName}`);
    document.getElementById("login").style.display = "none";
    document.getElementById("modalLogin").style.display = "none";
}

/*********************************************************************************
// Zoom
/*********************************************************************************/

canvasDiv.onwheel = () => {
    let delta = Math.sign(event.deltaY);
    if(delta == 1 && timeScale >= 2){
        timeScale -= 1;
    }
    else{
        timeScale += 1;
    }
    renderAll();
}

/*********************************************************************************
// Orders list
/*********************************************************************************/


function getOrders(){
    let netGain = [];
    let orders = document.getElementById("ordersList");
    orders.innerHTML = "";
    orders.innerHTML += `<li>Order Price&emsp; Order TimeStamp&emsp; Order Type&emsp; &emsp;Pips &emsp;&emsp;&emsp;P/L</li>`;
    for(let i =0; i < allOrders.length; i++){
        var orderCalc;
        var colour = "black";
        if(allOrders[i].type == "buy"){
            orderCalc = (priceDataArray[priceDataArray.length - 1] - allOrders[i].price).toFixed(6);
        }
        else{ 
            orderCalc = (allOrders[i].price - priceDataArray[priceDataArray.length - 1]).toFixed(6);
        }

        netGain[i] = parseFloat(((0.0001/priceDataArray[priceDataArray.length - 1]) * balance * (orderCalc * 1000)).toFixed(2));

        if(netGain[i] < 0){
            colour = "red";
        }
        else if(netGain[i] > 0){
            colour = "green";
        }
        else{
            colour = "black";
        }

        orders.innerHTML += `<li><a class="ordersAnchor" href="#">${allOrders[i].price}&emsp;&emsp;&emsp;&nbsp; ${allOrders[i].time}&emsp;&emsp; ${allOrders[i].type}&emsp; &emsp;&emsp;&emsp;&emsp;<span style="color: ${colour};">${(orderCalc * 1000).toFixed(3)}&emsp;&emsp;${netGain[i]}</span></a></li>`;
    }
    setOrders(netGain);
}


function setOrders(netGain){
    let ordersAnchor = document.getElementsByClassName("ordersAnchor");
    for(let i = 0; i < ordersAnchor.length; i++){
        ordersAnchor[i].onclick = () => {
            event.preventDefault();
            balance += netGain[i];
            allOrders.splice(i, 1);
            delete ordersAnchor[i];
            getOrders();
            document.getElementById("balance").innerHTML = "Balance: $" + balance.toFixed(2);
            if(signedIn)doSend(`balance:${balance.toFixed(2)}`);
        }
    }
}