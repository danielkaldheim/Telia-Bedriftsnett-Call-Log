require('dotenv').load();
const qs = require('querystring');
const http = require('https');
const mqtt = require('mqtt');
const client = mqtt.connect(process.env.MQTT_SERVER, {
  clientId: 'telia-call-log-' + process.env.PHONE
});
let prev = null;

const fetchCallLog = () => {
  return new Promise((resolve, reject) => {
    var formData = qs.stringify({ queue_calls: 0, limit: 1 });
    var contentLength = formData.length;
    const options = {
      method: 'POST',
      hostname: 'apit.phonero.net',
      port: null,
      path: '/mobileapp/4.0/calllog',
      headers: {
        cookie: 'BNAPI2=' + process.env.BNAPI2,
        'content-length': contentLength,
        'user-agent': 'BedriftsnettTelia/12 CFNetwork/978.0.5 Darwin/18.5.0',
        'content-type': 'application/x-www-form-urlencoded'
      }
    };

    const req = http.request(options, res => {
      const chunks = [];

      res.on('data', chunk => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        const body = Buffer.concat(chunks);
        const content = body.toString();
        resolve(JSON.parse(content));
      });
    });
    req.write(formData);
    req.end();
  });
};

client.on('connect', () => {
  setInterval(async () => {
    const data = await fetchCallLog();
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
});
