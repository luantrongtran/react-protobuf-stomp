import React, {Component} from 'react';

import ReactGamepad from 'react-gamepad'
import {Joystick} from "react-joystick-component";
import {IJoystickUpdateEvent} from "react-joystick-component/build/lib/Joystick";
import {load, Root} from "protobufjs";

const Stomp = require('stompjs');

enum CommandType {
    NAVIGATION,
    ARM
};

class Gamepad extends Component<{ disabled: boolean }, { x: number, y: number, z: number, r: number, commandType: string, isControllerConnected: boolean,
                                                                isWebSocketConnected: boolean}> {
    intervalHandler: any;

    joystickSize: number;
    leftJoystickRef: any;
    rightJoystickRef: any;

    manualControlProtobuf: any;

    stompClient: any;

    constructor(props: any) {
        super(props);

        this.state = {
            x: 0,
            y: 0,
            z: 0,
            r: 0,
            commandType: "NAVIGATION",
            isControllerConnected: false,
            isWebSocketConnected: false
        };

        this.rightJoystickRef = React.createRef();
        this.leftJoystickRef = React.createRef();
        this.joystickSize = 100;

        load('/websocket.proto', (err: (Error | null), root?: Root) => {
            console.log('Loading proto file');
            if (err || root === undefined) {
                console.error('failed to load proto file');
                throw err;
            }

            // example code
            this.manualControlProtobuf = root.lookupType('ManualControl');
        });

        this.sendRequest();
    }

    /**
     * To update the websocket connection
     * @param isConnected
     */
    setConnected = (isConnected: boolean) => {
        this.setState({isWebSocketConnected: isConnected})
    }

    connect = () => {
        if (this.state.isWebSocketConnected == true) {
            // if already connected
            return;
        }
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
        });
    }

    disconnect = () => {
        if (this.stompClient !== null) {
            this.stompClient.disconnect();
        }
        this.setConnected(false);
        console.log("Disconnected");
    }

    sendManualControl = (manualControl: any) => {
        if (this.state.isWebSocketConnected === false) {
            console.log("Cannot manual control - connection closed");
        }
        console.log("Sending manual control");
        // const manualControl = {
        //     xAxis: 0.6,
        //     yAxis: 0.5,
        //     zAxis: 0.3,
        //     rAxis: 0.8,
        // };
        let encode = this.manualControlProtobuf.encode(manualControl).finish();
        console.log(encode);
        const decoded = this.manualControlProtobuf.decode(encode);
        console.log(decoded);


        this.stompClient.send("/app/ws-manualcontrol", {
            "content-type": "application/octet-stream",
            "vehicleId": "luant-drone"
        }, encode);//application/octet-stream
    }

    componentDidMount() {
        this.intervalHandler = setInterval(this.sendRequest, 300)
    }

    componentWillUnmount() {
        clearInterval(this.intervalHandler)
    }

    connectHandler = (gamepadIndex: number) => {
        console.log(`Gamepad ${gamepadIndex} connected !`)
        // this.setState({isConnected: true});
        this.connect();
    }

    disconnectHandler = (gamepadIndex: number) => {
        console.log(`Gamepad ${gamepadIndex} disconnected !`)
        // this.setState({isConnected: false})
        this.disconnect();
    }

    buttonChangeHandler = (buttonName: string, down: boolean) => {
        console.log(buttonName, down);
        if (buttonName === 'Start') {
            this.arm();
        }
    }

    axisChangeHandler = (axisName: string, value: number, previousValue: number) => {
        if (axisName === "LeftStickX") {
            const r = value;
            this.setState({r})
        }
        if (axisName === "LeftStickY") {
            const z = value;
            this.setState({z})
        }
        if (axisName === "RightStickX") {
            const x = -value
            this.setState({x})
        }
        if (axisName === "RightStickY") {
            const y = -value;
            this.setState({y})
        }
    }

    buttonDownHandler = (buttonName: string) => {
        console.log(buttonName, 'down');
    }

    buttonUpHandler = (buttonName: string) => {
        console.log(buttonName, 'up');
    }

    arm = () => {
        if (!this.isGamepadDisabled() && this.state.isWebSocketConnected) {
            // if (true) {
            const data =
                {
                    "xAxis": this.state.x,
                    "yAxis": this.state.y,
                    "zAxis": this.state.z,
                    "rAxis": this.state.r,
                    "commandType": CommandType.ARM
                };

            this.sendManualControl(data);
            //     const url = this.manualControlUrl;
            //
            //     fetch(url, {
            //         method: "POST",
            //         headers: {
            //             "Content-Type": "application/vnd.api+json",
            //             "Access-Control-Allow-Origin": "*",
            //             'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
            //             , 'Accept': 'application/vnd.api+json'
            //         }
            //         , body: JSON.stringify(jBody)
            //     }).then(res => {
            //         // console.log("Request complete! response:", res);
            //     }).catch(err => {
            //
            //     });
        }
    }

    startManualControl = () => {
        this.connect();
    }

    sendRequest = () => {
        const shouldSendRequest = !this.isGamepadDisabled() && this.state.isWebSocketConnected === true
        if (shouldSendRequest) {

            const data = {
                "xAxis": this.state.x,
                "yAxis": this.state.y,
                "zAxis": this.state.z,
                "rAxis": this.state.r,
                "commandType": CommandType.NAVIGATION
            };

            this.sendManualControl(data);
        }
    }

    webRightJoystickHandler = (event: IJoystickUpdateEvent) => {
        const y = this.normalizeMousePositionToWebJoystickValue((event.x == null) ? 0 : event.x);
        const x = this.normalizeMousePositionToWebJoystickValue((event.y == null) ? 0 : event.y);
        this.setState({
            x: x,
            y: y
        });
    }

    webLeftJoystickHandler = (event: IJoystickUpdateEvent) => {
        const z = this.normalizeMousePositionToWebJoystickValue((event.y == null) ? 0 : event.y);
        const r = this.normalizeMousePositionToWebJoystickValue(((event.x == null) ? 0 : event.x));
        this.setState({
            z,
            r
        })
    }

    normalizeMousePositionToWebJoystickValue = (mousePosition: number) => {
        const maxMouseValue = this.joystickSize / 2;

        const min = -maxMouseValue;
        const max = maxMouseValue;

        const result = 2 * ((mousePosition) / (max - min));

        return result;
    }

    isGamepadDisabled = () => {
        let disabled = this.props.disabled || !this.state.isControllerConnected;
        if (disabled !== undefined) {
            disabled = false;
        }
        return disabled;
    }

    render() {
        return (
            <ReactGamepad
                onConnect={this.connectHandler}
                onDisconnect={this.disconnectHandler}

                onButtonChange={this.buttonChangeHandler}
                onAxisChange={this.axisChangeHandler}
            >
                <div>
                    <div>
                        <div style={{float: "left"}}>
                            <Joystick throttle={28} size={this.joystickSize} baseColor="black"
                                      ref={this.leftJoystickRef}
                                      key="leftJoystick"
                                      move={this.webLeftJoystickHandler}
                                      stop={this.balanceState}>Left</Joystick>
                            <p>
                                <label htmlFor="zMeter">T:</label>
                                <meter value={this.state.z + 0.5} id="zMeter"></meter>
                            </p>
                            <p>
                                <label htmlFor={"rMeter"}>Y:</label>
                                <meter value={this.state.r + 0.5} id="rMeter"></meter>
                            </p>
                        </div>
                        <div style={{float: "left"}}>
                            <button onClick={this.startManualControl} style={{width: "100px"}}>Start manual control</button>
                        </div>
                        <div style={{float: "left"}}>
                            <button onClick={this.arm} style={{width: "100px"}}>Arm</button>
                        </div>
                        <div style={{float: "left"}}>
                            <Joystick throttle={28} size={this.joystickSize} baseColor="black"
                                      ref={this.rightJoystickRef}
                                      move={this.webRightJoystickHandler} key={"rightJoyStick"}
                                      stop={this.balanceState}>Right</Joystick>
                            <p>
                                <label htmlFor="xMeter">P:</label>
                                <meter value={(this.state.x + 0.5)} id="xMeter"></meter>
                            </p>
                            <p>
                                <label htmlFor="yMeter">R:</label>
                                <meter value={(this.state.y + 0.5)} id="yMeter"></meter>
                            </p>
                        </div>
                    </div>


                </div>
            </ReactGamepad>
        )
    }

    // Convenient variables + methods
    manualControlUrl: string = "http://localhost:9090/manual-control";

    changeManualControlUrl = (newUrl: string) => {
        this.manualControlUrl = newUrl;
        console.log(this.manualControlUrl);
    }

    balanceState = () => {
        this.setState({
            x: 0,
            y: 0,
            z: 0,
            r: 0
        });
    }
}

export default Gamepad;