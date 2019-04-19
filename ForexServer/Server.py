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
pair = ""

#   forex markets closed on the weekends ya goof
#   TODO spoof data input
client = python_forex_quotes.ForexDataClient("iPLcRg1tsNOa5zw7ni1LQG53IBKjkVo6")
symbols = client.getSymbols()
print(symbols)
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


def database(table, item):
    cursor = db.cursor()  # prepare cursor
    try:
        cursor.execute("CREATE TABLE IF NOT EXISTS " + str(table) + " ( " +
                       "id INT AUTO_INCREMENT," +
                       "price FLOAT," +
                       "pricetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP," +
                       "PRIMARY KEY (id) )")
        cursor.execute("INSERT INTO " + str(table) + " (price) Values ('" + item + "')")
        db.commit()  # commits changes to database
    except MySQLdb.DatabaseError or MySQLdb.Error or MySQLdb.MySQLError or MySQLdb.InternalError:
        db.rollback()


async def handler(websocket, path):
    global pair
    pair = ""
    consumerTask = asyncio.ensure_future(consumerHandler(websocket, path))
    producerTask = asyncio.ensure_future(producerHandler(websocket, path))
    done, pending = await asyncio.wait([consumerTask, producerTask], return_when=asyncio.FIRST_COMPLETED)

    for task in pending:
        task.cancel()


async def consumerHandler(websocket, path):
    global pair
    async for message in websocket:
        try:
            pair = message
            print(message)
        except websockets.ConnectionClosed:
            print("thats all folks!")
            break


async def producerHandler(websocket, path):
    global db
    global basePrice
    global pair
    count = 0
    doOnce = True
    message = ""

    # TODO: clear session data of previous connection
    while True:
        try:
            # await websocket.send("")  # sends and empty packet, if fails does not poll forex API

            if doOnce:
                message = repr(symbols)
                doOnce = False
                await websocket.send(message)

            if not weekend:
                message = (str(client.getQuotes(["EURUSD"])[0].get("price")))
                await asyncio.sleep(10)  # sleeps for ~10 seconds
            else:
                basePrice += random.uniform(-0.001, 0.001)

                if pair != "" and len(pair) == 6 and pair.isupper():
                    message = repr(basePrice)

                    await websocket.send(message)

                if count == 100:
                    await asyncio.sleep(5)  # sleeps for ~1 second
                    count = 0
                count += 1

            #   Database code
            if pair != "":
                database(pair, message)

        except websockets.ConnectionClosed:
            break


start_server = websockets.serve(handler, "localhost", 42069)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
