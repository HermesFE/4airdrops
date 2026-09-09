FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm i -g serve@14
COPY --from=build /app/out ./out
EXPOSE 8080
CMD ["serve", "-s", "out", "-l", "8080"]
