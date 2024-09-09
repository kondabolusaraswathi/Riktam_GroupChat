// index.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser')
const mongoose = require('mongoose');

const User = require('./models/User');
const Group = require('./models/Group');
const Message = require('./models/Message');

const app = express();
app.use(express.json());
app.use(bodyParser.json())


const JWT_SECRET = "saraswathi";
const dotEnv= require('dotenv')
dotEnv.config()
mongoose.connect(process.env.MONGO_URI)
.then(()=>{
    console.log("connected to mongoDB")
})
.catch((error)=>{
    console.log(`${error}`)
})


// Middleware to check if user is authenticated
const authenticate = (req, res, next) => {
  const userToken = req.headers.authorization;
if(userToken){
  const token = userToken.split(' ')[1]
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send('Invalid Token');
    req.user = user;
    next();
  });
}
  else  res.status(401).send('Access Denied');

  
};

// Middleware to check if user is an admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).send('Admin access only');
  next();
};

// Admin API to create a new user
app.post('/admin/create-user', authenticate, isAdmin, async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const user = new User({ username, password, role });
    await user.save();
    res.status(201).send('User created');
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// User Authentication API
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).send('User not found');

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(400).send('Invalid password');

  const token = jwt.sign({ _id: user._id, role: user.role }, JWT_SECRET);
  res.header('auth-token', token).send(token);
});

// Create a new group
app.post('/group/create', authenticate, async (req, res) => {
  const { name } = req.body;
  try {
    const group = new Group({ name, members: [req.user._id] });
    await group.save();
    res.status(201).send('Group created');
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Add a user to a group
app.post('/group/:id/add-user', authenticate, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  try {
    const group = await Group.findById(id);
    if (!group) return res.status(404).send('Group not found');

    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }
    res.send('User added to group');
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Send a message in a group
app.post('/group/:id/message', authenticate, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  try {
    const message = new Message({ groupId: id, sender: req.user._id, content });
    await message.save();
    res.status(201).send('Message sent');
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Like a message
app.post('/message/:id/like', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const message = await Message.findById(id);
    if (!message) return res.status(404).send('Message not found');

    if (!message.likes.includes(req.user._id)) {
      message.likes.push(req.user._id);
      await message.save();
    }
    res.send('Message liked');
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// unLike a message
app.post('/message/:id/unlike', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const message = await Message.findById(id);
    if (!message) return res.status(404).send('Message not found');

    if (!message.unlikes.includes(req.user._id)) {
      message.unlikes.push(req.user._id);
      await message.save();
    }
    res.send('Message unliked');
  } catch (err) {
    res.status(400).send(err.message);
  }
});

// Delete a user (Admin only)
app.delete('/admin/delete-user/:id', authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).send('User not found');
    res.send('User deleted');
  } catch (err) {
    res.status(400).send(err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));


