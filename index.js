'use strict';

const config = require('./config.json');
const mqtt = require('mqtt');
const onDeath = require('death');

const ThingSpeakApi = require('./thingspeak.api');

let client = mqtt.connect(config.mqtt.host, {
    username: config.user,
    password: config.mqtt.apiKey,
    clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
    connectTimeout: 1000
});
client.on('connect', function () {

    ThingSpeakApi.getLocalitiesFeeds().then((feeds) => {
        for(let i = 0; i < feeds.length; i++) {
            let locality = getLocalityFromConfig(feeds[i].field1);
            if (locality){
                locality.keyWrite = feeds[i].field2;
                locality.keyRead = feeds[i].field3;
                locality.channelId = feeds[i].field4;
            }
        }

        let promisesCreateChannels = [];
        for(let i = 0; i < config.localities.length; i++) {
            if (!config.localities[i].channelId){
                promisesCreateChannels.push(ThingSpeakApi.createChannel(config.localities[i]));
            }
        }

        Promise.resolve(promisesCreateChannels).then(() => {
            populateChannels(0);
        });
    });
});

function getLocalityFromConfig(locality) {
    for(let i = 0; i < config.localities.length; i++){
        if (config.localities[i].name == locality){
            return config.localities[i];
        }
    }
}

client.on('error', function (error) {
    console.log(error);
});

function populateChannels (i) {
    if (!client.connected) {
        return;
    }
    let id = i %  config.localities.length;
    let co2 = (Math.random() * config.localities[id].maxCO2+ config.localities[id].minCO2).toFixed(2) ;
    let co = (Math.random() * config.localities[id].maxCO+ config.localities[id].minCO).toFixed(2) ;
    let no2 = (Math.random() * config.localities[id].maxNO2+ config.localities[id].minNO2).toFixed(2) ;
    let o3 = (Math.random() * config.localities[id].maxO3+ config.localities[id].minO3).toFixed(3) ;
    let temperature = (Math.random() * config.localities[id].maxTemperature+ config.localities[id].minTemperature).toFixed(2) ;
    let humidity = (Math.random() * config.localities[id].maxHumidity+ config.localities[id].minHumidity).toFixed(2) ;

    client.publish('channels/' + config.localities[id].channelId + '/publish/' + config.localities[id].keyWrite,
        'field1=' + no2 + '&field2=' + co + '&field3=' + o3 + '&field4=' + temperature + '&field5=' + humidity + '&field6=' + co2 + '&field7='
        + config.localities[id].lat + '&field8=' + config.localities[id].long + '&status=MQTTPUBLISH',
        function (err) {
            if (err != undefined) {
                console.error(err);
            }
        });

    console.log('Sending data of ' + config.localities[id].name);
    setTimeout(populateChannels, 2000, ++i);
}


onDeath(function(signal, err) {
    console.log('Stopping things...');
    client.end();
});