import React, {Component, ElementRef} from 'react';
import './App.css';
import {load, Root} from 'protobufjs';
import Gamepad from "./Gamepad/Gamepad";
import {Client} from '@stomp/stompjs';


enum CommandType {
    NAVIGATION,
    ARM
};

class App extends Component<{}, { connected: boolean }> {

    gamepadRef: any;
    stompClient: any;
    connectButtonRef: any;
    disconnectButtonRef: any;

    manualControlProtobuf: any;
    vehiclePositionProtobuf: any;


    constructor(props: any) {
        super(props);

        this.gamepadRef = React.createRef();
        this.connectButtonRef = React.createRef();
        this.disconnectButtonRef = React.createRef();
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
            this.vehiclePositionProtobuf = root.lookupType('VehiclePosition')
        });
    }

    connect = () => {

        console.log("App.tsx connected websocket")
        const jwtToken = 'eyJhbGciOiJFUzUxMiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICItZTQ2Tm5iTXNRbG03ZjdUc0U2Rl9uSUkzakFOQ0NvN0ttNDJPMGFXdUxFIn0.eyJleHAiOjE2MjAzOTYyNTUsImlhdCI6MTYyMDM3NTMwMCwiYXV0aF90aW1lIjoxNjIwMzY3NDU1LCJqdGkiOiJjZDBkNmUyOC01NjJiLTQzNGEtYjY3NS1mNzY0M2YxMmY3NGYiLCJpc3MiOiJodHRwczovL2FwYWMuY2xvdWRncm91bmRjb250cm9sLmNvbS9hdXRoL3JlYWxtcy9jZ2NzLWRldiIsImF1ZCI6WyJicm9rZXIiLCJjbG91ZGdyb3VuZGNvbnRyb2wtZGV2Il0sInN1YiI6ImRjZmNjYjlhLTk3NTktNGVjYy1hZWQ5LTA5ZGI2YmI0NTk3MyIsInR5cCI6IkJlYXJlciIsImF6cCI6ImNsb3VkZ3JvdW5kY29udHJvbC1zdGciLCJzZXNzaW9uX3N0YXRlIjoiYjNhYjE4NjAtM2Q2My00NDY4LWFjNzItM2Q5Mzk0MmJhYWYyIiwiYWNyIjoiMCIsImFsbG93ZWQtb3JpZ2lucyI6WyIqIl0sInJlc291cmNlX2FjY2VzcyI6eyJicm9rZXIiOnsicm9sZXMiOlsicmVhZC10b2tlbiJdfSwiY2xvdWRncm91bmRjb250cm9sLWRldiI6eyJyb2xlcyI6WyJVc2VyIEFkbWluaXN0cmF0aW9uIl19LCJjbG91ZGdyb3VuZGNvbnRyb2wtc3RnIjp7InJvbGVzIjpbIlVzZXIgQWRtaW5pc3RyYXRpb24iXX19LCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsIm5hbWUiOiJMdWFuIFRyYW4iLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJsdWFuLnRyYW5AYWR2YW5jZWRuYXZpZ2F0aW9uLmNvbSIsImdpdmVuX25hbWUiOiJMdWFuIiwiZmFtaWx5X25hbWUiOiJUcmFuIiwiZW1haWwiOiJsdWFuLnRyYW5AYWR2YW5jZWRuYXZpZ2F0aW9uLmNvbSJ9.Ae9rEYAkj7mppp-s19Gy4zJnSHgBfFH3-_gqvrRZqdpP-Hy7ix7eteFRdopfrfmM-Sx7ZuTHnPoTG8-exxp_dBm2AYWEzD2soUYNSLo4gonmH1oJkgO5KTX4Juj1HUpE75AfUhz7S-WLEhDHNf1PwS0vUb9OmJ0wcuhpYzQnpw0f8U-h';

        // const wssUrl = "wss://apac.cloudgroundcontrol.com/api/ws-vehicles";
        const wssUrl = "ws://localhost:9090/ws-vehicles";
        this.stompClient = new Client({
            brokerURL: wssUrl,
            debug: function (str: string) {
                console.log('WS debug: ', str);
            },
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

    sendManualControl = (manualConrtol: any) => {
        console.log("Sending manual control");
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
            headers: {"content-type": "application/octet-stream", "vehicleId": "luant-drone"}
        });
    }

    subscribe = () => {
        // const destination = "/user/queue/operation/329bc8a162ae7208ae18976a9c4f95e9344b9ede18ec4126224b199e39dc1156";
        // const destination = "/user/queue/notifications";
        // adding prefix of /user won't work
        const destination = "/topic/mock-positions"
        // const destination = "/queue/operation/329bc8a162ae7208ae18976a9c4f95e9344b9ede18ec4126224b199e39dc1156";
        console.log("Subscribing " + destination);
        console.log(this.stompClient);
        this.stompClient.subscribe(destination, (res: any) => {
            try {
                const decoded = this.vehiclePositionProtobuf.decode(res.binaryBody);
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
                <button id="disconnect" className="btn btn-default" type="submit" disabled={!this.state.connected}
                        ref={this.disconnectButtonRef} onClick={this.disconnect}>Disconnect
                </button>
                <button id="send" className="btn btn-default" onClick={this.sendManualControl}>Send Manual Control
                </button>

                <select id="serverSelector" onChange={this.onManualControlUrlChanged}>
                    <option value="http://192.168.1.64:9090" defaultValue={"https://192.168.1.64:9090"}>Localhost
                    </option>
                    <option value="http://192.168.1.184:8082">Staging</option>
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
