'use strict';

var keys = require('./keys.json');
var localities = require('./localities.json');
var request = require('request');
var mqtt = require('mqtt');

var client = mqtt.connect('mqtt://mqtt.thingspeak.com', {
    username: keys.user,
    password: keys.mqtt,
    clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
    connectTimeout: 1000
});
client.on('connect', function () {
    setTimeout(populateChannels, 1200, 0);
});

client.on('error', function (error) {
    console.log(error);
})

var populateChannels = function (i) {
    if (!client.connected) {
        return;
    }
    var id = i % 3;
    var co2 = (Math.random() * localities[id].maxCO2) + localities[id].minCO2;
    var co = (Math.random() * localities[id].maxCO) + localities[id].minCO;
    var no2 = (Math.random() * localities[id].maxNO2) + localities[id].minNO2;
    var o3 = (Math.random() * localities[id].maxO3) + localities[id].minO3;
    var temperature = (Math.random() * localities[id].maxTemperature) + localities[id].minTemperature;
    var humidity = (Math.random() * localities[id].maxHumidity) + localities[id].minHumidity;

    var pubish_channel = 'channels/' + localities[id].channel_id + '/publish/' + localities[id].write_key;
    var publish_payload = 'field1=' + no2 + '&field2=' + co + '&field3=' + o3 + '&field4=' + temperature + '&field5=' + humidity + '&field6=' + co2 + '&field7=' + localities[id].lat + '&field8=' + localities[id].long + '&status=MQTTPUBLISH';
    console.log('channel: ' + pubish_channel);
    console.log('payload: ' + publish_payload);
    client.publish(pubish_channel, publish_payload, {qos: 1}, function (err) {
            if (err != undefined) {
                console.log(err);
            }
        });

    if (i < 6) {
        setTimeout(populateChannels, 1200, ++i);
    }
    else {
        client.end();
    }
};