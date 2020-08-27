import React, {Component, ElementRef} from 'react';
import './App.css';
import Gamepad from "./Gamepad/Gamepad";

class App extends Component {

    gamepadRef:any;

    constructor(props:any) {
        super(props);

        this.gamepadRef = React.createRef();
    }

    render() {
        return (
            <>
                <select id="serverSelector" onChange={this.onManualControlUrlChanged}>
                    <option value="http://192.168.1.64:9090" defaultValue={"https://localhost:9090"}>Localhost</option>
                    <option value="http://192.168.1.184:8082">Staging</option>
                </select>
                <Gamepad ref={this.gamepadRef}>
                    <React.Fragment/>
                </Gamepad>
            </>
        )
    }

    onManualControlUrlChanged = (evt: any) => {
        const manualControlUrl = evt.target.value + "/manual-control";
        this.gamepadRef.current.changeManualControlUrl(manualControlUrl);
    }
}

export default App;
