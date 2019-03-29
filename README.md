ToDo:
Account overview -> user orders history stored in database. Graph Profit/Loss over time. Graph sucessfull trades vs unsucesfull trades

```
function clearLineCanvas() {
    lineContext.clearRect(0, 0, lineCanvas.width, lineCanvas.height); // clears canvas   
    lineContext.beginPath(); // needed to clear canvas if drawing lines
}

function clearGraphCanvas() {
    graphContext.clearRect(0, 0, graphContext.canvas.width, graphContext.canvas.height); // clears canvas 
    graphContext.beginPath(); // needed to clear canvas if drawing lines
}

function clearCrosshairCanvas() {
    crosshairContext.clearRect(0, 0, crosshairContext.canvas.width, crosshairContext.canvas.height); // clears canvas 
    crosshairContext.beginPath(); // needed to clear canvas if drawing lines
}
```
Note the canvas.width and .width
???
