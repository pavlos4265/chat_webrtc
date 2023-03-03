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
import React, {useEffect, useRef} from "react"
import { sendMessage, isDataChannelOpen } from "../inc/PC";
import { isConnected } from "../inc/WS"

const Chat = (props) => {
    const textElement = useRef();
    const messagesDiv = useRef();

    useEffect(() =>{
        messagesDiv.current.scrollTop = messagesDiv.current.scrollHeight;
    }, [props.currentMessages]);

    const onEnter = (e) => {
        if (e.key !=="Enter")
            return;

        e.preventDefault();

        if (isDataChannelOpen(props.currentChat.publicKey)) {
            const message = textElement.current.value;

            const messageObj = {
                type: "message",
                message: message
            }

            sendMessage(props.currentChat.publicKey, JSON.stringify(messageObj));
            props.updateMessages(props.currentChat.publicKey, message, 0);
            props.updateConvs(props.currentChat.publicKey);
        }else if (isConnected(props.currentChat.tracker)) {
            props.setChatStatus("Attempting to connect to "+props.currentChat.nickname);
            props.sendOffer(props.currentChat.publicKey, props.currentChat.tracker);
            return;
        }else{
            props.initConnectionWS(props.currentChat.tracker).then(
                () => {
                    props.setChatStatus("Attempting to connect to "+props.currentChat.nickname);
                    props.sendOffer(props.currentChat.publicKey, props.currentChat.tracker);
                }
            );
            return;
        }

        textElement.current.value = "";
    }

    const date = (timestamp) => {
        const td = new Date(timestamp);

        return td.getDate()+"/"+(td.getMonth()+1)+"/"+td.getFullYear().toString().substr(-2)+" "+td.getHours()+":"+td.getMinutes();
    }

    const getMessageStyle = (sender) => {
        if (sender == 0)
            return {alignSelf: "flex-end"};

        return {};
    }

    return (
        <div id="chat">
            <div id="chat_info">
                {props.currentChat.nickname}
            </div>
            <div id="chat_messages" ref={messagesDiv}>
                {props.currentMessages.map(
                    (message, idx) => 
                        <div style={getMessageStyle(message.sender)} className="message" key={idx}>
                            <span className="message_user">
                            {message.sender == 0 && <>You</>}
                            {message.sender == 1 && <>{props.currentChat.nickname}</>}
                            </span> <span className="message_timestamp">{date(message.timestamp)}</span><br/>
                            {message.message}<br/>           
                        </div>
                )
                }
            </div>
            <div id="chat_textarea">
                <textarea onKeyDown={onEnter} ref={textElement}></textarea>
            </div>  
        </div>
    );
}

export default Chat;