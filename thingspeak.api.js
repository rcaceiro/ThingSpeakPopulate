'use strict';

const config = require('./config.json');
const request = require('request');

module.exports = class ThingSpeakApi {
    static createChannel(locality) {
        return new Promise((resolve, reject) => {
            let url = 'https://api.thingspeak.com/channels.json?api_key=' + config.apiKey
                + '&field1=no2&field2=co&field3=o3&field4=temperature&field5=humidity' +
                '&field6=co2&field7=latitude&field8=longitude&name=' + locality.name;
            request.post(url, {form: {}}, (error, response, body) => {

                if (!error) {
                    let json = JSON.parse(body);
                    locality.channelId = json.id;
                    locality.keyWrite = json.api_keys[0].api_key;
                    locality.keyRead = json.api_keys[1].api_key;
                    console.log('Channel for ' + locality.name + ' created');
                    this.addLocatity(locality).then(() => {
                        resolve();
                    });

                } else {
                    console.log('[createChannel] ThingSpeak returned an error:', error);
                    reject();
                }


            });
        });
    }

    static addLocatity(locality) {
        return new Promise((resolve, reject) => {
            let url = 'https://api.thingspeak.com/update?api_key=' + config.localitiesKey.write
                + '&field1=' + locality.name + '&field2=' + locality.keyWrite
                + '&field3=' + locality.keyRead + '&field4=' + locality.channelId;
            request(url,
                (error, response, body) => {

                    if (response.statusCode === 200) {
                        if (body) {
                            console.log('Added new locatity info to channel');
                            resolve();
                            return;
                        }
                    }
                    console.log('[addLocatity] ThingSpeak returned an error:', error);
                    reject();

                });

        });
    }

    static getLocalitiesFeeds() {
        return new Promise((resolve, reject) => {
            request('https://api.thingspeak.com/channels/357813/feeds.json?api_key=' + config.localitiesKey.read,
                (error, response, body) => {

                    if (response.statusCode === 200) {
                        let json = JSON.parse(body);
                        resolve(json.feeds);

                    } else {
                        console.log('[getLocalitiesFeeds] ThingSpeak returned an error:', error);
                        reject();
                    }
                })
        });
    }
};