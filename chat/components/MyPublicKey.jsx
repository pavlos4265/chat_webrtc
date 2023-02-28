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
import React, {useState, useEffect} from "react"

const localStorage = window.localStorage;

const MyPublicKey = () => {
    const [publicKey, setPublicKey] = useState("");
    useEffect(() =>
        {
            const keyPair = JSON.parse(localStorage.getItem("keyPair"));
            setPublicKey(btoa(JSON.stringify(keyPair[0])));
        }, []
    )
    
    return (
        <>
        <h2>Public key:</h2>
        <textarea style={{width: "100%", height: "20%"}} value={publicKey} readOnly></textarea>
        </>
    );
}

export default MyPublicKey