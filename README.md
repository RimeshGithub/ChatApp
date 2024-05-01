# STEPS TO MAKE YOUR PERSONAL GROUP CHAT

## Step 1:
Download and extract the project by clicking the link below:
https://github.com/RimeshGithub/ChatApp/archive/refs/heads/main.zip

## Step 2:
Create Firebase project and Replace firebaseConfig in index.js with your own firebaseConfig.

## Step 3:
Setup Authentication and Firestore Database. Click the link below for tutorial:
https://scrimba.com/learn/learnfirebase

## Step 4:
Within Firestore Database setup Indexes & Rules. 
See rules.txt for Rules. 
To create Indexes:
1) Click Add Index within Indexes.
2) Type Collection ID as "messages".
3) In Fields to index type one field path as "uid" and another field path as "createdAt".
4) In Query scopes select "Collection" and then click create index.

## Step 5:
Now host the updated project in github or similar platforms. Then share the site link among your friends with whom you want to chat with!



