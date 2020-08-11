import React, {Component} from 'react';
import './App.css';
import {ToggleButton} from "react-bootstrap";

class App extends Component {

    render() {
        return (
            <ToggleButton variant="primary" value={false}>Primary</ToggleButton>
        )
    }
}

export default App;
