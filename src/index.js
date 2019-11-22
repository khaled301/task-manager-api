const express = require('express');
require('./db/mongoose');
const userRouter = require('./routers/router-users');
const taskRouter = require('./routers/router-tasks');

const app = express(); //create express app
const port = process.env.PORT;

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
    console.log(`Server is running on PORT : ${port}`);
});

