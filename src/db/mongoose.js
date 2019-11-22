const mongoose = require('mongoose');

//Provide URL and URL Options
mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
});



