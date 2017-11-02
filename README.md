# Taozi Server

[![Coverage Status](https://coveralls.io/repos/github/ErikPeterson/taozi-server/badge.svg?branch=master)](https://coveralls.io/github/ErikPeterson/taozi-server?branch=master)
[![CircleCI](https://circleci.com/gh/ErikPeterson/taozi-server/tree/master.svg?style=svg)](https://circleci.com/gh/ErikPeterson/taozi-server/tree/master)

Taozi (套子) is a social network based off of a semi-defunct app named after a stone fruit. Taozi is not currently public and is still in development.

## Usage

To run the server locally clone the repository then run:

```sh
npm run server

```

This will run the API server locally on port 3000 by default, or on whatever port is set in `PORT`.

### Configuration

Several environment variables can be used to configure Taozi:

- `DATABASE_URL` fully qualified url for mongo db
- `LOG_LEVEL` sets the threshhold level for the logger. Accepts numbers 0-5 and strings 'debug', 'info', 'warn', 'error', 'fatal'
- `PORT` sets the port for the server to listen on
- `NODE_ENV` sets the environment for the app. Default mongodb addresses change based on this (defaults to development)

## Specs

The spec output can give you a pretty good idea of what functionality is available in the app. To run the specs:

```sh
npm test
```

This will also generate a coverage folder.


# Progress

## Done

- Data model
	- Database driver for mongo
	- BaseModel (other models inherit from this)
	- User model
	- Auth model
	- Post model
	- Comment model
	- Likes

- API
	- user create, update
	- friend request create, accept, ignore
	- authentication middleware
	- sign in
	- Post create/delete
	- Comment on posts
	- like posts
	- Feeds
	- block users
	- nods
	
## TODO

- Phone hash and look up users by contacts
- Add multiple friend requests in one go
- Create web interface
- Create iOS and Android apps
- Implement notifications
- Implement chat

## Contributing

If you would like to contribute, get in touch with [Erik Peterson](https://github.com/ErikPeterson).