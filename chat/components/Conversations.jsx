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
import React from "react";

const Conversations = (props) => {
    const onConvClick = (conv) => {
        props.setCurrentContent(4);
        props.setCurrentChat(conv);     
        props.setCurrentMessages(JSON.parse(localStorage.getItem(conv.publicKey)));
        props.setCurrentChatKey(conv.publicKey);
    }

    return (
        <div id="conversations">
            {
            Object.keys(props.conversations).map(
                (key, idx) => 
                    <div key={idx} title={key} className="conversation" onClick={(e) => onConvClick(props.conversations[key])}>
                        {props.conversations[key].nickname}
                    </div>
            )
            }      
        </div>
    );
}

export default Conversations