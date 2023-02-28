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

const UserRequests = (props) => {

    const onAcceptClick = (userRequest) => {
        const whitelist = JSON.parse(window.localStorage.getItem("whitelist"));
        whitelist[userRequest.publicKey] = true;
        window.localStorage.setItem("whitelist", JSON.stringify(whitelist));

        props.sendOffer(userRequest.publicKey, userRequest.tracker);
    }

    return (
        <>
        <p>Users that have requested to establish a connection with you:</p>
        {props.userRequests.map(
            (userRequest, id) =>
                <div key="id" className="userRequest">
                    <span>publicKey</span><br/>
                    {userRequest.publicKey}<br/><br/>
                    <span>tracker</span><br/>
                    {userRequest.tracker}<br/><br/>
                    <button onClick={(e)=>onAcceptClick(userRequest)}>accept</button>
                </div>
        )}
        </>
    );

}

export default UserRequests;