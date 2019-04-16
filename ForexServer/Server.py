#!/usr/bin/env python

# WS server that sends messages at random intervals

import asyncio
import random
import websockets
import datetime
import random  # used to generate random price data
import python_forex_quotes  # this lib was build on an older version of python some functions don't work such as print.
#   in ForexDataClient.py
#   Change urllib.urlopen( to urllib.request.urlopen(
#   also change #import urllib to #import urllib.request

import MySQLdb  # https://stackoverflow.com/questions/51146117/installing-mysqlclient-in-python-3-6-in-windows

today = datetime.datetime.today().weekday()
weekend = False
basePrice = 1.324

#   forex markets closed on the weekends ya goof
#   TODO spoof data input
client = python_forex_quotes.ForexDataClient("iPLcRg1tsNOa5zw7ni1LQG53IBKjkVo6")
if client.marketIsOpen():
    weekend = True  # TODO remove this when done spoofing
    print("Market status: Open")
    db = MySQLdb.connect("localhost", "root", "root", "pythondb")  # connect to mySQL database
elif today == 6 or today == 5:  # if today is sat or sun
    weekend = True
    print("Forex is closed on weekends")
    db = MySQLdb.connect("localhost", "root", "root", "pythondb")  # connect to mySQL database
else:
    print("Market status: Closed")
    db.close()
    print("Database connection is closed")


def database(item):
    cursor = db.cursor()  # prepare cursor
    try:
        cursor.execute("INSERT INTO eurusd (price) Values ('" + item + "')")
        db.commit()  # commits changes to database
    except MySQLdb.DatabaseError | MySQLdb.Error | MySQLdb.MySQLError | MySQLdb.InternalError:
        db.rollback()


async def websoc(websocket, path):
    global db
    global basePrice
    count = 0

    while True:
        try:
            await websocket.send("")  # sends and empty packet, if fails does not poll forex API

            if not weekend:
                item1 = (str(client.getQuotes(["EURUSD"])[0].get("price")))
                await asyncio.sleep(10)  # sleeps for ~10 seconds
            else:
                basePrice += random.uniform(-0.001, 0.001)
                item1 = str(basePrice)
                if count == 100:
                    await asyncio.sleep(5)  # sleeps for ~1 second
                    count = 0
                count += 1
            # print(client.getQuotes(["EURUSD"]))
            # item2 = (str(client.getQuotes(["EURGBP"])[0].get("price")))
            await websocket.send(item1)
            # await websocket.send(item2)

            #   Database code
            database(item1)

            print("Data sent " + str(basePrice))
            # receivedMessage = await websocket.recv()
            # print(receivedMessage)
        except websockets.ConnectionClosed:
            print("Connection Closed")
            await websocket.close()  # TODO: doesnt do anything
            break
    # name = await websocket.recv()
    # TODO: if this is enabled, the server only send data only twice. recv() raises a
    # ConnectionClosed exception when the client disconnects
    # stops the send function after the JavaScript send a response and python writes it to console
    # print("Received: " + name)

    # TODO: close async websocket connection


start_server = websockets.serve(websoc, "localhost", 42069)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
