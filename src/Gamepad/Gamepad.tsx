import React, {Component} from 'react';

import ReactGamepad from 'react-gamepad'
import {Joystick} from "react-joystick-component";
import {IJoystickUpdateEvent} from "react-joystick-component/build/lib/Joystick";
import {load, Root} from "protobufjs";

import { Client } from '@stomp/stompjs';

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
            console.log('Loading proto file 1');
            if (err || root === undefined) {
                console.error('failed to load proto file');
                throw err;
            }

            // example code
            this.manualControlProtobuf = root.lookupType('ManualControl');
        });

        // this.sendRequest();
    }

    /**
     * To update the websocket connection
     * @param isConnected
     */
    setConnected = (isConnected: boolean) => {
        this.setState({isWebSocketConnected: isConnected})
    }

    connect = () => {
        const jwtToken = 'eyJhbGciOiJFUzUxMiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICItZTQ2Tm5iTXNRbG03ZjdUc0U2Rl9uSUkzakFOQ0NvN0ttNDJPMGFXdUxFIn0.eyJleHAiOjE2MTE3MzE4NTAsImlhdCI6MTYxMTcwMzA1MCwiYXV0aF90aW1lIjoxNjExNzAzMDQ5LCJqdGkiOiJmZDAyNGJhZS1hYjE1LTRhOTQtOGNjNC1lMTY3MjZkN2ZhZDgiLCJpc3MiOiJodHRwczovL2FwYWMuY2xvdWRncm91bmRjb250cm9sLmNvbS9hdXRoL3JlYWxtcy9jZ2NzLWRldiIsImF1ZCI6WyJicm9rZXIiLCJjbG91ZGdyb3VuZGNvbnRyb2wtZGV2Il0sInN1YiI6ImRjZmNjYjlhLTk3NTktNGVjYy1hZWQ5LTA5ZGI2YmI0NTk3MyIsInR5cCI6IkJlYXJlciIsImF6cCI6ImNsb3VkZ3JvdW5kY29udHJvbC1zdGciLCJzZXNzaW9uX3N0YXRlIjoiYzQ3MzdiM2EtOTM2YS00MGRjLWFmZmItOTFhMTkzNGFkYTAzIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIqIl0sInJlc291cmNlX2FjY2VzcyI6eyJicm9rZXIiOnsicm9sZXMiOlsicmVhZC10b2tlbiJdfSwiY2xvdWRncm91bmRjb250cm9sLWRldiI6eyJyb2xlcyI6WyJVc2VyIEFkbWluaXN0cmF0aW9uIl19LCJjbG91ZGdyb3VuZGNvbnRyb2wtc3RnIjp7InJvbGVzIjpbIlVzZXIgQWRtaW5pc3RyYXRpb24iXX19LCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJMdWFuIFRyYW4iLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJsdWFuLnRyYW5AYWR2YW5jZWRuYXZpZ2F0aW9uLmNvbSIsImdpdmVuX25hbWUiOiJMdWFuIiwiZmFtaWx5X25hbWUiOiJUcmFuIiwiZW1haWwiOiJsdWFuLnRyYW5AYWR2YW5jZWRuYXZpZ2F0aW9uLmNvbSJ9.AQAlKDiZlwI74QU4O-khoFBclHYuX6jWUQ0vyVVudCp0OXib4Ner53Xwx7PNSSF2VNmPRpXl_FZNNCajy38lpJ_MASI4FcfY_CFPvnm5nW3bCHda0ydVx3jNR2q4iIleRaiMvX1jYHlsYv2R9VZOKwRU8YlRcwl5IB84DWJzKZbYbjNJ';

        // const wssUrl = "wss://apac.cloudgroundcontrol.com/api/ws-vehicles";
        const wssUrl = "ws://localhost:9090/ws-vehicles";
        this.stompClient = new Client({
            brokerURL: wssUrl,
            debug: function (str: string) {
                // console.log('WS debug: ', str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            webSocketFactory: function () {
                return new WebSocket(wssUrl, []);
            },
            connectHeaders: { Authorization: jwtToken },
        });

        this.stompClient.onConnect = () => {
            console.log("WS connected");
            this.setState({isWebSocketConnected: true});
        };
        this.stompClient.onDisconnect = () => {
            console.log("WS disconnected");
        };
        this.stompClient.onStompError = (err: any) => {
            console.log("WS error" + err);
        };

        this.stompClient.connectHeaders = {Authorization: jwtToken};
        this.stompClient.activate();

        this.subscribe();
    }

    subscribe = () => {
        // const destination = "/users/queue/operation/luant-drone";
        const destination = "/users/queue/operation/329bc8a162ae7208ae18976a9c4f95e9344b9ede18ec4126224b199e39dc1156";
        console.log("subscribing to operation");

        this.stompClient.subscribe(destination, (res:any) => {
            try {
                console.log(res);
            } catch (err) {
                console.error(err);
            }
        }, {});
    }

    disconnect = () => {
        if (this.stompClient !== null) {
            this.stompClient.deactivate();
        }

        this.setConnected(false);
        console.log("Disconnected");
    }

    sendManualControl = (manualConrtol: any) => {
        console.log("Sending manual control");
        // const manualControl = {
        //     xAxis: 0.6,
        //     yAxis: 0.5,
        //     zAxis: 0.3,
        //     rAxis: 0.8,
        //     commandType: CommandType.ARM
        // };
        // console.log(manualControl);
        let encode = this.manualControlProtobuf.encode(manualConrtol).finish();
        // console.log(encode);
        // const decoded = this.manualControlProtobuf.decode(encode);
        // console.log(decoded);

        this.stompClient.publish({ destination:'/app/manual-control', binaryBody: encode, headers:  {"content-type": "application/octet-stream", "vehicleId": "luant-drone"} });
    }

    componentDidMount() {
        this.intervalHandler = setInterval(this.sendRequest, 300);
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