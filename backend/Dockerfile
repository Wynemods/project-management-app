FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm install -g @nestjs/cli
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
