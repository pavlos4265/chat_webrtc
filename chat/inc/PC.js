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
const peerConnections = new Map();
const dataChannels = new Map();

const createOffer = async (publicKey, onIceCandidates, onOpen = null, onMessage = null) => {
    if (peerConnections.get(publicKey) != null)
        return null;

    const peerConnection = new RTCPeerConnection();
    setupRTCPeerConnection(peerConnection, publicKey, onIceCandidates);

    const dataChannel = peerConnection.createDataChannel("main");
    setupDataChannel(dataChannel, publicKey, onOpen, onMessage);

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    peerConnections.set(publicKey, peerConnection);

    return offer;
}

const handleAnswer = async (publicKey, answer) => {
    const peerConnection = peerConnections.get(publicKey);
    if (peerConnection != null)
        await peerConnection.setRemoteDescription(answer);
}

const handleCandidate = (publicKey, candidate) => {
    const peerConnection = peerConnections.get(publicKey);
    if (peerConnection != null && peerConnection.remoteDescription != null)
        peerConnection.addIceCandidate(candidate);

    //TODO: candidates received before establishing peerconenction are lost
}

const createAnswer = async (publicKey, offer, onIceCandidates, onOpen = null, onMessage = null) => {
    let peerConnection = peerConnections.get(publicKey);
    
    if (dataChannels.get(publicKey) == null) {
        peerConnection = new RTCPeerConnection();
        setupRTCPeerConnection(peerConnection, publicKey, onIceCandidates);

        peerConnection.addEventListener("datachannel", (e) => {
            const dataChannel = e.channel;
            setupDataChannel(dataChannel, publicKey, onOpen, onMessage);
        });

        peerConnections.set(publicKey, peerConnection);
    }

    await peerConnection.setRemoteDescription(offer);

    const answer = await peerConnection.createAnswer();
    peerConnection.setLocalDescription(answer);

    return answer;
}

const setupRTCPeerConnection = (peerConnection, publicKey, onIceCandidates) => {
    peerConnection.addEventListener("icecandidate", (e) => {
        onIceCandidates(e.candidate);
    });
    
    peerConnection.addEventListener("iceconnectionstatechange", (e) => {
        if (peerConnection.iceConnectionState === "disconnected") {
            peerConnection.close();

            peerConnections.delete(publicKey);
            dataChannels.delete(publicKey);
        }
    });
}

const setupDataChannel = (dataChannel, publicKey, onOpen, onMessage) => {
    dataChannel.addEventListener("open", (e) => {
        dataChannels.set(publicKey, dataChannel);

        if (onOpen != null)
            onOpen(dataChannel);
    });

    dataChannel.addEventListener("message", (e) => {
        if (onMessage != null)
            onMessage(e.data);
    });

    dataChannel.addEventListener("close", (e) => {
        dataChannels.delete(publicKey);

        if (peerConnections.get(publicKey) != null) {
            peerConnections.get(publicKey).close();
            peerConnections.delete(publicKey);
        }
    });
}

const isDataChannelOpen = (publicKey) => {
    if (dataChannels.get(publicKey) != null)
        return true;

    return false;
}

const sendMessage = (publicKey, message) => {
    if (!isDataChannelOpen(publicKey))
        return;

    const dataChannel = dataChannels.get(publicKey);
    dataChannel.send(message);
}

export {createAnswer, createOffer, handleAnswer, handleCandidate, isDataChannelOpen, sendMessage}