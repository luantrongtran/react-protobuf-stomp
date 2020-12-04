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
            // const manualControl = {
            //     xAxis: 1,
            //     yAxis: 1,
            //     zAxis: 1,
            //     rAxis: 1
            // };
            // let encode = this.manualControlProtobuf.encode(manualControl).finish();
            // console.log(encode);
            // const decoded = this.manualControlProtobuf.decode(encode);
            // console.log(decoded);
            // const vehiclePos = vehiclePosition.create({
            //     id: 'luant-drone-whatever',
            //     lat: 65,
            //     lon: 64,
            //     alt: 63,
            //     hdg: 62,
            // });
            // const buffer = vehiclePosition.encode(vehiclePos).finish();
            // let expectedDecoded = vehiclePosition.decode(buffer);
        });
    }

    connect = () => {
        console.log("Connecting to websocket");
        console.log(this.manualControlProtobuf);
        const jwtToken = '';
        const headers = {
            "Authorization": jwtToken
        };

        var socket = new WebSocket('ws://127.0.0.1:9090/ws-manualcontrol');
        this.stompClient = Stomp.over(socket);
        this.stompClient.connect({Authorization: jwtToken}, (frame: any) => {
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
            xAxis: 1,
            yAxis: 1,
            zAxis: 1,
            rAxis: 1
        };
        let encode = this.manualControlProtobuf.encode(manualControl).finish();
        console.log(encode);
        const decoded = this.manualControlProtobuf.decode(encode);
        console.log(decoded);
        this.stompClient.send("/app/ws-manualcontrol", {"content-type": "application/x-binary"}, encode);//application/octet-stream
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
