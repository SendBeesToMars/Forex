
    var priceDataArray = new Array(); // creates array
    var priceDataTimeStamp = new Array();
    var orderPosition;
    var netPips;
    var netGain;
    var balance = 1000;
    var orderType = "";
    var pairs;
    let allOrders = [];

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

            // document.getElementById("pips").innerHTML = "Pips: " + orderCalc;
        }
    }

        
    function OrderObject(price, time, type) {
        this.price = price;
        this.time = time;
        this.type = type;
    }

    OrderObject.prototype = {
        clone: function () {
            let clone = new OrderObject(this.price, this.time, this.type)
            return clone;
        }
    }

    let orderObj = new OrderObject();

    function buy(){     // buy button function
        var unixTime = new Date();
        orderType = "buy";
        orderPosition = priceDataArray[priceDataArray.length - 1];
        orderObj.price = orderPosition.toFixed(5);
        orderObj.time = unixTime.getTime();
        orderObj.type = "buy";
        allOrders.push(orderObj.clone());

        getOrders();
    }

    function sell(){    // sell button function
        var unixTime = new Date();
        orderType = "sell";
        orderPosition = priceDataArray[priceDataArray.length - 1];
        orderObj.price = orderPosition.toFixed(5);
        orderObj.time = unixTime.getTime();
        orderObj.type = "sell";
        allOrders.push(orderObj.clone());

        getOrders();
    }

    function onError(evt) {
        alert("ERROR: " + evt.data);
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