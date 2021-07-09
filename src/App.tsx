import React, {Component, ElementRef} from 'react';
import './App.css';
import {load, Root} from 'protobufjs';
import Gamepad from "./Gamepad/Gamepad";
import {Client} from '@stomp/stompjs';


enum CommandType {
    NAVIGATION,
    ARM,
    GIMBAL_CONTROL
};

class App extends Component<{}, { connected: boolean }> {

    gamepadRef: any;
    stompClient: any;
    connectButtonRef: any;
    disconnectButtonRef: any;

    manualControlProtobuf: any;
    vehiclePositionProtobuf: any;
    operationProtobuf: any;

    jwtTokenInputRef: any;

    vehicleId: String = "luant-drone"; // "1a4ec7e5f7ce2d32ff125f5a57d52dbcb747ca8f7f17c514370584464dfe8df1";//demo_px4_drone_0001
    // vehicleId: String = "329bc8a162ae7208ae18976a9c4f95e9344b9ede18ec4126224b199e39dc1156"


    constructor(props: any) {
        super(props);

        this.gamepadRef = React.createRef();
        this.connectButtonRef = React.createRef();
        this.disconnectButtonRef = React.createRef();
        this.jwtTokenInputRef = React.createRef();
        this.state = {
            connected: false
        };

        load('/websocket.proto', (err: (Error | null), root?: Root) => {
            console.log('Loading proto file');
            if (err || root === undefined) {
                console.error('failed to load proto file');
                throw err;
            }

            // example code
            this.manualControlProtobuf = root.lookupType('ManualControl');
            this.vehiclePositionProtobuf = root.lookupType('VehiclePosition');
            this.operationProtobuf = root.lookupType('Operation');
        });
    }

