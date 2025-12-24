FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true
ENV HOST=0.0.0.0
EXPOSE 5173
EXPOSE 24678
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

