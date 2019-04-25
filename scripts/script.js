
    var priceDataArray = new Array(); // creates array
    var priceDataTimeStamp = new Array();
    var orderPosition;
    var netPips;
    var netGain;
    var ballance = 1000;
    var orderType = "";
    var pairs;

    document.getElementById("ballance").innerHTML = "Ballance: $" + ballance;   // displays ballance

    const {
        remote
    } = require('electron');
    // gets and prints a variable from main.js
    document.write('<p>myvar: ' + remote.getGlobal('sharedObj').myvar + '</p>');


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
            // writeToScreen('<span style="color: blue;">RESPONSE: ' + evt.data + '</span>');
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
                else{
                    var unixTime = new Date();
                    graphObj.time = unixTime.getTime();
    
                    graphObj.price = parseFloat(evt.data, 10) * -1; // sets the price and inverts it for correct plotting
    
                    graphPoints.push(graphObj.clone());
    
                    priceDataArray.push(parseFloat(evt.data, 10)); //add to array
    
                    graphWidthAdjust();
                }
            }
        }

        if(document.getElementById("position").innerHTML != ""){    // calculates the pip difference when order is placed
            var orderCalc;
            var sellCalc = ((orderPosition - priceDataArray[priceDataArray.length - 1]).toFixed(6) * 10000);
            var buyCalc = ((priceDataArray[priceDataArray.length - 1] - orderPosition).toFixed(6) * 10000);
            if(orderType == "buy"){ orderCalc = buyCalc;}
            else if(orderType == "sell"){ orderCalc = sellCalc;}

            netPips = orderCalc;

            document.getElementById("pips").innerHTML = "Pips: " + orderCalc;
        }
    }

    function buy(){     // buy button function
        orderType = "buy";
        orderPosition = priceDataArray[priceDataArray.length - 1];
        document.getElementById("position").innerHTML = "Buy order at: " + orderPosition;
    }

    function sell(){    // sell button function
        orderType = "sell";
        orderPosition = priceDataArray[priceDataArray.length - 1];
        document.getElementById("position").innerHTML = "Buy order at: " + orderPosition;
    }

    function closePosition(){   // close position button function
        netGain = netPips * 100;
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
        ballance += netGain;
        document.getElementById("ballance").innerHTML = "Ballance: $" + ballance; // clears the position html field so it doesnt update.
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