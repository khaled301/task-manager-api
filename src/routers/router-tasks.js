const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');

const router = new express.Router();

router.post('/tasks', auth, async (req, res) => {

    // const task = new Task(req.body);
    const task = new Task({
        ...req.body,
        owner: req.user._id
    });

    try {
        const returnedTask = await task.save();
        res.status(201).send(returnedTask);
    }catch (e) {
        res.status(400).send(e);
    }

});


//skip denotes pagination
//GET / tasks?completed=true
//GET / tasks?limit=10&skip=0
//GET / tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {

    const match = {};
    const sort = {};

    if (req.query.completed){
        //As query string provided will be a string not a boolean value that we need(boolean).
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {

        const parts = req.query.sortBy.split(':');

        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;

    }

    try {
        // const tasks = await Task.find({ owner: req.user._id });
        // await req.user.populate('tasks').execPopulate();
        await req.user.populate({
            path:'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();

        res.status(200).send(req.user.tasks);

    }catch (e) {
        res.status(500).send();
    }

});

router.get('/tasks/:id', auth, async (req, res) => {

    const _id = req.params.id;

    try {

        const task = await Task.findOne({ _id, owner: req.user._id});


        if(!task){
            return res.status(404).send();
        }

        res.send(task);

    }catch (e) {
        res.status(500).send();
    }

});

router.patch('/tasks/:id', auth, async (req, res) => {

    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed'];
    const isValidUpdates = updates.every( update => allowedUpdates.includes(update) );

    if (
        !isValidUpdates
        ||
        ( Object.entries(req.body).length === 0 && (req.body).constructor === Object )
    ) {

        return res.status(400).send({ error: 'Invalid updates!'} );

    }

    try {

        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

        if (!task){
            return res.status(404).send();
        }

        updates.forEach( update => task[update] = req.body[update]);
        await task.save();

        res.status(202).send(task);

    }catch (e) {
        res.status(400).send(e);
    }

});

router.delete('/tasks/:id', auth, async (req, res) => {

    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

        if(!task){
            return res.status(404).send();
        }

        res.send(task);

    }catch (e) {
        res.status(500).send();
    }

});

module.exports = router;
