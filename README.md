# Shotit-api

[![License](https://img.shields.io/github/license/shotit/shotit-api.svg?style=flat-square)](https://github.com/shotit/shotit-api/blob/master/LICENSE)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/shotit/shotit-api/docker-image.yml?style=flat-square)](https://github.com/shotit/shotit-api/actions)
[![Codecov](https://img.shields.io/codecov/c/github/shotit/shotit-api?style=flat-square&token=8C25WLSEDJ)](https://codecov.io/gh/shotit/shotit-api)
[![Docker](https://img.shields.io/docker/pulls/lesliewong007/shotit-api?style=flat-square)](https://hub.docker.com/r/lesliewong007/shotit-api)
[![Docker Image Size](https://img.shields.io/docker/image-size/lesliewong007/shotit-api/v0.9.8?style=flat-square)](https://hub.docker.com/r/lesliewong007/shotit-api)

The ultimate brain of [shotit](https://github.com/shotit/shotit), in charge of task coordination.

### Features

- serve image search request
- crop black borders on search images
- rate limiting and user management
- serve index and database status
- store and serve compressed hash files
- distribute hash jobs to workers

### Prerequisites

- Node.js 16.x, 18.x
- mariaDB 10.4.x
- redis
- [liresolr](https://github.com/Leslie-Wong-H/liresolr)
- [milvus-standalone](https://github.com/milvus-io/milvus)
- [milvus-minio](https://github.com/milvus-io/milvus)
- [milvus-etcd](https://github.com/milvus-io/etcd)
- [shotit-searcher](https://github.com/shotit/shotit-worker)
- [shotit-sorter(optional)](https://github.com/shotit/shotit-sorter)
- g++, cmake (if you need to compile OpenCV)

### Local Development Guide

Install:

```
git clone https://github.com/shotit/shotit-api.git
cd shotit-api
yarn install
```

Install Prerequisites by docker compose first, [docker-desktop](https://www.docker.com/products/docker-desktop/) required:

- Copy `.env.example` to `.env`
- Edit `.env` as appropriate for your setup, as is for the first time.
- Copy `milvus.yaml.example` to `milvus.yaml`
- Edit `milvus.yaml` as appropriate for your setup, as is for the first time.

```
(Windows or Mac):
docker compose up -d
(Linux):
docker-compose up -d
```

### Start server

You can use [pm2](https://pm2.keymetrics.io/) to run this in background in cluster mode.

Use below commands to start / restart / stop / log server.

```
yarn start
yarn stop
yarn reload
yarn restart
yarn delete
yarn logs
```

To change the number of nodejs instances, edit ecosystem.config.json
