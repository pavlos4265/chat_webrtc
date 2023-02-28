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
import React, {useEffect, useState} from "react";

import { connectToWS, sendData, mainsocketaddr } from "../inc/WS";
import { createOffer, handleAnswer, handleCandidate, createAnswer } from "../inc/PC"

import AddUser from "./AddUser"
import Chat from "./Chat"
import MyPublicKey from "./MyPublicKey";
import UserRequests from "./UserRequests";
import Conversations from "./Conversations";
import StatusBar from "./StatusBar";

const commonKeys = new Map();
let receivedUserRequests = [];
let nickname;
let currentChatKey = null;

const App = (props) => {
    const [userRequests, setUserRequests] = useState([]);
    const [currentContent, setCurrentContent] = useState(0);
    const [conversations, setConversations] = useState({});
    const [chatStatus, setChatStatus] = useState("");

    const [currentChat, setCurrentChat] = useState({});
    const [currentMessages, setCurrentMessages] = useState([]);

    const [sendOffer, initConnectionWS, updateMessages, updateConvs] = getFunctions(props.keyPair, setUserRequests, setConversations, setChatStatus, setCurrentMessages);

    const setCurrentChatKey = (key) => currentChatKey = key;

    useEffect(() => 
        {
            nickname = window.localStorage.getItem("nickname");
            initConnectionWS(mainsocketaddr);
            setConversations(JSON.parse(window.localStorage.getItem("chats")));
        },[]
    );

    return (
        <>
        <div id="upperroot">
            <div id="leftmenu">
                <div id="userprofile">
                    {nickname}
                    <ul>
                        <li><a href="#" onClick={() => setCurrentContent(1)}>my public key</a></li>
                        <li><a href="#" onClick={() => setCurrentContent(2)}>add user</a></li>
                        <li><a href="#" onClick={() => setCurrentContent(3)}>requests</a></li>
                    </ul>
                </div>
                <Conversations conversations={conversations} setCurrentChat={setCurrentChat} setCurrentContent={setCurrentContent} setCurrentMessages={setCurrentMessages} setCurrentChatKey={setCurrentChatKey}/>
            </div>
            <div id="content">
                {currentContent == 1 &&
                <MyPublicKey/>
                }
                {currentContent == 2 &&
                <AddUser initConnectionWS={initConnectionWS} sendOffer={sendOffer}/>
                }
                {currentContent == 3 &&
                <UserRequests userRequests={userRequests} sendOffer={sendOffer}/>                
                }
                {currentContent == 4 &&
                <Chat setChatStatus={setChatStatus} currentChat={currentChat} currentMessages={currentMessages} sendOffer={sendOffer} initConnectionWS={initConnectionWS} updateMessages={updateMessages} updateConvs={updateConvs}/>                
                }
            </div>
        </div>
        <StatusBar chatStatus={chatStatus}/>
        </>
    );
}

