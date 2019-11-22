const express = require('express');
const router = new express.Router();
const User = require('../models/user');
const auth = require('../middleware/auth');

const multer = require('multer');
const sharp = require('sharp');
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account');



router.get('/test', (req, res) => {
    res.send('This is test router!')
});

router.post('/users', async (req, res) => {

    const user = new User(req.body);

    try {

        await user.save();
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token });

    } catch (e) {
        res.status(400).send(e);
    }

});

router.post('/users/login', async (req, res) => {

    try {

        const user = await User.findByCredentials(req.body.email, req.body.password);
        //Using user Instance as user has already been chosen
        const token = await user.generateAuthToken();

        // res.send({ user: user.getPublicProfile(), token });
        res.send({ user, token });

    } catch (e) {
        res.status(400).send();
    }

});

router.post('/users/logout', auth, async (req, res) => {
    try {

        req.user.tokens = req.user.tokens.filter( token => token.token !== req.token );
        await req.user.save();

        res.send();

    }catch (e) {
        res.status(500).send();
    }
});

router.post('/users/logoutall', auth, async (req, res) => {

    try{
        req.user.tokens = [];
        await req.user.save();
        res.send();
    }catch (e) {
        res.status(500).send();
    }

});

router.get('/users/me', auth, async (req, res) => {

    res.send(req.user);

});


router.patch('/users/me', auth, async (req, res) => {

    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'age', 'password'];
    const isValidOperation = updates.every( update => allowedUpdates.includes(update));

    if (!isValidOperation || ( Object.entries(req.body).length === 0 && (req.body).constructor === Object )){
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {

        updates.forEach( update => req.user[update] = req.body[update]);
        await req.user.save();

        res.status(202).send(req.user);

    } catch (e) {
        res.status(400).send(e);
    }

});

router.delete('/users/me', auth, async (req, res) => {

    try {

        //As user has already been authenticated via auth middleware we can use mongoose operation directly
        await req.user.remove();
        sendCancelationEmail(req.user.email, req.user.name);
        res.send(req.user);

    } catch (e) {
        res.status(500).send(e);
    }
});


const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {

        if(!file.originalname.match(/\.(jpg|jpeg|png)/)){
            return cb(new Error('Please upload a image with the extension jpg, jpeg or png.'))
        }

        cb(undefined, true);
    }
});

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {

    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();

    req.user.avatar = buffer;
    await req.user.save();
    res.send();

}, (error, req, res, next) => {

    res.status(400).send( { error: error.message });

});

router.delete('/users/me/avatar', auth, async (req, res) => {

    req.user.avatar = undefined;
    await req.user.save();
    res.send();

});

router.get('/users/:id/avatar', async (req, res) => {

    try {

        const user = await User.findById(req.params.id);

        if( !user || !user.avatar){
            throw new Error()
        }

        res.set('Content-Type', 'image/png');
        res.send(user.avatar);

    } catch (e) {
        res.status(404).send();
    }

});


module.exports = router;

/**
 *  const updates = Object.keys(updateLogic);
 *  Object.keys() => take object and keys will return a array of strings
 *  where each will be property on this object
 *
 *  new: true => give back the updated user, runValidators => ensure to validate the
 *  const updateOptions = { new:true, runValidators:true };
 *
 *  ES7+ => ( Object.entries(req.body).length === 0 && (req.body).constructor === Object )
 *  Check the given req.body object is empty or not
 */
/**
 * As findByIdAndUpdate() => by Pass Middleware so we should not use this in UPDATE Route
 * rather we should restructure it into small pieces like below
 * const user = await User.findByIdAndUpdate(req.params.id, req.body, { new:true, runValidators:true });
 *
 * As updates Array will hold keys value in string and these will be dynamic input from user
 * so we have to use => [ update ] notation to access and modified it
 *
 *  const user = await User.findById(req.params.id);
 *  updates.forEach( update => user[update] = req.body[update]);
 *
 * await user.save() => will help to execute Middleware as middleware is set on 'save' function in
 * User Model
 *
 *
 *
 * toJSON() => res.send({user}) => user will not hold password & tokens
 * const pet = {
 *    name: "Hal"
 * }
 *
 * pet.toJSON = function() {
 *     return {};
 * }
 *
 * console.log(JSON.stringify(pet))
 *
 * OUTPUT => {}
 *
 * So, when ever we call toJSON() => JSON.strigify would be called and it will show the return value from toJSON() method.
 * its done automatically.
 * Here when ever we use res.send(user) => user will not send password and tokens as in USER model toJSON() is used to cut
 * these values off.
 */
