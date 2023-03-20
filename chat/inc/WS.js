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
const mainsocketaddr = "localhost:7777"; 
const webSockets = new Map();

const isConnected = (ip) => {
    if (webSockets.get(ip) != null)
        return true;

    return false;
}

const connectToWS = async (ip, onOpen, onMessage = null) => {
    if (isConnected(ip))
        return;

    const socket = new WebSocket("wss://"+ip);
    
    socket.onopen = () => {
        webSockets.set(ip, socket);
        onOpen();
    };
    
    socket.onmessage = (event) => {
        if (onMessage != null)
            onMessage(event.data);
    }

    socket.onclose = () => {
        if (webSockets.get(ip) != null)
            webSockets.delete(ip);
    };
}

const disconnectFromWS = (ip) => {
    let socket = null;
    if ((socket = webSockets.get(ip)) == null)
        return;

    socket.close();
}

const sendData = (addr, data) => {
    let socket = null;
    if ((socket = webSockets.get(addr)) != null)
        socket.send(data);
}

export {connectToWS, sendData, isConnected, disconnectFromWS, mainsocketaddr}