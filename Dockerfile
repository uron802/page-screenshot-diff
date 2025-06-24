FROM node:20-slim

# Puppeteerの依存関係をインストール
RUN apt-get update \
    && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-symbola \
    fonts-noto-color-emoji \
    fonts-freefont-ttf \
    libglib2.0-0 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PUPPETEER_SKIP_DOWNLOAD=true

WORKDIR /usr/src/app

COPY package*.json ./
COPY jest.config.js ./

# install dependencies inside container
RUN PUPPETEER_SKIP_DOWNLOAD=1 npm install

# テスト実行に必要なファイルをコピー
COPY __tests__ ./__tests__
COPY tsconfig.json ./
COPY src/ ./src/

# build TypeScript sources
RUN npm run build

CMD ["tail", "-f", "/dev/null"]
