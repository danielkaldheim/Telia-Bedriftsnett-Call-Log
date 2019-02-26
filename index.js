require('dotenv').load();
const TeliaApi = require('./telia-api');

const mqtt = require('mqtt');
const client = mqtt.connect(process.env.MQTT_SERVER, {
  clientId: 'telia-call-log-' + process.env.TELIA_USERNAME,
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD
});
let prev = null;

const sb = new TeliaApi();
client.on('connect', res => {
  sb.authenticate(process.env.TELIA_USERNAME, process.env.TELIA_PASSWORD).then(
    result => {
      setInterval(async () => {
        const data = await sb.getCallLog(1);
        if (data && data.calls) {
          if (data.calls.length > 0) {
            const log = data.calls[0];
            if (prev === null) {
              prev = log;
            }
            if (JSON.stringify(prev) !== JSON.stringify(log)) {
              const direction = log['incoming'] == 1 ? 'incomming' : 'outgoing';
              console.log(JSON.stringify(log, null, 4));
              client.publish(
                'call/' + process.env.PHONE + '/' + direction,
                JSON.stringify(log)
              );
              prev = log;
            }
          }
        }
      }, 1000);
    }
  );
});
