/*   
 * Copyright 2023 pavlos4265
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { createServer } from 'https'
import { WebSocketServer } from 'ws'
import { readFileSync } from 'fs'

const sockets = new Map();
const keys = new Map();

const server = createServer(
    {
        cert: readFileSync('cert/cert.pem'),
        key: readFileSync('cert/privateKey.pem')
    }
);

console.log("Starting websocket server...");

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
    ws.on('error', console.error);

    ws.on('message', (data) => {
        const message = JSON.parse(data);

        console.log(message.type + " received");

        if (message.type === "publicKey") {
            sockets.set(message.content, ws);
            keys.set(ws, message.content);
        }else {
            if (keys.get(ws) == null)
                return;

            const recSocket = sockets.get(message.to);

            if (recSocket == null)
                return;

            message.from = keys.get(ws);
            
            recSocket.send(JSON.stringify(message));
        }
    });

    ws.on('close', () => {
        const key = keys.get(ws);
        if (key != null) {
            keys.delete(ws);
            sockets.delete(key);
        }

        console.log(req.socket.remoteAddress + " disconnected");
    } );

    console.log(req.socket.remoteAddress + " connected");
});

server.listen(7777);
