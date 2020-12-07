import React, {Component, ElementRef} from 'react';
import './App.css';
import {load, Root} from 'protobufjs';
import Gamepad from "./Gamepad/Gamepad";

const Stomp = require('stompjs');

enum CommandType  {
    ARM,
    NAVIGATION
};

class App extends Component<{}, { connected: boolean }> {

    gamepadRef: any;
    stompClient: any;
    connectButtonRef: any;
    disconnectButtonRef: any;

    manualControlProtobuf: any;

    constructor(props: any) {
        super(props);

        this.gamepadRef = React.createRef();
        this.connectButtonRef = React.createRef();
        this.disconnectButtonRef = React.createRef();
        this.state = {
            connected: false
        };

        load('/websocket.proto', (err: (Error|null), root?: Root) => {
            console.log('Loading proto file');
            if (err || root === undefined) {
                console.error('failed to load proto file');
                throw err;
            }

            // example code
            this.manualControlProtobuf = root.lookupType('ManualControl');
        });
    }

    connect = () => {
        console.log("Connecting to websocket");
        console.log(this.manualControlProtobuf);
        const jwtToken = 'eyJhbGciOiJFUzUxMiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICItZTQ2Tm5iTXNRbG03ZjdUc0U2Rl9uSUkzakFOQ0NvN0ttNDJPMGFXdUxFIn0.eyJleHAiOjE2MDczMjY1NTUsImlhdCI6MTYwNzI5MDU1NywiYXV0aF90aW1lIjoxNjA3MjkwNTU1LCJqdGkiOiJlMDNiYWYxMC1hNDZmLTQwYzktYjNkYS01MGVhOTE3M2EwNDYiLCJpc3MiOiJodHRwczovL2FwYWMuY2xvdWRncm91bmRjb250cm9sLmNvbS9hdXRoL3JlYWxtcy9jZ2NzLWRldiIsImF1ZCI6WyJicm9rZXIiLCJjbG91ZGdyb3VuZGNvbnRyb2wtZGV2Il0sInN1YiI6ImRjZmNjYjlhLTk3NTktNGVjYy1hZWQ5LTA5ZGI2YmI0NTk3MyIsInR5cCI6IkJlYXJlciIsImF6cCI6ImNsb3VkZ3JvdW5kY29udHJvbC1zdGciLCJzZXNzaW9uX3N0YXRlIjoiOTljZDBhNTMtN2ExYi00ZTAyLWE0MGItNmNlN2MzZGRlOWMyIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIqIl0sInJlc291cmNlX2FjY2VzcyI6eyJicm9rZXIiOnsicm9sZXMiOlsicmVhZC10b2tlbiJdfSwiY2xvdWRncm91bmRjb250cm9sLWRldiI6eyJyb2xlcyI6WyJVc2VyIEFkbWluaXN0cmF0aW9uIl19LCJjbG91ZGdyb3VuZGNvbnRyb2wtc3RnIjp7InJvbGVzIjpbIlVzZXIgQWRtaW5pc3RyYXRpb24iXX19LCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJMdWFuIFRyYW4iLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJsdWFuLnRyYW5AYWR2YW5jZWRuYXZpZ2F0aW9uLmNvbSIsImdpdmVuX25hbWUiOiJMdWFuIiwiZmFtaWx5X25hbWUiOiJUcmFuIiwiZW1haWwiOiJsdWFuLnRyYW5AYWR2YW5jZWRuYXZpZ2F0aW9uLmNvbSJ9.ASSbkTp9NQnMYWFh-K1chtdruM2vn-s5YEvNyTSpkYlvgWo4ue7mJ3Q1YKLAEuP6WIezXhujnCThSnqXSu1dJTgJARzOUlhorhC8IouUqNcpr_DIdmI-uYpzKLTc_Y2GkMm_StNpUjs7kKIZicMCuVvAjTCPHYrr2u3SnEMie8m-Y_gA';
        const headers = {
            Authorization: jwtToken,
            contentType: "application/octet-stream"
        };

        var socket = new WebSocket('ws://127.0.0.1:9090/ws-manualcontrol');
        this.stompClient = Stomp.over(socket);
        this.stompClient.connect({
            Authorization: jwtToken,
            "content-type": "application/octet-stream"
        }, (frame: any) => {
            this.setConnected(true);
            console.log('Connected: ' + frame);
            this.stompClient.subscribe('/topic/greetings', (greeting: any) => {
                this.showGreeting(JSON.parse(greeting.body).content);
            });
        });
    }

    disconnect = () => {
        if (this.stompClient !== null) {
            this.stompClient.disconnect();
        }
        this.setConnected(false);
        console.log("Disconnected");
    }

    sendManualControl = (manualConrtol: any) => {
        console.log("Sending manual control");
        const manualControl = {
            xAxis: 0.6,
            yAxis: 0.5,
            zAxis: 0.3,
            rAxis: 0.8
        };
        let encode = this.manualControlProtobuf.encode(manualControl).finish();
        console.log(encode);
        const decoded = this.manualControlProtobuf.decode(encode);
        console.log(decoded);
        this.stompClient.send("/app/ws-manualcontrol", {"content-type": "application/octet-stream", "vehicleId": "luant-drone"}, encode);//application/octet-stream
    }

    setConnected = (connected: boolean) => {
        this.setState({connected})
    }

    showGreeting = (message: string) => {
        // $("#greetings").append("<tr><td>" + message + "</td></tr>");
        console.log(message);
    }

    render() {
        return (
            <>
                <button id="connect" className="btn btn-default" type="submit" ref={this.connectButtonRef}
                        onClick={this.connect} disabled={this.state.connected}>Connect
                </button>
                <button id="disconnect" className="btn btn-default" type="submit" disabled={!this.state.connected}
                        ref={this.disconnectButtonRef} onClick={this.disconnect}>Disconnect
                </button>
                <button id="send" className="btn btn-default" onClick={this.sendManualControl}>Send Manual Control</button>

                <select id="serverSelector" onChange={this.onManualControlUrlChanged}>
                    <option value="http://192.168.1.64:9090" defaultValue={"https://192.168.1.64:9090"}>Localhost
                    </option>
                    <option value="http://192.168.1.184:8082">Staging</option>
                </select>
                {/*<p style={{padding: "10 10 10 10"}}>*/}
                {/*    <Gamepad ref={this.gamepadRef} disabled={false}>*/}
                {/*        <React.Fragment/>*/}
                {/*    </Gamepad>*/}
                {/*</p>*/}
            </>
        )
    }

    onManualControlUrlChanged = (evt: any) => {
        const manualControlUrl = evt.target.value + "/manual-control";
        this.gamepadRef.current.changeManualControlUrl(manualControlUrl);
    }
}

export default App;
