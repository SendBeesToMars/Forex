#!/usr/bin/env python

# WS server that sends messages at random intervals

import asyncio
import random
import websockets
import python_forex_quotes  # this lib was build on an older version of python some fucntions dont work.

#  Change urllib.urlopen( to urllib.request.urlopen(
# also change #import urllib to #import urllib.request


client = python_forex_quotes.ForexDataClient("iPLcRg1tsNOa5zw7ni1LQG53IBKjkVo6")
if client.marketIsOpen():
    print("Maket is Open")
    marketStatus = True
else:
    print("Pools closed")
    marketStatus = False


async def websoc(websocket, path):
    while marketStatus:
        item1 = ("EURUSD price " + (str(client.getQuotes(["EURUSD"])[0].get("price"))))
        item2 = ("EURGBP price " + (str(client.getQuotes(["EURGBP"])[0].get("price"))))

        await websocket.send(item1)
        await websocket.send(item2)
        print("hello there")
        await asyncio.sleep(random.random() * 3)

        name = await websocket.recv()  # TODO: if this is enabled, the server only send data only twice. recv() raises a
        # ConnectionClosed exception when the client disconnects
        # stops the send function after the JavaScript send a response and python writes it to console
        print("Received: " + name)


start_server = websockets.serve(websoc, "localhost", 42069)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
