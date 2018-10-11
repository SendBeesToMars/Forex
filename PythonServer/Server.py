#!/usr/bin/env python

# WS server that sends messages at random intervals

import asyncio
import datetime
import random
import websockets
import python_forex_quotes

client = python_forex_quotes.ForexDataClient("iPLcRg1tsNOa5zw7ni1LQG53IBKjkVo6")
if client.marketIsOpen():
    print(client.getQuotes(["EURUSD"]))
else:
    print("Pools closed")


async def time(websocket, path):
    while True:
        item1 = ("EURUSD price " + (str(client.getQuotes(["EURUSD"])[0].get("price"))))
        item2 = ("EURGBP price " + (str(client.getQuotes(["EURGBP"])[0].get("price"))))
        await websocket.send(item1)
        await websocket.send(item2)
        await asyncio.sleep(random.random() * 3)

start_server = websockets.serve(time, "localhost", 42069)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()