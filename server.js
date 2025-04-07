const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

const mongoURI = 'mongodb+srv://suag4026:botcodon15@cluster0.7sbst.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

const matchSchema = new mongoose.Schema({
  sport: { type: String, required: true },
  team1: { type: String, required: true },
  team2: { type: String, required: true },
  score: { type: String, default: '' },
  time: { type: Date, required: true },
  round: { type: String, required: true },
  status: { type: String, enum: ['Upcoming', 'Completed'], default: 'Upcoming' },
});

const Match = mongoose.model('Match', matchSchema);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/matches', async (req, res) => {
  try {
    const matches = await Match.find();
    res.json({ matches });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching matches' });
  }
});

app.post('/matches', async (req, res) => {
  try {
    const matches = req.body.matches;
    await Match.deleteMany({});
    await Match.insertMany(matches);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error saving matches' });
  }
});

app.post('/match', async (req, res) => {
  try {
    const matchData = req.body;
    const match = new Match(matchData);
    await match.save();
    res.json({ success: true, match });
  } catch (err) {
    res.status(500).json({ error: 'Error adding match' });
  }
});

app.get('/match/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra xem id có phải ObjectId hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid match ID format' });
    }

    const match = await Match.findById(id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching match' });
  }
});

app.delete('/match/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Match.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting match' });
  }
});

app.put('/match/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedMatch = await Match.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ success: true, match: updatedMatch });
  } catch (err) {
    res.status(500).json({ error: 'Error updating match' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});