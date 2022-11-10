class OneSignal {
    async sendNotification(data) {
        const headers = {
            'Content-Type': 'application/json; charset=utf-8',
        };

        const options = {
            host: 'onesignal.com',
            port: 443,
            path: '/api/v1/notifications',
            method: 'POST',
            headers,
        };

        const https = require('https');
        const req = https.request(options, res => {
            res.on('data', data => {
                console.log('Response:');
                console.log(JSON.parse(data));
            });
        });

        req.on('error', e => {
            console.log('ERROR:');
            console.log(e);
        });

        req.write(JSON.stringify(data));
        req.end();
    }
}

export default new OneSignal();
