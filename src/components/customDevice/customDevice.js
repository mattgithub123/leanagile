﻿// Copyright (c) Microsoft. All rights reserved.

import React from 'react';
import Http from '../../common/httpClient';
import Config from '../../common/config';

import './customDevice.css';

class DeviceInput extends React.Component {

    handleChange = (e) => {
        this.props.onChange({ type: this.props.device.type, count: e.target.value });
    }

    render() {
        return (
            <div>
                <input className="custom-device-input" value={this.props.device.count} onChange={this.handleChange} />&nbsp;<span>{this.props.device.type}</span>
            </div>
        );
    }
}

export default class CustomDevice extends React.Component {

    constructor(props) {
        super(props);
        this.state = { devices: [] };
    }

    componentDidMount() {
        this.getData().then((data) => {
            let devices = [];
            data.forEach((type) => {
                devices.push({ type: type, count: 0 });
            });
            this.setState({
                devices: devices
            });
        });
    }

    submit(demo) {
        return this.saveData(demo, this.state.devices).then(() => {
            console.log("Succeeded to call saveData");
        }).catch((e) => {
            var message = "Failed to call saveData. " + e.message;
            console.log(message);
            alert(message);
        });
    }

    handleChange = (device) => {
        var devices = this.state.devices.map(function (d) {
            d.count = (device.type === d.type ? device.count : d.count);
            return d;
        });

        this.setState({ devices: devices });
    }

    getData() {
        return Http.get(Config.deviceSimulationApiUrl + "/api/v1/simulateddevice/types");
    };

    saveData(demo, devices) {
        const data  = {
            demo: demo,
            deviceTypes: devices
        };
        return Http.put(Config.deviceSimulationApiUrl + "/api/v1/simulateddevice/types", data);
    };

    render() {
        var items = this.state.devices.map((device) =>
            <DeviceInput key={device.type} device={device} onChange={this.handleChange} />
        );
        return (
            <div className="custom-device">
                <span>Device Types:</span>
                <div className="custom-device-list">
                    {items}
                </div>
            </div>
        );
    }
}
