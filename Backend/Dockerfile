FROM swipl:9.2.9

# Instalar Node.js 20
RUN apt-get update && \
    apt-get install -y \
    curl \
    ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p prolog_files && chmod 777 prolog_files

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV PROLOG_FILES_DIR=/app/prolog_files

CMD ["node", "app.js"]