    connect = () => {

        console.log("App.tsx connected websocket")

        var jwtToken =  this.jwtTokenInputRef.current.value;
        // const jwtToken = 'eyJhbGciOiJFUzUxMiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICItZTQ2Tm5iTXNRbG03ZjdUc0U2Rl9uSUkzakFOQ0NvN0ttNDJPMGFXdUxFIn0.eyJleHAiOjE2MjA3MjEwOTMsImlhdCI6MTYyMDY5MjI5NSwiYXV0aF90aW1lIjoxNjIwNjkyMjkzLCJqdGkiOiJhZjEzZTQxNy1jMmQwLTQwZDQtOGVjZi1lMzc1ZjQyMDE0ODAiLCJpc3MiOiJodHRwczovL2FwYWMuY2xvdWRncm91bmRjb250cm9sLmNvbS9hdXRoL3JlYWxtcy9jZ2NzLWRldiIsImF1ZCI6WyJicm9rZXIiLCJjbG91ZGdyb3VuZGNvbnRyb2wtZGV2Il0sInN1YiI6ImRjZmNjYjlhLTk3NTktNGVjYy1hZWQ5LTA5ZGI2YmI0NTk3MyIsInR5cCI6IkJlYXJlciIsImF6cCI6ImNsb3VkZ3JvdW5kY29udHJvbC1zdGciLCJzZXNzaW9uX3N0YXRlIjoiZDUzZThkYTUtMTAzYS00OTI3LWI2YjEtYmIwNDY1ZmQ5YmFiIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIqIl0sInJlc291cmNlX2FjY2VzcyI6eyJicm9rZXIiOnsicm9sZXMiOlsicmVhZC10b2tlbiJdfSwiY2xvdWRncm91bmRjb250cm9sLWRldiI6eyJyb2xlcyI6WyJVc2VyIEFkbWluaXN0cmF0aW9uIl19LCJjbG91ZGdyb3VuZGNvbnRyb2wtc3RnIjp7InJvbGVzIjpbIlVzZXIgQWRtaW5pc3RyYXRpb24iXX19LCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJMdWFuIFRyYW4iLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJsdWFuLnRyYW5AYWR2YW5jZWRuYXZpZ2F0aW9uLmNvbSIsImdpdmVuX25hbWUiOiJMdWFuIiwiZmFtaWx5X25hbWUiOiJUcmFuIiwiZW1haWwiOiJsdWFuLnRyYW5AYWR2YW5jZWRuYXZpZ2F0aW9uLmNvbSJ9.AcQL9PbmCXznVTYtVBjcMHNakK1HbVp6Km2JTEPeacoPLg3sB0MmL5EYjshTdtiOZKULHQDeSazr7UfXv84eAblzAJEXt2qiTB5KneCRmF0HGHGM11V8ECOBOVPkHXoQp1lh50qUeH1nVG_x6svSf4acPG3ckROiKcLT0Oc-CsPHkedj';
        if (jwtToken == '') {
            jwtToken = 'eyJhbGciOiJFUzUxMiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICItZTQ2Tm5iTXNRbG03ZjdUc0U2Rl9uSUkzakFOQ0NvN0ttNDJPMGFXdUxFIn0.eyJleHAiOjE2MjU3MzczMjAsImlhdCI6MTYyNTcwODUyMSwiYXV0aF90aW1lIjoxNjI1NzA4NTIwLCJqdGkiOiI0MjI4ZjI2MC1kN2EzLTQ5ZjgtOTg2My01ZjFiNzE3ZjRiZmEiLCJpc3MiOiJodHRwczovL2FwYWMuY2xvdWRncm91bmRjb250cm9sLmNvbS9hdXRoL3JlYWxtcy9jZ2NzLWRldiIsImF1ZCI6WyJicm9rZXIiLCJjbG91ZGdyb3VuZGNvbnRyb2wtZGV2Il0sInN1YiI6ImRjZmNjYjlhLTk3NTktNGVjYy1hZWQ5LTA5ZGI2YmI0NTk3MyIsInR5cCI6IkJlYXJlciIsImF6cCI6ImNsb3VkZ3JvdW5kY29udHJvbC1zdGciLCJzZXNzaW9uX3N0YXRlIjoiM2JjNmZjMTctYzRjYi00ZTUwLWFmMzYtMzc3ODNjMzg5M2IxIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIqIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJjZ2NfbWlzc2lvbl9tYW5hZ2VyIiwiY2djX3ZlaGljbGVfbWFuYWdlciIsImNnY192ZWhpY2xlX29wZXJhdG9yIiwiY2djX2FkbWluaXN0cmF0b3IiLCJjZ2NfdmVoaWNsZV9waWxvdCJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImJyb2tlciI6eyJyb2xlcyI6WyJyZWFkLXRva2VuIl19LCJjbG91ZGdyb3VuZGNvbnRyb2wtZGV2Ijp7InJvbGVzIjpbIlVzZXIgQWRtaW5pc3RyYXRpb24iXX0sImNsb3VkZ3JvdW5kY29udHJvbC1zdGciOnsicm9sZXMiOlsiVXNlciBBZG1pbmlzdHJhdGlvbiJdfX0sInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmFtZSI6Ikx1YW4gVHJhbiIsInByZWZlcnJlZF91c2VybmFtZSI6Imx1YW4udHJhbkBhZHZhbmNlZG5hdmlnYXRpb24uY29tIiwiZ2l2ZW5fbmFtZSI6Ikx1YW4iLCJmYW1pbHlfbmFtZSI6IlRyYW4iLCJlbWFpbCI6Imx1YW4udHJhbkBhZHZhbmNlZG5hdmlnYXRpb24uY29tIn0.AM2CkVSY6_QRgFAr3Fhsim8-3VfJ4Xjnn8hvq_M7MnfYfLaauybhOJLTtJuVm6T5R3a7_vrXkK7b1XOZyRad57BSAZhze5g5Vt_GnNm6QugZmAnwhOdvPpJ-5U8Q4hf5_HcH1PhTrRkN41XUwrZd7lEasfL5mNzyg6gpoNpwnK6YVCLs';
            // const jwtToken = 'eyJhbGciOiJFUzUxMiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICItZTQ2Tm5iTXNRbG03ZjdUc0U2Rl9uSUkzakFOQ0NvN0ttNDJPMGFXdUxFIn0.eyJleHAiOjE2MjUwNjI4NDEsImlhdCI6MTYyNTAzNDA0MiwiYXV0aF90aW1lIjoxNjI1MDM0MDQxLCJqdGkiOiJmMmZlMTBiYy1jMjUxLTQ0YjMtYjcyZC1kYTI3MGQ0MjEzNTkiLCJpc3MiOiJodHRwczovL2FwYWMuY2xvdWRncm91bmRjb250cm9sLmNvbS9hdXRoL3JlYWxtcy9jZ2NzLWRldiIsImF1ZCI6WyJicm9rZXIiLCJjbG91ZGdyb3VuZGNvbnRyb2wtZGV2Il0sInN1YiI6ImRjZmNjYjlhLTk3NTktNGVjYy1hZWQ5LTA5ZGI2YmI0NTk3MyIsInR5cCI6IkJlYXJlciIsImF6cCI6ImNsb3VkZ3JvdW5kY29udHJvbC1zdGciLCJzZXNzaW9uX3N0YXRlIjoiYWE1ODJhZGUtYjM3NS00OGU2LWI2MzQtZmE4N2MwZWRkMmQyIiwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIqIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJjZ2NfbWlzc2lvbl9tYW5hZ2VyIiwiY2djX3ZlaGljbGVfbWFuYWdlciIsImNnY192ZWhpY2xlX29wZXJhdG9yIiwiY2djX2FkbWluaXN0cmF0b3IiLCJjZ2NfdmVoaWNsZV9waWxvdCJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImJyb2tlciI6eyJyb2xlcyI6WyJyZWFkLXRva2VuIl19LCJjbG91ZGdyb3VuZGNvbnRyb2wtZGV2Ijp7InJvbGVzIjpbIlVzZXIgQWRtaW5pc3RyYXRpb24iXX0sImNsb3VkZ3JvdW5kY29udHJvbC1zdGciOnsicm9sZXMiOlsiVXNlciBBZG1pbmlzdHJhdGlvbiJdfX0sInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmFtZSI6Ikx1YW4gVHJhbiIsInByZWZlcnJlZF91c2VybmFtZSI6Imx1YW4udHJhbkBhZHZhbmNlZG5hdmlnYXRpb24uY29tIiwiZ2l2ZW5fbmFtZSI6Ikx1YW4iLCJmYW1pbHlfbmFtZSI6IlRyYW4iLCJlbWFpbCI6Imx1YW4udHJhbkBhZHZhbmNlZG5hdmlnYXRpb24uY29tIn0.AZ7BqkEnPeSww8sCuihGhPSLnDd3lMiEvkod8jf6HBFwiuUoSPg-1--6SrvyQC46Nprx2lfkoURagko4BkK_pNtqAdnkh6gRCmXEWThUjwMA_N0AulAhMYyUifrlvtUDhfjVA4bpyfGQil1Ttk6-PEqe4fO1O7_K3MA6OsXyadJ5htBb'
        }
        console.log(jwtToken);

        // const wssUrl = "wss://apac.cloudgroundcontrol.com/api/ws-vehicles";
        const wssUrl = "ws://localhost:9090/ws-vehicles";
        // const wssUrl = "ws://uat.cloudgroundcontrol.com/api/ws-vehicles";
        this.stompClient = new Client({
            brokerURL: wssUrl,
            // debug: function (str: string) {
            //     console.log('WS debug: ', str);
            // },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            webSocketFactory: function () {
                return new WebSocket(wssUrl, []);
            },
            connectHeaders: {Authorization: jwtToken},
        });

