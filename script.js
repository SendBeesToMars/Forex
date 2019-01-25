
    var priceDataArray = new Array(); // creates array
    var priceDataTimeStamp = new Array();
    var orderPosition;
    var netPips;
    var netGain;
    var ballance = 1000;
    var orderType = "";

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
        writeToScreen("CONNECTED");
        doSend("WebSocket rocks");
        doSend("hello there");
        writeToScreen(websocket.readyState);
    }

    function onClose(evt) {
        writeToScreen("DISCONNECTED");
    }

    function onMessage(evt) {
        if (evt.data != "") {
            writeToScreen('<span style="color: blue;">RESPONSE: ' + evt.data + '</span>');
            //makes a new chart
            var Chart = require("chart.js");
            var ctx = document.getElementById("myChart");
            var date = new Date();
            priceDataTimeStamp.push(date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds());
            if (evt.data != "")
                priceDataArray.push(parseFloat(evt.data, 10)); //add to array
            console.log("Price len: " + priceDataArray.length);
            console.log("Time len: " + priceDataTimeStamp.length);
        }
        var myChar = new Chart(ctx, {
            type: 'line',
            data: {
                labels: priceDataTimeStamp,
                datasets: [{
                    label: 'EUR/USD',
                    data: priceDataArray,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)'
                    ],
                    borderColor: [
                        'rgba(255,99,132,1)'
                    ],
                }]
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                animation: {
                    duration: 0, // general animation time
                },
                hover: {
                    animationDuration: 0, // duration of animations when hovering an item
                },
                responsiveAnimationDuration: 0, // animation duration after a resize
                elements: {
                    line: {
                        tension: 0,
                    }
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: false
                        }
                    }]
                }
            }
        });

        if(document.getElementById("position").innerHTML != ""){
            var orderCalc;
            var sellCalc = ((orderPosition - priceDataArray[priceDataArray.length - 1]).toFixed(5) * 10000);
            var buyCalc = ((priceDataArray[priceDataArray.length - 1] - orderPosition).toFixed(5) * 10000);
            if(orderType == "buy"){ orderCalc = buyCalc;}
            else if(orderType == "sell"){ orderCalc = sellCalc;}

            netPips = orderCalc;

            document.getElementById("pips").innerHTML = "Pips: " + orderCalc;
        }

    }

    function onError(evt) {
        writeToScreen('<span style="color: red;">ERROR:</span> ' + evt.data);
    }

    function buy(){
        orderType = "buy";
        orderPosition = priceDataArray[priceDataArray.length - 1];
        document.getElementById("position").innerHTML = "Buy order at: " + orderPosition;
    }

    function sell(){
        orderType = "sell";
        orderPosition = priceDataArray[priceDataArray.length - 1];
        document.getElementById("position").innerHTML = "Buy order at: " + orderPosition;
    }

    function closePosition(){
        netGain = netPips * 100;
        document.getElementById("position").innerHTML = ""; // clears the position html field so it doesnt update.
        document.getElementById("netGain").innerHTML = "Net Profit/Loss: $" + netGain; // clears the position html field so it doesnt update.
        ballance += netGain;
        document.getElementById("ballance").innerHTML = "Ballance: $" + ballance; // clears the position html field so it doesnt update.
    }

    function doSend(message) {
        writeToScreen("SENT: " + message);
        websocket.send(message);

        writeToScreen("hello there");
    }

    function writeToScreen(message) {
        var pre = document.createElement("p");
        pre.style.wordWrap = "break-word";
        pre.innerHTML = message;
        output.appendChild(pre);
    }

    window.addEventListener("load", init, false);