const express = require("express");
const session = require('cookie-session');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');
const dbName = "COMPS381FProject";
const uri = 'mongodb+srv://group:hrtWVuUsBA1TKvpd@cluster0.ctuol90.mongodb.net/COMPS381FProject?retryWrites=true&w=majority';
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const app = express();
const db = client.db(dbName);
const userCollection = db.collection('user');
const postCollection = db.collection('post');

/* for file upload */
const fs = require('fs');
const fileUpload = require('express-fileupload');
app.use(fileUpload());


app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

app.use((req, res, next) => {
    if (req.query.method == "PUT"){
        req.method = "PUT"
    } else if (req.query.method == "DELETE") {
        req.method = "DELETE"
    }
    next();
});


const SECRETKEY = 'testing_secret_key';

app.use(session({
    name: 'loginSession',
    keys: [SECRETKEY]
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


/* index */
app.get('/', async (req, res) => {
    console.log(req.session);
    if (!req.session.authenticated){
        res.redirect('/login');
    } else {
        const userPost = await postCollection.aggregate([{$match: {username: req.session.username}}, {$sort: {date: -1}}]).toArray(); // retrieve post by user from database
        var postLike = null; // initiale value in case user has no posts
        var postComment = null;
        if (userPost.length > 0) { // check if user has post(s)
            postLike = userPost[0].like; // retrieve like array from post
            postComment = userPost[0].comment;
        }
        res.status(200).render('index', {name: req.session.username, userPost: userPost[0], postLike: postLike, postComment: postComment});
    }
});


/* login/logout/register */
app.get('/login', (req, res) => {
    res.status(200).render('login', {msg: ''});
});
app.post('/login', async (req, res) => {
    const userLogin = await userCollection.find({}).toArray();
    userLogin.forEach((user) => {
        if (user.username == req.body.name && user.password == req.body.password) {
            req.session.authenticated = true;
            req.session.username = req.body.name;
        }
    });
    if (!req.session.username) {
        res.render('login', {msg: 'Wrong username or password!'});
    }
    res.redirect('/');
});
app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
});
app.get('/register', (req, res) => {
    res.status(200).render('register', {msg: ''});
});
app.post('/register', async (req, res) => {
    let registerFailPassword = false;
    let registerFailUsername = false;
    const userRegister = await userCollection.find({}).toArray();
    userRegister.forEach((user) => {
        if (req.body.password != req.body.rePassword) {
            registerFailPassword = true;
        } else if (user.username == req.body.name) {
            registerFailUsername = true;
        }
    });
    if (registerFailPassword == true) {
        return res.render('register', {msg: 'Password does not match!'});
    } else if (registerFailUsername == true) {
        return res.render('register', {msg: 'Username already exists!'});
    }
    userCollection.insertOne({username: req.body.name, password: req.body.password, desc: ""});
    if (req.headers['accept'] == 'application/json') {
        res.status(201).json({msg: 'Account successfully created!'});
    } else {
        res.redirect('/login');
    }
});


/* profile */
app.get('/profile/:username', async (req, res) => {
    const user = await userCollection.find({username: req.params.username}).toArray();
    const userPost = await postCollection.aggregate([{$match: {username: req.params.username}}, {$sort: {date: -1}}]).toArray(); // retrieve post by user from database
    var postLike = null; // initiale value in case user has no posts
    var postComment = null;
    if (userPost.length > 0) { // check if user has post(s)
        postLike = userPost[0].like; // retrieve like array from post
        postComment = userPost[0].comment;
    }
    if (req.headers['accept'] == 'application/json') {
        res.status(200).json({user: user[0]});
    } else {
        res.status(200).render('profile', {name: req.session.username, userPost: userPost[0], postLike: postLike, postComment: postComment, user: user[0], msg: ''});
    }
});
/* edit profile */
app.get('/profile/:username/edit', async (req, res) => {
    const user = await userCollection.find({username: req.params.username}).toArray();
    res.status(200).render('editProfile', {name: req.session.username, user: user[0], msg: '', changePasswordRequired: false});
});
app.get('/profile/:username/edit/changePassword', async (req, res) => {
    const user = await userCollection.find({username: req.params.username}).toArray();
    res.status(200).render('editProfile', {name: req.session.username, user: user[0], msg: '', changePasswordRequired: true});
});
app.put('/profile/:username', async (req, res) => {

    // username/description change
    if (req.body.formType == 'editProfile') {
        await userCollection.updateOne({username: req.params.username}, {$set: {username: req.body.newUsername, desc: req.body.newDesc}});
        req.sessionusername = req.body.newUsername;
    } else if (req.body.formType == 'changePassword') {// password change
        const userPasswordVerify = await userCollection.find({username: req.params.username}).toArray();
        if (req.body.oldPassword != userPasswordVerify[0].password) { // check if old password is correct
            return res.status(200).render('editProfile', {name: req.session.username, user: userPasswordVerify[0], msg: 'Old password is incorrect!', changePasswordRequired: true});
        } else if (req.body.oldPassword == req.body.newPassword) { // check if old password = new password
            return res.status(200).render('editProfile', {name: req.session.username, user: userPasswordVerify[0], msg: 'New password cannot be the same as old password!', changePasswordRequired: true});
        } else if (req.body.newPassword != req.body.reNewPassword) { // check if new password = re-enter new password
            return res.status(200).render('editProfile', {name: req.session.username, user: userPasswordVerify[0], msg: 'New password does not match!', changePasswordRequired: true});
        } else { // update password
            await userCollection.updateOne({username: req.params.username}, {$set: {password: req.body.newPassword}});
        }
    }

    const user = await userCollection.find({username: req.params.username}).toArray();
    const userPost = await postCollection.aggregate([{$match: {username: req.params.username}}, {$sort: {date: -1}}]).toArray(); // retrieve post by user from database
    var postLike = null; // initiale value in case user has no posts
    var postComment = null;
    if (userPost.length > 0) { // check if user has post(s)
        postLike = userPost[0].like; // retrieve like array from post
        postComment = userPost[0].comment;
    }
    if (req.headers['accept'] == 'application/json') {
        res.status(200).json({ msg: 'Account successfully updated!', user: user[0]});
    } else {
        res.status(200).render('profile', {name: req.session.username, userPost: userPost[0], postLike: postLike, postComment: postComment, user: user[0], msg: 'Account successfully updated!'});
    }
});
/* delete profile */
app.delete('/profile/:username', (req, res) => {
    userCollection.deleteOne({username: req.params.username});
    postCollection.deleteMany({username: req.params.username});
    postCollection.updateMany({}, {$pull: {like: req.params.username}});
    postCollection.updateMany({}, {$pull: {comment: {$in: [req.params.username]}}}); // not finished
    if (req.headers['accept'] == 'application/json') {
        res.status(200).json({msg: 'Account successfully deleted'});
    } else {
        res.redirect('/logout');
    }
});


/* post */
app.get('/post/:pID', async (req, res) => {
    post = await postCollection.find({_id: new ObjectId(req.params.pID)}).toArray();
    if (!post || post.length == 0) {
        res.status(404).send('Post not found');
        return;
    }
    if (req.headers['accept'] == 'application/json') {
        res.status(200).json({post: post[0]});
    } else {
        res.status(200).render('post', {post: post[0], postLike: post[0].like, postComment: post[0].comment, currentUser: req.session.username});
    }
});
/* like */
app.put('/post/:pID/like', async (req, res) => {
    const likePost = await postCollection.findOne({_id: new ObjectId(req.params.pID)});
    if (likePost.like.includes(req.session.username)) {
        if (req.headers['accept'] == 'application/json') {
            res.status(200).json({msg: 'You disliked this post'});
        } else {
            postCollection.updateOne({_id: new ObjectId(req.params.pID)}, {$pull: {like: req.session.username}});
        }
    } else {
        if (req.headers['accept'] == 'application/json') {
            res.status(200).json({msg: 'You liked this post'});
        } else {
            postCollection.updateOne({_id: new ObjectId(req.params.pID)}, {$push: {like: req.session.username}});
        }
    }
    res.redirect(`/post/${req.params.pID}`);
});
/* comment */
app.put('/post/:pID/comment', async (req, res) => {
    const comment = [req.session.username, req.body.commentText];
    await postCollection.updateOne({_id: new ObjectId(req.params.pID)}, {$push: {comment: comment}});
    if (req.headers['accept'] == 'application/json') {
        res.status(200).json({msg: 'Comment successfully added'});
    } else {
        res.redirect(`/post/${req.params.pID}`);
    }
});
/* delete post */
app.delete('/post/:pID', (req, res) => {
    postCollection.deleteOne({_id: new ObjectId(req.params.pID)}, (err) => {
        if(err) throw err
    });
    if (req.headers['accept'] == 'application/json') {
        res.status(200).json({msg: 'Post successfully deleted'});
    } else {
        res.redirect('/search');
    }
});



/* create */
app.get('/create', (req, res) => {
    res.render('create', { name: req.session.username, msg: '', photo: null });
});

app.post('/create', async (req, res) => {
    const photo = req.files.photo;
        
    const photoData = {
        username: req.session.username,
        filename: photo.name,
        size: photo.size,
        date: new Date(),
        data: new Buffer.from(photo.data).toString('base64'),
        like: [],
        comment: []
    };

    postCollection.insertOne(photoData)
        .then(() => {
            return postCollection.find({username: req.session.username, filename: photo.name}).toArray();
        })
        .then((uploadedPhoto) => {
            if (req.headers['accept'] == 'application/json') {
                
                res.status(201).json({
                    message: 'Photo uploaded successfully!',
                    photo: uploadedPhoto[0]
                });
            } else {
                res.status(200).render('create', { name: req.session.username, msg: 'Photo uploaded successfully!', photo: uploadedPhoto[0] });
            }
        })
        .catch((err) => {
            console.log(err);
            if (req.headers['accept'] == 'application/json') {
                res.status(500).json({
                message: 'Error: Failed to upload photo to the database!',
                photo: null 
            });
            } else {
                res.render('create', { name: req.session.username, msg: 'Error: Failed to upload photo to the database!', photo: null });
            }
        });
});


/* search */
app.get('/search', async (req, res) => {
    const postList = await postCollection.find({}).toArray();
    res.status(200).render('search', {postList: postList, name: req.session.username});
});
app.get('/search/:poster', async (req, res) => {
    const postList = await postCollection.find({username: req.params.poster}).toArray();
    if (req.headers['accept'] == 'application/json') {
        res.status(200).json({postList: postList});
    } else {
        res.status(200).render('search', {postList: postList, name: req.session.username});
    }
});
app.post('/search', (req, res) => {
    const searched = req.body.author
    res.redirect(`/search/${searched}`);
});


app.listen(process.env.PORT || 8080);