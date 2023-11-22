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


/* login/logout/register */
const SECRETKEY = 'testing_secret_key';

app.use(session({
    name: 'loginSession',
    keys: [SECRETKEY]
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
    console.log(req.session);
    if (!req.session.authenticated){
        res.redirect('/login');
    } else {
        const userPost = await postCollection.aggregate([{$match: {username: req.session.username}}, {$sort: {date: -1}}]).toArray(); // retrieve post by user from database
        var postLike = null; // initiale value in case user has no posts
        var postComment = null;
        req.session.postID = null;
        if (userPost.length > 0) { // check if user has post(s)
            postLike = userPost[0].like; // retrieve like array from post
            postComment = userPost[0].comment;
        }
        res.status(200).render('index', {name: req.session.username, userPost: userPost[0], postLike: postLike, postComment: postComment});
    }
});

app.get('/login', (req, res) => {
    res.status(200).render('login', {});
});

app.post('/login', async (req, res) => {
    const userLogin = await userCollection.find({}).toArray();
    userLogin.forEach((user) => {
        if (user.username == req.body.name && user.password == req.body.password) {
            req.session.authenticated = true;
            req.session.username = req.body.name;
        }
    });
    res.redirect('/');
});

app.get('/logout', (req, res) => {
    req.session = null;
    res.redirect('/');
});

app.get('/register', (req, res) => {
    res.status(200).render('register');
});

app.post('/register', async (req, res) => {
    let registerFail = false;
    const userRegister = await userCollection.find({}).toArray();
    userRegister.forEach((user) => {
        if (req.body.password != req.body.rePassword || user.username == req.body.name) {
            registerFail = true;
        }
    });
    if (registerFail == true) {
        res.redirect('/register');
    } else {
        userCollection.insertOne({username: req.body.name, password: req.body.password, desc: ""});
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
    res.status(200).render('profile', {name: req.session.username, userPost: userPost[0], postLike: postLike, postComment: postComment, user: user[0]});
});


/* post */
app.get('/post/:pID', async (req, res) => {
    post = await postCollection.find({_id: new ObjectId(req.params.pID)}).toArray();
    if (!post || post.length == 0) {
        res.status(404).send('Post not found');
        return;
    }
    req.session.postID = req.params.pID;
    const postLike = post[0].like;
    const postComment = post[0].comment;
    res.status(200).render('post', {post: post[0], postLike: postLike, postComment: postComment, currentUser: req.session.username});
});
/* like */
app.post('/like', async (req, res) => {
    const likePost = await postCollection.findOne({_id: new ObjectId(req.session.postID)});
    if (likePost.like.includes(req.session.username)) {
        postCollection.updateOne({_id: new ObjectId(req.session.postID)}, {$pull: {like: req.session.username}}); // not sure why not working properly
    } else {
        postCollection.updateOne({_id: new ObjectId(req.session.postID)}, {$push: {like: req.session.username}});
    }
    res.redirect(`/post/${req.session.postID}`);
});
/* comment */
app.post('/comment', async (req, res) => {
    const comment = [req.session.username, req.body.commentText];
    await postCollection.updateOne({_id: new ObjectId(req.session.postID)}, {$push: {comment: comment}});
    res.redirect(`/post/${req.session.postID}`);
});


/* create */
app.get('/create', (req, res) => {
    res.render('create', { name: req.session.username, msg: '' });
    });
    
app.post('/create', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
    // No file selected
        res.render('create', { name: req.session.username, msg: 'Error: No File Selected!' });
    } else {
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

        postCollection.insertOne(photoData, (err, result) => {
            if (err) {
                console.log(err);
                res.render('create', { name: req.session.username, msg: 'Error: Failed to upload photo to the database!' });
            } else {
                res.render('create', { name: req.session.username, msg: 'File uploaded succesfully!' });
            }
        });
    }
});


/* search */
app.get('/search', async (req, res) => {
    const postList = await postCollection.find({}).toArray();
    res.status(200).render('search', {postList: postList, name: req.session.username});
});
app.get('/search/:poster', async (req, res) => {
    const postList = await postCollection.find({username: req.params.poster}).toArray();
    res.status(200).render('search', {postList: postList, name: req.session.username});
});
app.post('/search', (req, res) => {
    const searched = req.body.author
    res.redirect(`/search/${searched}`);
});


/* Delete */
app.get('/post/delete/:pID', (req, res) => {
    postCollection.deleteOne({_id: new ObjectId(req.params.pID)}, (err,result) => {
        if(err) throw err
        res.send('photo is deleted');
    });
    res.redirect('/search');
});

/* Other functions go here */

app.listen(process.env.PORT || 8080);