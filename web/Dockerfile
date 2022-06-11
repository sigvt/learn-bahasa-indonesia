FROM node:16-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile

RUN yarn next telemetry disable

COPY next.config.js tsconfig.json next-env.d.ts ./
COPY public public
COPY styles styles
COPY pages pages
COPY components components
COPY hooks hooks
COPY .env.local ./

RUN yarn build

CMD ["yarn", "start"]
