# shotit-api

[![License](https://img.shields.io/github/license/soruly/shotit-api.svg?style=flat-square)](https://github.com/soruly/shotit-api/blob/master/LICENSE)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/soruly/shotit-api/docker-image.yml?style=flat-square)](https://github.com/soruly/shotit-api/actions)
[![Codecov](https://img.shields.io/codecov/c/github/soruly/shotit-api?style=flat-square&token=8C25WLSEDJ)](https://codecov.io/gh/soruly/shotit-api)
[![Docker](https://img.shields.io/docker/pulls/soruly/shotit-api?style=flat-square)](https://hub.docker.com/r/soruly/shotit-api)
[![Docker Image Size](https://img.shields.io/docker/image-size/soruly/shotit-api/latest?style=flat-square)](https://hub.docker.com/r/soruly/shotit-api)
[![Discord](https://img.shields.io/discord/437578425767559188.svg?style=flat-square)](https://discord.gg/K9jn6Kj)

The ultimate brain of [shotit](https://github.com/shotit/shotit), in charge of task coordination.

[API Docs](https://soruly.github.io/shotit-api/)

### Features

- serve image search request
- crop black borders on search images
- rate limiting and user management
- serve index and database status
- store and serve compressed hash files
- distribute hash jobs to workers

### Prerequisites

- Node.js 14.x
- mariaDB 10.4.x
- redis
- [liresolr](https://github.com/soruly/liresolr)
- g++, cmake (if you need to compile OpenCV)

### Install

Install Prerequisites first, then:

```
git clone https://github.com/soruly/shotit-api.git
cd shotit-api
npm install
```

### Configuration

- Copy `.env.example` to `.env`
- Edit `.env` as appropriate for your setup

### Start server

You can use [pm2](https://pm2.keymetrics.io/) to run this in background in cluster mode.

Use below commands to start / restart / stop server.

```
npm run start
npm run stop
npm run reload
npm run restart
npm run delete
```

To change the number of nodejs instances, edit ecosystem.config.json
