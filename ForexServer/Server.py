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
userNameCheck = False
userName = ""

#   forex markets closed on the weekends ya goof
#   TODO spoof data input
client = python_forex_quotes.ForexDataClient("iPLcRg1tsNOa5zw7ni1LQG53IBKjkVo6")
symbols = client.getSymbols()
print(symbols)
if client.marketIsOpen():
    weekend = True  # TODO remove this when done spoofing
    print("Market status: Open")
    db = MySQLdb.connect("localhost", "root", "root", "pythondb")  # connect to mySQL database
elif today == 6 or today == 5 or today == 4:  # if today is sat or sun or friday
    weekend = True
    print("Forex is closed on weekends")
    db = MySQLdb.connect("localhost", "root", "root", "pythondb")  # connect to mySQL database
else:
    print("Market status: Closed")
    print("Database not connected!")


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
    except MySQLdb.DatabaseError or MySQLdb.Error or MySQLdb.MySQLError or MySQLdb.InternalError as e:
        print(e)
        db.rollback()


def getUserBalance(userName):
    cursor = db.cursor()  # prepare cursor
    balance = 0
    try:
        cursor.execute("SELECT * FROM users WHERE username = '" + userName + "'")
        results = cursor.fetchall()
        for x in results:
            balance = x[2]
    except MySQLdb.DatabaseError or MySQLdb.Error or MySQLdb.MySQLError or MySQLdb.InternalError as e:
        print(e)
        db.rollback()

    return balance


def checkExistance(userName):
    cursor = db.cursor()  # prepare cursor
    results = 0
    try:
        sql = "SELECT EXISTS(SELECT 1 FROM users WHERE username = '" + userName + "' LIMIT 1)"
        cursor.execute(sql)
        results = cursor.fetchall()[0][0]

    except MySQLdb.DatabaseError or MySQLdb.Error or MySQLdb.MySQLError or MySQLdb.InternalError as e:
        print(e)
        db.rollback()

    return results


def setUserName(userName):
    cursor = db.cursor()  # prepare cursor
    try:
        if not checkExistance(userName):
            print("making new user: " + userName)
            sql = "INSERT INTO users (username, balance) VALUES (%s, %s)"
            adr = (userName, str(1000))
            cursor.execute(sql, adr)
        else:
            print("user: " + userName + " exists")

        db.commit()
    except MySQLdb.DatabaseError or MySQLdb.Error or MySQLdb.MySQLError or MySQLdb.InternalError as e:
        print(e)
        db.rollback()


def setUserBalance(userName, newBalance):
    cursor = db.cursor()  # prepare cursor
    try:
        if checkExistance(userName):
            sql = "UPDATE users SET balance = %s WHERE username = %s"
            adr = (newBalance, userName)
            cursor.execute(sql, adr)
        else:
            print("making new user")
            sql = "INSERT INTO users (username, balance) VALUES (%s, %s)"
            adr = (userName, str(1000))
            cursor.execute(sql, adr)

        db.commit()
    except MySQLdb.DatabaseError or MySQLdb.Error or MySQLdb.MySQLError or MySQLdb.InternalError as e:
        print(e)
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
    global pair, userNameCheck, userName
    async for message in websocket:
        try:
            print(message)
            if "username" in message:
                userName = message.split(":")[1]
                setUserName(userName)
                userNameCheck = True
            elif "balance" in message:
                setUserBalance(userName, message.split(":")[1])
            else:
                pair = message

        except websockets.ConnectionClosed:
            print("thats all folks!")
            break


async def producerHandler(websocket, path):
    global db
    global basePrice
    global pair
    global userNameCheck, userName
    count = 0
    doOnce = True
    message = ""

    # TODO: clear session data of previous connection
    while True:
        try:
            if doOnce:
                message = repr(symbols)
                doOnce = False
                await websocket.send(message)

            if userNameCheck:
                await websocket.send("balance:" + str(getUserBalance(userName)))
                userNameCheck = False

            if not weekend:
                message = (str(client.getQuotes(["EURUSD"])[0].get("price")))
                await asyncio.sleep(10)  # sleeps for ~10 seconds
            else:
                basePrice += random.uniform(-0.001, 0.001)

                if pair != "" and len(pair) == 6 and pair.isupper():
                    message = repr(basePrice)

                    await websocket.send(message)

                if count == 10:
                    await asyncio.sleep(1)  # sleeps for ~1 second
                    count = 0
                count += 1

                #   Database code
            if pair != "" and len(pair) == 6 and pair.isupper():
                database(pair, message)

        except websockets.ConnectionClosed:
            break


start_server = websockets.serve(handler, "localhost", 42069)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
