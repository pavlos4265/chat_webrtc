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
import React, {useState} from "react"

import { mainsocketaddr, isConnected } from "../inc/WS";

let tracker = mainsocketaddr, key;

const AddUser = (props) => {
    const [buttonDisabled, setButtonDisabled] = useState(false);
    const [message, setMessage] = useState("");

    const whitelist = (publicKey) => {
        const whitelist = JSON.parse(window.localStorage.getItem("whitelist"));
        whitelist[publicKey] = true;
        window.localStorage.setItem("whitelist", JSON.stringify(whitelist));
    }

    const onButtonClick = () => {
        setButtonDisabled(true);
    
        whitelist(key);
        
        if (isConnected(tracker)) {
            props.sendOffer(key, tracker);
            setMessage("Request sent.");
            return;
        }
    
       props.initConnectionWS(tracker).then(
            () => {
                props.sendOffer(key, tracker);
                setMessage("Request sent.");
            }
        );
    }

    return (
        <div id="adduser">
            <p style={{color: "green"}}>{message}</p>
            <p>Fill in the user's tracker ip and public key:</p>
            Tracker: <input defaultValue={tracker} onChange={(e)=>tracker = (e.target.value)}/><br/><br/>
            Public Key:<br/>
            <textarea onChange={(e) => key = (e.target.value)}></textarea><br/><br/>
            <button onClick={(e) => onButtonClick()} disabled={buttonDisabled}>add</button>
        </div>
    );
}

export default AddUser;