FROM node:16
RUN npm install --production
RUN npm run build
EXPOSE 13513
RUN npm start
