const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8000;

const mongoURI = 'mongodb+srv://suag4026:botcodon15@cluster0.7sbst.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schema cho địa điểm thi đấu
const venueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sport: { type: String, enum: ['Football', 'Athletics', 'Chess', 'Badminton'], required: true }
});

const Venue = mongoose.model('Venue', venueSchema);

// Schema cho trận đấu
const matchSchema = new mongoose.Schema({
  sport: { type: String, required: true },
  eventType: { type: String, required: true },
  team1: { type: String, required: true },
  team2: { type: String, required: true },
  score: { type: String, default: '' },
  duration: { type: String, default: '' },
  yellowCards: { team1: { type: Number, default: 0 }, team2: { type: Number, default: 0 } },
  redCards: { team1: { type: Number, default: 0 }, team2: { type: Number, default: 0 } },
  time: { type: Date, required: true },
  round: { type: String, required: true },
  status: { type: String, enum: ['Upcoming', 'Completed'], default: 'Upcoming' },
  venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', default: null }
});

const Match = mongoose.model('Match', matchSchema);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// API lấy danh sách địa điểm
app.get('/venues', async (req, res) => {
  try {
    const venues = await Venue.find();
    res.json({ venues });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching venues' });
  }
});

// API thêm địa điểm
app.post('/venues', async (req, res) => {
  try {
    const venueData = req.body;
    const venue = new Venue(venueData);
    await venue.save();
    res.json({ success: true, venue });
  } catch (err) {
    res.status(500).json({ error: 'Error adding venue' });
  }
});

// API lấy danh sách trận đấu
app.get('/matches', async (req, res) => {
  try {
    const matches = await Match.find().populate('venue');
    res.json({ matches });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching matches' });
  }
});

// API thêm trận đấu
app.post('/match', async (req, res) => {
  try {
    const matchData = req.body;

    // Kiểm tra và xử lý trường venue
    if (matchData.venue) {
      if (!mongoose.Types.ObjectId.isValid(matchData.venue)) {
        return res.status(400).json({ error: 'Invalid venue ID format' });
      }
      // Kiểm tra xem venue có tồn tại trong database không
      const venueExists = await Venue.findById(matchData.venue);
      if (!venueExists) {
        return res.status(404).json({ error: 'Venue not found' });
      }
    } else {
      matchData.venue = null; // Nếu không gửi venue, gán null
    }

    const match = new Match(matchData);
    await match.save();
    const populatedMatch = await Match.findById(match._id).populate('venue');
    res.json({ success: true, match: populatedMatch });
  } catch (err) {
    console.error('Error adding match:', err);
    res.status(500).json({ error: 'Error adding match' });
  }
});

// API lấy thông tin trận đấu theo ID
app.get('/match/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid match ID format' });
    }
    const match = await Match.findById(id).populate('venue');
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching match' });
  }
});

// API cập nhật trận đấu
app.put('/match/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const matchData = req.body;

    // Kiểm tra và xử lý trường venue
    if (matchData.venue) {
      if (!mongoose.Types.ObjectId.isValid(matchData.venue)) {
        return res.status(400).json({ error: 'Invalid venue ID format' });
      }
      // Kiểm tra xem venue có tồn tại trong database không
      const venueExists = await Venue.findById(matchData.venue);
      if (!venueExists) {
        return res.status(404).json({ error: 'Venue not found' });
      }
    } else {
      matchData.venue = null; // Nếu không gửi venue, gán null
    }

    const updatedMatch = await Match.findByIdAndUpdate(id, matchData, { new: true }).populate('venue');
    if (!updatedMatch) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json({ success: true, match: updatedMatch });
  } catch (err) {
    console.error('Error updating match:', err);
    res.status(500).json({ error: 'Error updating match' });
  }
});

// API xóa trận đấu
app.delete('/match/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid match ID format' });
    }
    const match = await Match.findByIdAndDelete(id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting match' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});