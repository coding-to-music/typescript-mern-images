# typescript-mern-images

# 🚀 Javascript full-stack 🚀

### React / Next / MongoDB / eCharts / Storybook / GitHub API

https://github.com/coding-to-music/typescript-mern-images

https://typescript-mern-images.herokuapp.com

by Aravind K aravind_k28 thecodingpie the-coding-pie https://github.com/the-coding-pie

https://github.com/the-coding-pie/workflow

```java
PORT=8000

MONGODB_URI=your_mongodb_atlas_uri

REFRESH_TOKEN_SECRET=generate_strong_random_characters_and_put_it_here
ACCESS_TOKEN_SECRET=generate_strong_random_characters_and_put_it_here

GOOGLE_CLIENT_ID=your_google_client-id_for_google_oauth

GMAIL=any_email_address_for_sending_email_from
GMAIL_PASSWORD=that_emails_password
```

## GitHub

```java
git init
git add .
git remote remove origin
git commit -m "first commit"
git branch -M main
git remote add origin git@github.com:coding-to-music/typescript-mern-images.git
git push -u origin main
```

## Heroku

```java
heroku create typescript-mern-images
```

## Heroku MongoDB Environment Variables

```java
heroku config:set


heroku config:set JWT_SECRET="secret"

heroku config:set PUBLIC_URL="https://typescript-mern-images.herokuapp.com"
```

## Push to Heroku

```java
git push heroku

# or

npm run deploy
```

# Workflow

A fullstack Project Management Software made using React JS (Typescript), Node JS + Express (Typescript), and Mongo DB.

<img src="https://user-images.githubusercontent.com/63698375/161479812-a9f32870-66f1-484d-9ea7-20f6f66fe95e.png" alt="boardDetailPage" style="width:100%;"/>

