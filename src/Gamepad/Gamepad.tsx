import React, {Component} from 'react';

import ReactGamepad from 'react-gamepad'
import {Joystick} from "react-joystick-component";
import {IJoystickUpdateEvent} from "react-joystick-component/build/lib/Joystick";

class Gamepad extends Component<any, { x: number, y: number, z: number, r: number, commandType: string, isConnected: boolean }> {
    intervalHandler: any;

    joystickSize: number;
    leftJoystickRef: any;
    rightJoystickRef: any;

    readonly COMMAND_TYPE = {
        NAVIGATION: "NAVIGATION",
        ARM: "ARM"
    };

    constructor(props: any) {
        super(props);

        this.state = {
            x: 0,
            y: 0,
            z: 0,
            r: 0,
            commandType: "NAVIGATION",
            isConnected: false
        };

        this.rightJoystickRef = React.createRef();
        this.leftJoystickRef = React.createRef();
        this.joystickSize = 100;

        this.sendRequest();
    }

    componentDidMount() {
        this.intervalHandler = setInterval(this.sendRequest, 300)
    }

    componentWillUnmount() {
        clearInterval(this.intervalHandler)
    }

    connectHandler = (gamepadIndex: number) => {
        console.log(`Gamepad ${gamepadIndex} connected !`)
        this.setState({isConnected: true});
    }

    disconnectHandler = (gamepadIndex: number) => {
        console.log(`Gamepad ${gamepadIndex} disconnected !`)
        this.setState({isConnected: false})
    }

    buttonChangeHandler = (buttonName: string, down: boolean) => {
        console.log(buttonName, down);
        if (buttonName === 'Start') {
            if (down) {
                this.setState({
                    commandType: this.COMMAND_TYPE.ARM
                });
            } else {
                this.setState({
                    commandType: this.COMMAND_TYPE.NAVIGATION
                });
            }
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
            const x = value
            this.setState({x})
        }
        if (axisName === "RightStickY") {
            const y = value;
            this.setState({y})
        }
    }

    buttonDownHandler = (buttonName: string) => {
        console.log(buttonName, 'down');
    }

    buttonUpHandler = (buttonName: string) => {
        console.log(buttonName, 'up');
    }

    sendRequest = () => {
        // if (this.isGamepadDisabled()) {
        if (true) {
            const jBody = {
                "data": {
                    "type": "manual-control",
                    "attributes": {
                        "xAxis": -this.state.x,
                        "yAxis": -this.state.y,
                        "zAxis": this.state.z,
                        "rAxis": this.state.r,
                        "commandType": this.state.commandType
                    },
                    "relationships": {
                        "vehicle": {
                            "data": {
                                // "id": "6ed26ba8-1901-4bb4-981b-21b2c782b7fc",
                                "id": "luant-drone",
                                "type": "vehicles"
                            }
                        }
                    }
                }
            };

            const url = this.manualControlUrl;

            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/vnd.api+json",
                    "Access-Control-Allow-Origin": "*",
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
                    , 'Accept': 'application/vnd.api+json'
                }
                , body: JSON.stringify(jBody)
            }).then(res => {
                // console.log("Request complete! response:", res);
            }).catch(err => {

            });
        }
    }

    webRightJoystickHandler = (event: IJoystickUpdateEvent) => {
        const y = this.normalizeMousePositionToWebJoystickValue((event.x == null) ? 0 : event.x);
        const x = this.normalizeMousePositionToWebJoystickValue((event.y == null) ? 0 : event.y);
        this.setState({
            x: -x,
            y: -y
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
        const disabled = this.props.isDisabled;
        if (disabled !== undefined) {
            return false;
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
                            Z: <meter value={this.state.z + 0.5} id="zMeter"></meter>
                            <br/> R: <meter value={this.state.r + 0.5} id="rMeter"></meter>
                        </div>
                        <div style={{float: "left"}}>
                            <button style={{width: "100px"}}>Arm</button>
                        </div>
                        <div style={{float: "left"}}>
                            <Joystick throttle={28} size={this.joystickSize} baseColor="black"
                                      ref={this.rightJoystickRef}
                                      move={this.webRightJoystickHandler} key={"rightJoyStick"}
                                      stop={this.balanceState}>Right</Joystick>
                            X: <meter value={this.state.x + 0.5} id="xMeter"></meter>
                            <br/> Y: <meter value={this.state.y + 0.5} id="yMeter"></meter>
                        </div>
                    </div>



                </div>
            </ReactGamepad>
        )
    }

    // Convenient variables + methods
    manualControlUrl: string = "192.168.1.64:9090/manual-control";

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