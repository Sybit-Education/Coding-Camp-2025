FROM node:lts AS build-stage

ARG environment=production
WORKDIR /app

RUN npm i -g @angular/cli

COPY package*.json ./
RUN npm ci

COPY . .
RUN ng build --configuration=production

RUN cp -r /app/dist/1200-jahre-radolfzell/browser/* /app/dist/1200-jahre-radolfzell/


FROM nginx:stable AS production-stage

WORKDIR /usr/share/nginx/html
RUN rm -rf ./*

COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build-stage /app/dist/1200-jahre-radolfzell/ .

EXPOSE 80