        this.stompClient.onConnect = (abc: any) => {
            console.log("WS connected");
            console.log(abc);
            this.subscribe();
        };
        this.stompClient.onDisconnect = () => {
            console.log("WS disconnected");
        };
        this.stompClient.onStompError = (err: any) => {
            console.log("WS error" + err);
            this.stompClient.deactivate();
        };

        this.stompClient.connectHeaders = {Authorization: jwtToken};
        this.stompClient.activate();
    }

    disconnect = () => {
        if (this.stompClient !== null) {
            this.stompClient.deactivate();
        }
        this.setConnected(false);
        console.log("Disconnected");
    }

    arm = () => {
        console.log("Arm vehicle");
        const manualControl = {
            xAxis: 0.6,
            yAxis: 0.5,
            zAxis: 0.3,
            rAxis: 0.8,
            commandType: CommandType.ARM
        };
        console.log(manualControl);
        let encode = this.manualControlProtobuf.encode(manualControl).finish();
        console.log(encode);
        const decoded = this.manualControlProtobuf.decode(encode);
        console.log(decoded);

        this.stompClient.publish({
            destination: '/app/manual-control',
            binaryBody: encode,
            headers: {"content-type": "application/octet-stream", "vehicleId": this.vehicleId}
        });
    }

    sendManualControl = (manualConrtol: any) => {
        console.log("Sending manual control");
        const manualControl = {
            xAxis: 0.61,
            yAxis: 0.51,
            zAxis: 0.31,
            rAxis: 0.81,
            cameraGimbalYaw: 1.0,
            cameraGimbalPitch: 1.0,
            commandType: CommandType.NAVIGATION
        };
        console.log(manualControl);
        let encode = this.manualControlProtobuf.encode(manualControl).finish();
        console.log(encode);
        const decoded = this.manualControlProtobuf.decode(encode);
        console.log(decoded);

        this.stompClient.publish({
            destination: '/app/manual-control',
            binaryBody: encode,
            headers: {"content-type": "application/octet-stream", "vehicleId": this.vehicleId}
        });
    }

    subscribe = () => {
        // const destination = "/user/queue/operation/329bc8a162ae7208ae18976a9c4f95e9344b9ede18ec4126224b199e39dc1156";
        // const destination = "/user/queue/notifications";
        // adding prefix of /user won't work
        // const destination = "/topic/mock-positions"
        // const destination = "/user/queue/operation/dji_drone_0001";
        // const destination = "/user/queue/operation/1a4ec7e5f7ce2d32ff125f5a57d52dbcb747ca8f7f17c514370584464dfe8df1";
        const destination = "/user/queue/operation/1a4ec7e5f7ce2d32ff125f5a57d52dbcb747ca8f7f17c514370584464dfe8df1";
        console.log("Subscribing " + destination);
        console.log(this.stompClient);
        this.stompClient.subscribe(destination, (res: any) => {
            try {
                const decoded = this.operationProtobuf.decode(res.binaryBody);
                console.log(decoded);
            } catch (err) {
                console.error(err);
            }
        }, {}, (err: any) => {
            console.log(err)
        });
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
                <input type="text" id="jwtToken" ref={this.jwtTokenInputRef}></input>
                <br/>
                <button id="disconnect" className="btn btn-default" type="submit" disabled={!this.state.connected}
                        ref={this.disconnectButtonRef} onClick={this.disconnect}>Disconnect
                </button>
                <button id="send_arm" className="btn btn-default" onClick={this.arm}>Arm
                </button>
                <button id="send" className="btn btn-default" onClick={this.sendManualControl}>Send Manual Control
                </button>

                <select id="serverSelector" onChange={this.onManualControlUrlChanged}>
                    <option value="http://192.168.1.64:9090" defaultValue={"https://192.168.1.64:9090"}>Localhost
                    </option>
                    <option value="http://192.168.1.184:8082">Staging</option>
                    <option value="https://uat.cloudgroundcontrol.com">UAT</option>
                </select>
                <p style={{padding: "10 10 10 10"}}>
                    <Gamepad ref={this.gamepadRef} disabled={false}>
                        <React.Fragment/>
                    </Gamepad>
                </p>
            </>
        )
    }

    onManualControlUrlChanged = (evt: any) => {
        const manualControlUrl = evt.target.value + "/manual-control";
        this.gamepadRef.current.changeManualControlUrl(manualControlUrl);
    }
}

export default App;
