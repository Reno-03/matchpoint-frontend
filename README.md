# MatchPoint Web App

MatchPoint is a dating application built with **Vue.js** on the frontend and a **Ruby on Rails GraphQL API** on the backend. The frontend uses **Apollo Client** to communicate with the GraphQL API.

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
  // uri: 'http://localhost:3000/graphql',
  uri: 'https://matchpoint-api-4026.onrender.com/graphql',
})
```

#### - Ensure the backend server is running before starting the frontend.
#### - Update CORS settings in Rails to allow requests from http://localhost:5173.
