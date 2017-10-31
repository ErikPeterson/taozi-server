# Taozi Server

[![Coverage Status](https://coveralls.io/repos/github/ErikPeterson/taozi-server/badge.svg?branch=master)](https://coveralls.io/github/ErikPeterson/taozi-server?branch=master)
[![CircleCI](https://circleci.com/gh/ErikPeterson/taozi-server/tree/master.svg?style=svg)](https://circleci.com/gh/ErikPeterson/taozi-server/tree/master)

Taozi (套子) is a social network based off of a semi-defunct app named after a stone fruit. Taozi is not currently live, and is still under development. This repo contains a node.js app that runs the API.

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
	- friend_request create, accept
	- authentication middleware
	- sign in
	- Post create/delete
	- Comment on posts
	- like posts
	- Feeds

## TODO

- Implement 'greetings'
- Create web interface
- Create iOS and Android apps
- Implement notifications
- Implement chat

## Contributing

If you would like to contribute, get in touch with [Erik Peterson](https://github.com/ErikPeterson).