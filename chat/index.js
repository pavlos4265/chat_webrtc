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
import React from "react"
import ReactDOM from "react-dom/client"

import App from "./components/App"

const localStorage = window.localStorage;
const root = ReactDOM.createRoot(document.getElementById("root"));

const generateKeyPair = async () => {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "ECDH",
            namedCurve: "P-384"
        },
        true,
        ["deriveKey"]
    );
    return [keyPair.publicKey, keyPair.privateKey];
}

const importKeyPair = async (jwk) => {
    const publicKey = await window.crypto.subtle.importKey(
        "jwk",
        jwk[0],
        {
            name: "ECDH",
            namedCurve: "P-384"
        },
        true,
        []
    );

    const privateKey = await window.crypto.subtle.importKey(
        "jwk",
        jwk[1],
        {
            name: "ECDH",
            namedCurve: "P-384"
        },
        true,
        ["deriveKey"]
    );

    return [publicKey, privateKey];
}

const main = () => {
    if (localStorage.getItem("nickname") == null)
        localStorage.setItem("nickname", "user"+Math.floor(Math.random() * 10000));

    if (localStorage.getItem("whitelist") == null)
        localStorage.setItem("whitelist", "{}");

    if (localStorage.getItem("chats") == null)
        localStorage.setItem("chats", "{}");
    
    root.render(<h1 style={{"textAlign": "center"}}>Generating keys...</h1>);

    if ( localStorage.getItem("keyPair") == null ) {
         generateKeyPair().then(
            (keyPair) => {
                console.log("KeyPair generated");
                
                const publPromise = window.crypto.subtle.exportKey("jwk", keyPair[0]);
                const privPromise = window.crypto.subtle.exportKey("jwk", keyPair[1]);
                
                Promise.all([publPromise, privPromise]).then(
                    (values)=>
                    {
                        localStorage.setItem("keyPair", JSON.stringify(values));
                        root.render(<App keyPair={keyPair}/>);
                    }
                );
            }
        );
    }else {
        const jwk = JSON.parse(localStorage.getItem("keyPair"));

        importKeyPair(jwk).then (
            (keyPair) => {
                root.render(<App keyPair={keyPair}/>);  
            }
        );
    }
}

main();