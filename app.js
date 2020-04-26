const express = require('express')
const app = express()
const mongoose = require('mongoose')
const bodyParser = require('body-parser');
const expressHbs = require('express-handlebars');
const passport = require('passport');
const session = require('express-session');
const server = require('http').Server(app)
const io = require('socket.io')(server)
const flash = require('connect-flash')
const {multerConfigImage} = require('./multer')
const cloud = require('./cloudinaryConfig')
const fs = require('fs')
// Load models
const User = require('./models/user')
const pvtMsg = require('./models/pvtMsg')

// load passport
require('./config/passport')(passport);
// Middleware express-session
app.use(session({
secret: 'secret',
resave: true,
saveUninitialized: true
}))

// passport middleware must be after express-session
app.use(passport.initialize());
app.use(passport.session());


// flash middleware
app.use(flash())

// template engines // extname special to mainlayout only and hbs first "extension name" for all layouts but not main
app.engine('hbs', expressHbs({ layoutsDir: 'views/layouts/', defaultLayout: 'main-layout', extname: 'hbs',helpers:{
ifCond : function (v1, operator, v2, options) {

    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
            return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }
}
}})); // since hbs not built in express we have to register hbs engine to express TO USING IT
app.set('view engine', 'hbs'); // we say to node use pug to dynamic templating , "consider the default templating engine"
app.set('views', 'views'); // and their templatings will be at views folder 'default ' thats second paramater , i can change name ,else i don't need it because its the default


// middleware bodyParser
app.use(bodyParser.urlencoded({ limit: '10mb', extended: false }))

app.use(express.static('public'));
app.use('/img',express.static('img'));

// global variables
app.use(function (req, res, next) {
res.locals.error = req.flash('error');
res.locals.user = req.user || null; // This will make a user variable available in all templates, provided that req.user is populated.
next();
})

const users = {}

// Load routes
app.use(require('./routes/users'))
app.use(require('./routes/index'))

app.post('/send-image',multerConfigImage,async (req,res) => {
    try{
      if(!req.file){
        req.flash('error',"You must add an image") 
        return res.redirect(`/private/${req.body.toName}`)
      }
      const result = await cloud.uploads(req.file.path)
  
          // create Date object for current location
          var date = new Date();
          // convert to milliseconds, add local time zone offset and get UTC time in milliseconds
          const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
          // create new Date object for a different timezone using supplied its GMT offset.
          const egyptTime = new Date(utcTime + (3600000 * 2));
          const Date1 = egyptTime.toLocaleTimeString().replace(/:\d+ /, ' ') + ' ' + egyptTime.toDateString().substr(4)
          const newPvtMsg = new pvtMsg ({
            personName: req.body.personName,
            personImageUrl:req.body.personImageUrl,
            message:result.url, 
            type : 'image',
            Date:Date1,
            users:[req.body.toId,req.body.personId]
          })
          await newPvtMsg.save() 
      fs.unlinkSync(req.file.path)
      res.redirect(`/private/${req.body.toName}`)
      io.sockets.to(users[req.body.toName]).emit('send-image',newPvtMsg,req.user._id)
    } catch(err){
      console.error(err)
      req.flash('error',"please try again")
      res.redirect(`/product/all`)
    }
  })
  
const port = process.env.PORT || 3000

// connect db
mongoose.connect('mongodb+srv://remah:remah654312@cluster0-ytypa.mongodb.net/stock?retryWrites=true&w=majority', { useNewUrlParser: true,useUnifiedTopology:true })
  .then(result => {
    console.log('connected!');
  });

server.listen(port, () => {
    console.log(`server started successfully ${port}!`)
  })
  

  io.on('connection', socket => { // fire when we make connection to browser , each client has own socket
  
    // listen for message or event sent from client
    socket.on('chat', data => {
        const newMsg = new message({
            personName: data.personName,
            personImageUrl:data.personImageUrl,
            message:data.msg,
            roomName:data.roomName,
            Date:data.Date1,
            type :data.msg.search('http') != -1 && data.msg.indexOf('http') == 0? 'link' : 'text'
        })
        newMsg.save();
        io.sockets.to(data.roomName).emit('chat',newMsg);
        // socket.to(data.roomName).broadcast.emit('chat', data)
    
    });
    
    socket.on('private',(msg,toName,personName,personImageUrl,personId,toId,Date1)=>{
      const newPvtMsg = new pvtMsg ({
        personName,personImageUrl,message:msg,users :[personId,toId],Date:Date1,type:'text'
      })
      newPvtMsg.save() 
      socket.to(users[toName]).emit('private',msg,personName,personImageUrl)
    })

    socket.on('private-connected',(name)=>{
      users[name] = socket.id
    })
  

  })
  
