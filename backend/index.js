require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', require('./routes/index'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/exercises', require('./routes/exercises'));
app.use('/api/routines', require('./routes/routines'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/my-routines', require('./routes/myRoutines'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
