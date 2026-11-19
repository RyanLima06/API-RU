FROM node:22
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install --force
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
