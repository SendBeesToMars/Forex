#!/usr/bin/env python

# WS server that sends messages at random intervals

import asyncio
import random
import websockets
import python_forex_quotes  # this lib was build on an older version of python some fucntions dont work.
import MySQLdb

#  Change urllib.urlopen( to urllib.request.urlopen(
# also change #import urllib to #import urllib.request
marketStatus = False

client = python_forex_quotes.ForexDataClient("iPLcRg1tsNOa5zw7ni1LQG53IBKjkVo6")
if client.marketIsOpen():
    print("Market status: Open")
    marketStatus = True
    db = MySQLdb.connect("localhost", "root", "root", "pythondb")  # connect to mySQL database
else:
    print("Market status: Closed")
    marketStatus = False
    db.close()
    print("Database connection is closed")


async def websoc(websocket, path):
    global db
    global marketStatus

    while marketStatus:
        try:
            await websocket.send("")  # sends and empty packet, if fails does not poll forex API
            item1 = (str(client.getQuotes(["EURUSD"])[0].get("price")))
            # item2 = (str(client.getQuotes(["EURGBP"])[0].get("price")))
            await websocket.send(item1)
            # await websocket.send(item2)

            cursor = db.cursor()  # prepare cursor
            try:
                cursor.execute("INSERT INTO eurusd (price) " +
                               "Values (" +
                               "'" + item1 + "')")
                db.commit() # commits changes to database
            except MySQLdb.DatabaseError | MySQLdb.Error | MySQLdb.MySQLError | MySQLdb.InternalError:
                db.rollback()

            print("Message sent")
        except websockets.ConnectionClosed:
            print("Connection Closed")
            await websocket.close()  # doesnt do anything
        await asyncio.sleep(3)  # sleeps for 5 seconds
        # name = await websocket.recv()
        # TODO: if this is enabled, the server only send data only twice. recv() raises a
        # ConnectionClosed exception when the client disconnects
        # stops the send function after the JavaScript send a response and python writes it to console
        # print("Received: " + name)

        # TODO: close async websocket connection


start_server = websockets.serve(websoc, "localhost", 42069)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
