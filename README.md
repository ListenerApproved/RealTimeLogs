# Real Time Logs 

Real Time Logs is a node.js app designed for reading logs in real time via ssh and serving them in real time to clients via web sockets.

## Installation and Setup
1. Get clone and cd into directory of your choice
2. npm install
3. Edit or create '/etc/rtlogs/config.js' and add servers and groups.
4. node app.js 

sample config.js

```javascript
exports.servers = [
	{
	group: 'static', 
	server: 'static-001', 
	log: '/var/log/Software/static.log'
	},
	{
	group: 'static',
	server: 'static-002',
	log: '/var/log/Software/static.log'
	},
	{
	group: 'api',
	server: 'api-001',
	log: '/var/log/Software/api.log'
	},
	{
	group: 'api',
	server: 'api-002',
	log: '/var/log/Software/api.log'
	},
	{
	group: 'auth',
	server: 'auth-001',
	log: '/var/log/Software/auth.log'
	},
];
```
### Screenshot
![Screen Shot](http://i.imgur.com/9lh8c.png)