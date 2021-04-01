FROM node:9

WORKDIR /usr/src/neurotischism
COPY ./ ./
RUN npm install

EXPOSE 8080
ENTRYPOINT ["npm", "start"]
