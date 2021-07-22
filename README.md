# Solar Watcher

Watch your solar invertor by YOURSELF!

# Credit

Communicate with rs232 part by https://github.com/prajna-pranab/converse

## File Structure

### ./client
Read data from invertor and send to remote web server.

### ./server
Collect data with web server log, and send data to web browser.

## ./src
Browser side chart source code.


## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run dev
```

### Compiles and minifies for production
```
npm run build
```

### Deploy

1. make sure web sever is ready
2. Change deploy settings
3. Deploy app



Nginx site config example

```nginx

upstream app {
  server 127.0.0.1:7777;
}

server {
  listen 80;
  return 301 https://your-domain.com;
}
server {
  listen 443 ssl;

  server_name your-domain.com;

  add_header Access-Control-Allow-Origin *;
  location ~* \.io {
    proxy_pass http://app;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $http_host;
    proxy_set_header X-NginX-Proxy true;
    proxy_redirect off;
  }
  location /  {
      root /app/yourapp/dist;
  }

}
```





There are some setting you MUST change before execute the deploy action

```bash
#!/bin/bash
# change to your server ip
REMOTE_IP_ADDRESS=0.0.0.0
# change to your remote path to deploy app
REMOTE_PATH=~/myapp
```

Execute

```bash
sh ./deploy
```


