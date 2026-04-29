FROM node:20-alpine
WORKDIR /app
COPY server/package*.json /app/
RUN npm ci
COPY server /app
RUN npm run build
EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "run", "start"]
