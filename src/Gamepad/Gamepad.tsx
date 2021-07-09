import React, {Component} from 'react';

import ReactGamepad from 'react-gamepad'
import {Joystick} from "react-joystick-component";
import {IJoystickUpdateEvent} from "react-joystick-component/build/lib/Joystick";
import {load, Root} from "protobufjs";

import { Client } from '@stomp/stompjs';

enum CommandType {
    NAVIGATION,
    ARM,
    GIMBAL_CONTROL
};

class Gamepad extends Component<{ disabled: boolean }, { x: number, y: number, z: number, r: number, commandType: string, isControllerConnected: boolean,
                                                                isWebSocketConnected: boolean}> {
    intervalHandler: any;

    joystickSize: number;
    leftJoystickRef: any;
    rightJoystickRef: any;

    manualControlProtobuf: any;

    stompClient: any;

    vehicleId: String = "luant-drone";//demo_px4_drone_0001//"1a4ec7e5f7ce2d32ff125f5a57d52dbcb747ca8f7f17c514370584464dfe8df1";
    // vehicleId: String = "329bc8a162ae7208ae18976a9c4f95e9344b9ede18ec4126224b199e39dc1156";//"885ca38fe26b10ee60f7f7017413065dbcd41985ed8515ddbc27938eddcb64ba";//

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
        const jwtToken = 'eyJhbGciOiJFUzUxMiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICItZTQ2Tm5iTXNRbG03ZjdUc0U2Rl9uSUkzakFOQ0NvN0ttNDJPMGFXdUxFIn0.eyJleHAiOjE2MjU3MzczMjAsImlhdCI6MTYyNTcwODUyMSwiYXV0aF90aW1lIjoxNjI1NzA4NTIwLCJqdGkiOiI0MjI4ZjI2MC1kN2EzLTQ5ZjgtOTg2My01ZjFiNzE3ZjRiZmEiLCJpc3MiOiJodHRwczovL2FwYWMuY2xvdWRncm91bmRjb250cm9sLmNvbS9hdXRoL3JlYWxtcy9jZ2NzLWRldiIsImF1ZCI6WyJicm9rZXIiLCJjbG91ZGdyb3VuZGNvbnRyb2wtZGV2Il0sInN1YiI6ImRjZmNjYjlhLTk3NTktNGVjYy1hZWQ5LTA5ZGI2YmI0NTk3MyIsInR5cCI6IkJlYXJlciIsImF6cCI6ImNsb3VkZ3JvdW5kY29udHJvbC1zdGciLCJzZXNzaW9uX3N0YXRlIjoiM2JjNmZjMTctYzRjYi00ZTUwLWFmMzYtMzc3ODNjMzg5M2IxIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIqIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJjZ2NfbWlzc2lvbl9tYW5hZ2VyIiwiY2djX3ZlaGljbGVfbWFuYWdlciIsImNnY192ZWhpY2xlX29wZXJhdG9yIiwiY2djX2FkbWluaXN0cmF0b3IiLCJjZ2NfdmVoaWNsZV9waWxvdCJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImJyb2tlciI6eyJyb2xlcyI6WyJyZWFkLXRva2VuIl19LCJjbG91ZGdyb3VuZGNvbnRyb2wtZGV2Ijp7InJvbGVzIjpbIlVzZXIgQWRtaW5pc3RyYXRpb24iXX0sImNsb3VkZ3JvdW5kY29udHJvbC1zdGciOnsicm9sZXMiOlsiVXNlciBBZG1pbmlzdHJhdGlvbiJdfX0sInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmFtZSI6Ikx1YW4gVHJhbiIsInByZWZlcnJlZF91c2VybmFtZSI6Imx1YW4udHJhbkBhZHZhbmNlZG5hdmlnYXRpb24uY29tIiwiZ2l2ZW5fbmFtZSI6Ikx1YW4iLCJmYW1pbHlfbmFtZSI6IlRyYW4iLCJlbWFpbCI6Imx1YW4udHJhbkBhZHZhbmNlZG5hdmlnYXRpb24uY29tIn0.AM2CkVSY6_QRgFAr3Fhsim8-3VfJ4Xjnn8hvq_M7MnfYfLaauybhOJLTtJuVm6T5R3a7_vrXkK7b1XOZyRad57BSAZhze5g5Vt_GnNm6QugZmAnwhOdvPpJ-5U8Q4hf5_HcH1PhTrRkN41XUwrZd7lEasfL5mNzyg6gpoNpwnK6YVCLs';

        // const wssUrl = "wss://apac.cloudgroundcontrol.com/api/ws-vehicles";
        const wssUrl = "ws://localhost:9090/ws-vehicles";
        // const wssUrl = "wss://uat.cloudgroundcontrol.com/api/ws-vehicles";
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

        // this.subscribe();
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

        console.log(manualConrtol);
        this.stompClient.publish({ destination:'/app/manual-control', binaryBody: encode, headers:  {"content-type": "application/octet-stream", "vehicleId": this.vehicleId} });
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

                    "cameraGimbalYaw": this.state.x,
                    "cameraGimbalPitch": this.state.y,

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
        var yaw = 0;//-this.state.y * 5
        var yawUnit = 5;
        if (this.state.y < 0) {
            yaw = -yawUnit;
        } else if (this.state.y >0){
            yaw = yawUnit;
        }
        var pitch = 0; //this.state.x * 5
        var pitchUnit = 5;
        if (this.state.x < 0) {
            pitch = -pitchUnit;
        } else if (this.state.x > 0) {
            pitch = pitchUnit;
        }
        if (shouldSendRequest) {

            const data = {
                "xAxis": this.state.x,
                "yAxis": this.state.y,
                "zAxis": this.state.z,
                "rAxis": this.state.r,

                "cameraGimbalYaw": -yaw * 3,
                "cameraGimbalPitch": pitch,

                "commandType": CommandType.NAVIGATION
            };

            console.log(data.cameraGimbalYaw);
            this.sendManualControl(data);
        }
    };

    webRightJoystickHandler = (event: IJoystickUpdateEvent) => {
        const y = this.normalizeMousePositionToWebJoystickValue((event.x == null) ? 0 : event.x);
        const x = this.normalizeMousePositionToWebJoystickValue((event.y == null) ? 0 : event.y);
        this.setState({
            x: x,
            y: y
        });
    };

    webLeftJoystickHandler = (event: IJoystickUpdateEvent) => {
        const z = this.normalizeMousePositionToWebJoystickValue((event.y == null) ? 0 : event.y);
        const r = this.normalizeMousePositionToWebJoystickValue(((event.x == null) ? 0 : event.x));
        this.setState({
            z,
            r
        })
    };

    normalizeMousePositionToWebJoystickValue = (mousePosition: number) => {
        const maxMouseValue = this.joystickSize / 2;

        const min = -maxMouseValue;
        const max = maxMouseValue;

        const result = 2 * ((mousePosition) / (max - min));

        return result;
    };

    isGamepadDisabled = () => {
        let disabled = this.props.disabled || !this.state.isControllerConnected;
        if (disabled !== undefined) {
            disabled = false;
        }
        return disabled;
    };

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
    manualControlUrl: string = "https://uat.cloudgroundcontrol.com"; //http://localhost:9090/manual-control";

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