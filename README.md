# Image Share
Server-side app for sharing image with the implementation of MongoDB.<br>
Use this link to run: https://localhost:8080
## Login/logout
Default users (username/password):
- Developer: (developer/developer)
- Guest: (guest/guest)
## Register
Register is available with the following constraints:
- No space for username
- Certain format requirement for password (at least 8 characters)
- Password and re-entered password should be identical
## Post
A full page for viewing a post by a user.<br>
User can view their latest post in index, while a link to create posts will be rendered to users without any posts.<br>
In default, the user developer has a post.<br>
Function within a post:
- Like and dislike a post (like Instagram)
- Posting a comment
## Create/upload images
User can upload an image to the database.<br>
There are multiple error handlings:
- No files being upload
- File failed to be uploaded to the database
## Searching
User can search certain images posted by a specific uploader.<br>
In default, images uploaded by all users will be displayed.
## Profile
User can view their own or other's profile.<br>
Content:
- User's name
- User's description
- User's latest post (if any)
User can edit their username and/or description, as well as delete their account. (not implemented)