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

# Copy node_modules from host since npm install is failing due to network issues
COPY node_modules ./node_modules

# Copy pre-built dist files
COPY dist ./dist
# テスト実行に必要なファイルをコピー
COPY __tests__ ./__tests__
COPY tsconfig.json ./
COPY src/ ./src/

CMD ["tail", "-f", "/dev/null"]