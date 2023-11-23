# Image Share System

Description: Server-side app for sharing image with the implementation of MongoDB.<br>

Group:25
Names: Chan Tsz Yi (13434884)
	   Ting Kenneth Charles (13338614)      
       Raja Arbab Mahmood (13275291)
       Rejul Rai (13347518)

Use this link to run: https://localhost:8080

===========================================================================
## Login/logout
Default users (username/password):
- Developer: (developer/developer)
- Guest: (guest/guest)

===========================================================================
## Register
Register is available with the following constraints:
- No space for username
- Certain format requirement for password (at least 8 characters)
- Password and re-entered password should be identical

===========================================================================
## Post
A full page for viewing a post by a user.<br>
User can view their latest post in index, while a link to create posts will be rendered to users without any posts.<br>
In default, the user developer has a post.<br>
Function within a post:
- Like
- Posting a comment

===========================================================================
## Create/upload
User can upload an image to the database.<br>
There are multiple error handlings:
- No files being upload
- File failed to be uploaded to the database

===========================================================================
## Delete
After login
- They can delete their profile or delete specific photo 

===========================================================================
# Restful
In this project, there are four HTTP request types: post, get and delete.

- Post 
	Post request is used for creating/adding.
	Path URL for login: /login
	Path URL for register: /register
	Test (register): curl -X POST -H "Content-Type: application/json" --data '{"username": <username>, "password":<password>}'localhost:8080/register

- Get
	Get request is used for find.
	Path URL for images list from certain poster: /search/<username>
	Path URL for a certain image: /post/<postID>
	Path URL for a certain poster's profile: /profile/<usermame>
	Test (images list from poster): curl -X GET http://localhost:8080/search/<username>
	Test (image): curl -X GET http://localhost:8080/post/<postID>
	Test (profile): curl -X GET http://localhost:8080/profile/<username>

- Put (not finished)
    Put request is used for update.
	Path URL for update user: /profile/<username>
	Path URL for like post: /post/<postID>/like
	Path URL for comment post: /post/<postID>/comment
	Test (update user): curl -X PUT -H "Content-Type: application/json" --data '{"username": "<username>", "password": "<password>", "desc", "<desc>"}
	Test (like): curl -X PUT -H "Content-Type: application/json" --data '{"like": "<username>"}' http://localhost:8080/post/<postID>/like
	Test (comment): curl -X PUT -H "Content-Type: application/json" --data '{"comment": ["<username>", "<commentText>"]}' http://localhost:8080/post/<postID>/comment

- Delete
	Delete request is used for deletion.
    Path URL for delete user: /profile/<username>
	Path URL for delete photo: /post/<postID>
	Test (user): curl -X DELETE http://localhost:8080/profile/<username>
    Test (photo): curl -X DELETE http://localhost:8080/post/<postID>