const getFunctions = (keyPair, setUserRequests, setConversations, setChatStatus, setCurrentMessages) => {
    const subtleCrypto = window.crypto.subtle;
    const localStorage = window.localStorage;

    const initConnectionWS = async (tracker) => {
        setChatStatus("Attemping to connect to "+tracker);

        await connectToWS(tracker, onTrackerMessage(tracker));

        setChatStatus("Connected to "+tracker);

        const exportedKeyPair = JSON.parse(localStorage.getItem("keyPair"));
        const base64key = btoa(JSON.stringify(exportedKeyPair[0]));
        const message = {
            type: "publicKey",
            content: base64key
        };
    
        sendData(mainsocketaddr, JSON.stringify(message));
    }

    const onTrackerMessage = (tracker) => {
        return (data) => {      
    
            let dataObj;
            try {
                dataObj = JSON.parse(data);
            }catch (e) {
                return;
            }
    
            if (dataObj.type == null || dataObj.from == null || dataObj.iv == null || !Object.hasOwn(dataObj, "content"))
                return;
    
            if (!isWhitelisted(dataObj.from)) {
                if (dataObj.type !== "offer")
                    return;

                const userRequest = {
                    publicKey: dataObj.from,
                    tracker: tracker
                };

                receivedUserRequests = [userRequest, ...receivedUserRequests];
                setUserRequests(receivedUserRequests);
                return;
            }

            decryptContent(dataObj.content, dataObj.iv, dataObj.from). then(
                (content) => {
                    const contentObj = JSON.parse(content);

                    if (dataObj.type === "offer") {
                        if (contentObj == null)
                            return;

                        createAnswer(dataObj.from,
                            contentObj,
                            onIceCandidates(dataObj.from, tracker),
                            onDataChannelOpen(dataObj.from, tracker),
                            onDataChannelMessage(dataObj.from, tracker)
                        ).then(
                            (answer) => {
                                constructMessage("answer", dataObj.from, JSON.stringify(answer)).then(
                                    (answerObj) => sendData(tracker, JSON.stringify(answerObj))
                                ); 
                            }
                        );
                    }else if (dataObj.type === "answer") {
                        if (contentObj == null)
                            return;

                        handleAnswer(dataObj.from, contentObj);
                    }else if (dataObj.type === "candidate") {
                        handleCandidate(dataObj.from, contentObj);
                    }
                }
            );
        }
    }
    
    const sendOffer = (publicKey, tracker) => {
        createOffer(publicKey,
            onIceCandidates(publicKey, tracker),
            onDataChannelOpen(publicKey, tracker),
            onDataChannelMessage(publicKey, tracker)
        ).then(
            (offer) => {
                constructMessage("offer", publicKey, JSON.stringify(offer)).then(
                    (offerObj) => sendData(tracker, JSON.stringify(offerObj))
                );
            }   
        );
    }
    
    const onIceCandidates = (publicKey, tracker) => {
        return (candidate) => {
            constructMessage("candidate", publicKey, JSON.stringify(candidate)).then(
                (candidateObj) => sendData(tracker, JSON.stringify(candidateObj))
            );
        };
    }
    
    const onDataChannelOpen = (publicKey, tracker) => {
        return (dataChannel) => {
            const message = {
                type: "info",
                nickname: nickname
            }

            dataChannel.send(JSON.stringify(message));
        };
    }
    
    const onDataChannelMessage = (publicKey, tracker) => {
        return (data) => {
            const dataObj = JSON.parse(data);

            if (dataObj.type === "info") {
                let chats = JSON.parse(localStorage.getItem("chats"));

                setChatStatus("Connected to "+dataObj.nickname);

                const chatInfo = {
                    nickname: dataObj.nickname,
                    publicKey: publicKey,
                    tracker, 
                };

                if(chats[publicKey] == null) {
                    chats = {[publicKey]: chatInfo, ...chats};
                    localStorage.setItem(publicKey, "[]");
                }else{
                    chats[publicKey] = chatInfo;
                }

                setConversations(chats);
                localStorage.setItem("chats", JSON.stringify(chats));
            }else if (dataObj.type === "message") {
                updateMessages(publicKey, dataObj.message, 1);
                updateConvs(publicKey);
            }
        };
    }
    
    const updateMessages = (publicKey, message, id) => {
        const messageObj = {
            sender: id,
            message: message,
            timestamp: Date.now()
        }

        let messages = JSON.parse(localStorage.getItem(publicKey));
        messages = [...messages, messageObj];

        if (currentChatKey === publicKey)
            setCurrentMessages(messages);

        localStorage.setItem(publicKey, JSON.stringify(messages));
    }

    const updateConvs = (publicKey) => {
        let chats = JSON.parse(localStorage.getItem("chats"));
        const chatInfo = chats[publicKey];
        delete chats[publicKey];
        chats = {[publicKey]: chatInfo, ...chats};
        setConversations(chats);
        localStorage.setItem("chats", JSON.stringify(chats));
    }

    const constructMessage = async (type, recipientKey, content) => {
        const message = {};
        message.type = type;
        message.to = recipientKey;
    
        const [encryptedContent, iv] = await encryptContent(content, recipientKey);
    
        message.content = encryptedContent;
        message.iv = iv;
    
        return message;
    }
    
    const encryptContent = async (content, recipientKey) => {
        const commonKey = await deriveCommonKey(recipientKey);
        const data = (new TextEncoder()).encode(content);
    
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
        const encryptedContent = await subtleCrypto.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            commonKey,
            data
        );
    
        return [[...new Uint8Array(encryptedContent)], [...iv]];
    }
    
    const decryptContent = async (content, iv, senderKey) => {
        const commonKey = await deriveCommonKey(senderKey);
    
        const data = new Uint8Array(content);
        const ivArray = new Uint8Array(iv);
    
        const decryptedContent = await subtleCrypto.decrypt(
            {
                name: "AES-GCM",
                iv: ivArray
            },
            commonKey,
            data
        );
    
        return (new TextDecoder()).decode(decryptedContent);
    }
    
    const deriveCommonKey = async (recipientKey) => {
        if (commonKeys.get(recipientKey) != null)
            return commonKeys.get(recipientKey);
        
        const exportedRecipientKey = JSON.parse(atob(recipientKey));
        
        const recipientKeyObj = await subtleCrypto.importKey(
            "jwk",
            exportedRecipientKey,
            {
                name: "ECDH",
                namedCurve: "P-384"
            },
            true,
            []
        );
        
        const commonKey = await window.crypto.subtle.deriveKey(
            {
                name: "ECDH",
                public: recipientKeyObj
            }, 
            keyPair[1],
            {
                name: "AES-GCM",
                length: 256
            },
            false,
            ["encrypt", "decrypt"]
        );
    
        commonKeys.set(recipientKey, commonKey);
    
        return commonKey;
    }

    const isWhitelisted = (publicKey) => {
        const keyMap = JSON.parse(localStorage.getItem("whitelist"));

        if (keyMap[publicKey] != null)
            return true;

        return false;
    }

    return [sendOffer, initConnectionWS, updateMessages, updateConvs];
}

export default App;