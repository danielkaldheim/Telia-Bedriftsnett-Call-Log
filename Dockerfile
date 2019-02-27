FROM alpine:3.7
RUN apk add --no-cache supervisor nodejs nodejs-npm yarn bash
RUN mkdir -p /var/log/supervisor

COPY package*.json ./
COPY yarn.lock ./
RUN yarn install

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

COPY run.sh /usr/local/bin/
RUN /bin/chmod +x /usr/local/bin/run.sh

COPY . .

CMD ["/usr/bin/supervisord"]
