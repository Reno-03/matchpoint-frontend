<p align="center">
  <img src="public/icon.jpg" alt="MatchPoint Logo" width="200" />
</p>
<h1 align="center"> MatchPoint Web App </h1>

<p align="center">
<a href="https://vuejs.org/"><img src="https://img.shields.io/badge/Vue.js-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white" alt="Vue.js"></a>
<a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"></a>
<a href="https://graphql.org/"><img src="https://img.shields.io/badge/GraphQL-E10098?style=for-the-badge&logo=graphql&logoColor=white" alt="GraphQL"></a>
<a href="https://www.apollographql.com/"><img src="https://img.shields.io/badge/Apollo_Client-311C87?style=for-the-badge&logo=apollo-graphql&logoColor=white" alt="Apollo Client"></a>
<a href="https://rubyonrails.org/"><img src="https://img.shields.io/badge/Ruby_on_Rails-CC0000?style=for-the-badge&logo=ruby-on-rails&logoColor=white" alt="Ruby on Rails"></a>
<a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"></a>
</p>

<p align="center">
<a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=for-the-badge" alt="License: MIT"></a>
<a href="#"><img src="https://img.shields.io/badge/status-inactive-red?style=for-the-badge" alt="Status"></a>
</p>

<p align="center">MatchPoint is a dating application built with <b>Vue.js</b> on the frontend and a <b>Ruby on Rails GraphQL API</b> on the backend. The frontend uses <b>Apollo Client</b> to communicate with the GraphQL API. </p>

## Demo

<div align="center">
  <img src="/screenshots/demo.gif" height="400"/>
</div>

## Tech Stack

### Frontend
- Vue.js
- Vite
- Apollo Client
- GraphQL

### Backend
- Ruby on Rails
- GraphQL (graphql-ruby)
- PostgreSQL

## Prerequisites

Make sure the following are installed on your machine:

### General
- **Git**

### Frontend
- **Node.js** (v18 or later recommended)
- **npm**

Verify:
```sh
node -v
npm -v
```

### Backend

- Ruby (version specified in the Rails app)
- Rails
- Bundler
- PostgreSQL

Verify:
```sh
ruby -v
rails -v
psql --version
```

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Running the Project Locally

### 1. Clone the GitHub Repositories
```sh
git clone https://github.com/Reno-03/matchpoint-frontend.git
git clone https://github.com/Reno-03/matchpoint-api.git
```

### 2. Backend Setup (Rails GraphQL API)
```sh
cd matchpoint-api
bundle install
rails db:create db:migrate db:seed
rails server
```

The Rails GraphQL API will be available at:
```sh
http://localhost:3000/graphql
```

### 3. Frontend Setup (Vue + Apollo)

```sh
cd matchpoint-frontend
npm install
npm install --save @apollo/client graphql graphql-tag @vue/apollo-composable
```

### 4. Start the Frontend Dev Server

```sh
npm run dev
```

The application will be available at:

```sh
http://localhost:5173
```

### 5. Compile and Minify for Production

```sh
npm run build
```

## NOTE: 

#### - Make sure to check src/apollo.js having:

```sh
const httpLink = createHttpLink({
  uri: 'http://localhost:3000/graphql',
  // uri: 'https://matchpoint-api-4026.onrender.com/graphql',
})
```

#### - Ensure the backend server is running before starting the frontend.
#### - Update CORS settings in Rails to allow requests from http://localhost:5173.