![card](https://user-images.githubusercontent.com/63698375/161484824-fbf0bb11-c603-4502-8494-cfe903883d9f.png)
![homepage](https://user-images.githubusercontent.com/63698375/161484841-d32db796-bb20-465a-8a0a-4016e2e83abc.png)
![inviteboard](https://user-images.githubusercontent.com/63698375/161484857-67920c56-d88a-4679-afa0-7ae23b64570d.png)

## Technologies Used:

### Frontend

- React JS + Typescript
- React Query
- Redux Toolkit
- Tailwind CSS
- Formik + Yup
- React Beautiful DND
- React Toastify
- React Select

### Backend

- Node JS + Express + Typescript
- Mongo DB (with Mongoose)
- JWT tokens & Google Auth for authentication
- Node Mailer

## Features

- Signup and Login (Email + Password & Google OAuth)
- HomePage
- Profile Settings
- Space CRUD (with Role -> ADMIN & NORMAL)
- Space Members CRUD
- Board CRUD (with Role -> ADMIN, NORMAL, and OBSERVER)
- Board Members CRUD
- List CRUD
- List Drag & Drop (reordering)
- Card CRUD
- Card Drag & Drop (reordering)
- Card comments CRUD (with Role)
- Card Members CRUD (with Role)
- Card Labels (with Role)
- Card Due Date (with Role)
- Card Cover Image (with Role)
- Labels CRUD (with Role)
- JWT based auth (both accessToken and refreshToken)
- Google OAuth
- Favorites (make both Space & Board favorite) etc.

## Description

A fully fledged project management software which was built by taking inspiration from Trello, one of the pioneers in this space.

### Hierarchy

In Workspace, there is a hierarchy you need to follow:

![hierarchy](https://user-images.githubusercontent.com/63698375/161477315-ec114415-ac57-4cd7-a049-5dfa9d2a1d3c.png)

### Role based CRUD

In space level, as well as in board level, role based CRUD is implemented. The UI will be rendered according to the role which the user has. In short everything is done based on the role(power) the user have.

In Space, there are two roles -> ADMIN, NORMAL
In Board, there are three roles -> ADMIN, NORMAL, OBSERVER

### Email verification

Email verification is also implemented in authentication flow. Unless until you confirm your email (by clicking on the link which was sent inside email to the email address you have given), you won't be able to use this app at all.

### Labels in Board Level

Labels are used in board level. Each label of the board will be available to assign to a card belongs to that board. Labels will be useful in aspects such as searching the cards and filtering it (haven't implemented it yet).

![labels](https://user-images.githubusercontent.com/63698375/161478252-bcfa96fa-94fa-4ce2-9b76-8f6dd5ba6686.png)

### Ranking Lists & Cards

A technique called "Lexorank" is used for giving weights to cards as well as lists, so that they will keep the order. Lexorank is ranking system that Jira Software uses which provides the ability to rank issues in Jira Software instances. But in this project, I used Lexorank without the bucket feature.

### Auth Flow

![authflow_final](https://user-images.githubusercontent.com/63698375/161480269-13bbf11b-5379-477d-92ff-8854b16c5631.png)

 <br />
 <br />
 
 ## How to setup locally on your computer
 
 ### Pre-requirements
  In order to run this project on your computer, you must have the following things setup:
 
  - Docker (please install Docker and setup properly on the computer in which you are going to run this project on).
  - Setup a database in <a href="https://www.mongodb.com/cloud/atlas/lp/try2?utm_source=google&utm_campaign=gs_apac_india_search_core_brand_atlas_desktop&utm_term=mongo%20db%20atlas&utm_medium=cpc_paid_search&utm_ad=e&utm_ad_campaign_id=12212624347&adgroup=115749713263" target="_blank">MongoDB Atlas</a> and obtain the `URI`.
  - Obtain `GOOGLE_CLIENT_ID` for using Google OAuth. <a href="https://developers.google.com/identity/protocols/oauth2" target="_blank">(link)</a>.
  - You need an Gmail account for sending verifying email while a user signs up. You need to enable and obtain `APP_SPECIFIC_PASSWORD` of that Gmail. <a href="https://support.google.com/accounts/answer/185833?hl=en" target="_blank">(link)</a>
  - Signup for Unsplash API and obtain the `CLIENT_ID`. <a href="https://unsplash.com/documentation#creating-a-developer-account" target="_blank">(link)</a>
  
 ### Steps

1. `git clone` or `Download ZIP` this repo `https://github.com/the-coding-pie/workflow.git`
2. Now `cd` into the root directory (ie, workflow):

```bash
cd workflow
```

3. Now create two `.env` files, one in `server/` folder and another in `client/` folder.
4. Now copy paste the content for `.env` in `server/` folder. Please **replace** the proper values by yours:

```
PORT=8000

MONGODB_URI=your_mongodb_atlas_uri

REFRESH_TOKEN_SECRET=generate_strong_random_characters_and_put_it_here
ACCESS_TOKEN_SECRET=generate_strong_random_characters_and_put_it_here

GOOGLE_CLIENT_ID=your_google_client-id_for_google_oauth

GMAIL=any_email_address_for_sending_email_from
GMAIL_PASSWORD=that_emails_password
```

You can obtain `GOOGLE_CLIENT_ID` for enabling google oauth by simply searching google and following the steps recommended. And for gmail(last option), please use app specific password.

5. Now copy paste the content for `.env` in `client/` folder. Please **replace** the proper values by yours:

```
VITE_UNSPLASH_CLIENT_ID=your_unsplash_client_id
```

Please obtain a `CLIENT_ID` for using Unsplash API from Unsplash.

6. Make sure you have Docker properly setup. Now fire this command:

```bash
docker-compose up
```

4. That's it, Now visit [http://localhost:3000](http://localhost:3000)

[Designed](https://www.figma.com/file/WKTWThfTPOu7nMo4oa59jH/Workflow) and developed with ❤️ by [@AK](https://twitter.com/aravind_k28) (that's me ;)
