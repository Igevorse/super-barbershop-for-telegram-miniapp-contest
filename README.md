# About


Super Barbershop is a Telegram Mini App for booking appointments to a barbershop. Select staff, services, date and time and book just in one tap!

# Mini App contest

This app was created from scratch specially for Telegram Mini App contest.  

This is an example of creating a Telegram Mini App working with already existing backend of booking platform. In this case it is YClients platform. You may change `company_id` and miniapp will work with another company (whether it is barbershop, hotel or any other services), their staff and services, which are loaded from the server.

# Technology

* HTML, CSS for UI and styling;

* Node.js and TypeScript for interacting with user;

* jQuery for reducing routine.

* Webpack for combining JavaScript files together.


# Installation

1. Install [nvm, Node Version Manager](https://github.com/nvm-sh/nvm#install--update-script)
2. `nvm install node`
3. `npm install -g typescript`
4. `npm install --save-dev jest`
5. `npm init jest@latest`
6. `npm install ts-node`
7. `npm ci`


# Supported API

* get available languages
* get translations for language xx_XX
* get staff list for chosen dates and services
* get services list for chosen dates and staff
* get list of dates and times for chosen staff and services
* get orders of signed in user
* book and appointment with chosen date / time, staff and services
* authenticate using phone number and SMS code (not sure if Yclients sends it to all countries)
