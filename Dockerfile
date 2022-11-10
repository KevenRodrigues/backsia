FROM node:16.17.0
# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json yarn.lock ./

RUN yarn set version '1.22.18'
RUN yarn install && yarn cache clean
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 3334
CMD [ "yarn", "start", "queue"]
