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
import { subtle } from 'crypto'

const sockets = new Map();
const keys = new Map();

const generateKeyPair = async () => {
    const keyPair = await subtle.generateKey(
        {
            name: "ECDH",
            namedCurve: "P-384"
        },
        true,
        ["deriveKey"]
    );
    return [keyPair.publicKey, keyPair.privateKey];
}

const verifySignature = async (keyPair, message) => {
    const publicKey = JSON.parse(atob(message.content));
    const keyObj = await subtle.importKey("jwk", publicKey, 
        {
            name: "ECDH",
            namedCurve: "P-384"
        },
        false,
        []
    );

    const verifyKey = await subtle.deriveKey(
        {
            name: "ECDH",
            public: keyObj
        },
        keyPair[1],
        {
            name: "HMAC",
            hash: "SHA-256",
            length: 256
        },
        false,
        ["verify"]
    );

    const signature = new Uint8Array(message.signature);
    delete message.signature;

    const messageBuf = (new TextEncoder()).encode(JSON.stringify(message));

    const isValid = await subtle.verify(
        {name: "HMAC"},
        verifyKey,
        signature,
        messageBuf
    );

    return isValid;
}

const createWSServer = async (keyPair) => {
    const exportedKey = await subtle.exportKey("jwk", keyPair[0]);

    const server = createServer(
        {
            cert: readFileSync('cert/cert.pem'),
            key: readFileSync('cert/privateKey.pem')
        }
    );
    
    console.log("Starting websocket server...");
    const wss = new WebSocketServer({ server });
    
    wss.on('connection', (ws, req) => {
        ws.send("{\"type\":\"publicKey\", \"content\": \""+btoa(JSON.stringify(exportedKey))+"\"}");

        ws.on('error', console.error);
    
        ws.on('message', (data) => {
            const message = JSON.parse(data);
    
            console.log(message.type + " received");
    
            if (message.type === "publicKey") {
                if (message.content == null || message.timestamp == null || message.signature == null) {
                    ws.close();
                    return;
                }

                //TODO: check timestamp

                verifySignature(keyPair, message).then(
                    (isValid) => {
                        if (!isValid) {
                            ws.close();
                            return;
                        }

                        sockets.set(message.content, ws);
                        keys.set(ws, message.content);
                    }
                );
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

    return server;
}

generateKeyPair().then(
    (keyPair) => {
        createWSServer(keyPair).then(
            (server) => server.listen(7777)
        );
    }
);


