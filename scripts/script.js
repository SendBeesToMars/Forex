
    var priceDataArray = new Array(); // creates array
    var priceDataTimeStamp = new Array();
    var orderPosition;
    var netPips;
    var netGain;
    var balance = 1000;
    var orderType = "";
    var pairs;

    document.getElementById("balance").innerHTML = "Balance: $" + balance;   // displays balance

    const {
        remote
    } = require('electron');

    // Websockets server URI
    var wsUri = "ws://localhost:42069";
    var output;

    function init() {
        output = document.getElementById("output");
        testWebSocket();
    }

    function testWebSocket() {
        websocket = new WebSocket(wsUri);
        websocket.onopen = function (evt) {
            onOpen(evt);
        };
        websocket.onclose = function (evt) {
            onClose(evt);
        };
        websocket.onmessage = function (evt) {
            onMessage(evt);
        };
        websocket.onerror = function (evt) {
            onError(evt);
        };
    }

    function onOpen(evt) {
        console.log("CONNECTED");
        // doSend("WebSocket rocks");
        // writeToScreen(websocket.readyState);
    }

    function onClose(evt) {
        console.log("DISCONNECTED");
    }

    function onMessage(evt) {
        if (evt.data != "") {
            var date = new Date();
            priceDataTimeStamp.push(date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds());
            if (evt.data != ""){
                if(evt.data[0] == "[" ){
                    pairs = evt.data.replace(/'/g, '"');
                    pairs = JSON.parse(pairs);
                    var allPairs = [];
                    for (var i = 0; i < pairs.length; i++){
                         allPairs.push("<option value = '" + pairs[i] + "'>");
                    }
                    document.getElementById("pairs").innerHTML = allPairs.join(""); // join removes , between pairs
                }
                if(evt.data.includes("balance:")){
                    balance = parseFloat(evt.data.split(":")[1]);
                    document.getElementById("balance").innerHTML = "Balance: $" + balance.toFixed(2);
                }
                else{
                    var unixTime = new Date();
                    graphObj.time = unixTime.getTime();
    
                    graphObj.price = parseFloat(evt.data, 10) * -1; // sets the price and inverts it for correct plotting
    
                    graphPoints.push(graphObj.clone());
    
                    priceDataArray.push(parseFloat(evt.data, 10)); //add to array

                    renderAll();
                }
            }
        }

        if(document.getElementById("position").innerHTML != ""){    // calculates the pip difference when order is placed
            var orderCalc;
            var sellCalc = (orderPosition - priceDataArray[priceDataArray.length - 1]).toFixed(6);
            var buyCalc = (priceDataArray[priceDataArray.length - 1] - orderPosition).toFixed(6);
            if(orderType == "buy"){ orderCalc = buyCalc;}
            else if(orderType == "sell"){ orderCalc = sellCalc;}

            netPips = orderCalc;

            document.getElementById("pips").innerHTML = "Pips: " + orderCalc;
        }
    }

    let order = false;
    function buy(){     // buy button function
        if(!order){
            order = true;
            orderType = "buy";
            orderPosition = priceDataArray[priceDataArray.length - 1];
            document.getElementById("position").innerHTML = "Buy order at: " + orderPosition.toFixed(5);
        }
        else{
            alert("close position to open a new order");
        }
    }

    function sell(){    // sell button function
        if(!order){
            order = true;
            orderType = "sell";
            orderPosition = priceDataArray[priceDataArray.length - 1];
            document.getElementById("position").innerHTML = "Buy order at: " + orderPosition.toFixed(5);
        }
        else
            alert("close position to open a new order");
    }

    function closePosition(){   // close position button function
        order = false;
        netGain = Math.round((netPips * 100) * 100) / 100;
        document.getElementById("position").innerHTML = ""; // clears the position html field so it doesnt update.
        if(netGain < 0){
            document.getElementById("netGain").innerHTML = '<span style="color: red;"> Net Profit/Loss: $' + netGain + "</span>"; // clears the position html field so it doesnt update.
        }
        else if(netGain > 0){
            document.getElementById("netGain").innerHTML = '<span style="color: green;"> Net Profit/Loss: $' + netGain + "</span>"; // clears the position html field so it doesnt update.
        }
        else{
            document.getElementById("netGain").innerHTML = "Net Profit/Loss: $" + netGain; // clears the position html field so it doesnt update.
        }
        balance += netGain;
        document.getElementById("balance").innerHTML = "Balance: $" + balance.toFixed(2); // clears the position html field so it doesnt update.
        
        doSend(`balance:${balance.toFixed(2)}`);
    }

    function onError(evt) {
        alert('<span style="color: red;">ERROR:</span> ' + evt.data);
    }

    function doSend(message) {
        // writeToScreen("SENT: " + message);
        console.log("SENT: " + message);
        websocket.send(message);
    }

    function writeToScreen(message) {
        var pre = document.createElement("p");
        pre.style.wordWrap = "break-word";
        pre.innerHTML = message;
        output.appendChild(pre);
    }

    window.addEventListener("load", init, false);