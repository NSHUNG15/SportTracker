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

// Schema cho nhóm (bảng A, B, C, D, E, F) - Chỉ dành cho bóng đá
const groupSchema = new mongoose.Schema({
  name: { type: String, enum: ['A', 'B', 'C', 'D', 'E', 'F'], required: true },
  teams: [{ type: String, required: true }]
});

const Group = mongoose.model('Group', groupSchema);

// Schema cho trận đấu
const matchSchema = new mongoose.Schema({
  sport: { type: String, required: true },
  eventType: { type: String, required: true },
  team1: { type: String, required: true },
  team2: { type: String, default: '' }, // Không yêu cầu team2
  score: { type: String, default: '' },
  duration: { type: String, default: '' },
  yellowCards: { team1: { type: Number, default: 0 }, team2: { type: Number, default: 0 } },
  redCards: { team1: { type: Number, default: 0 }, team2: { type: Number, default: 0 } },
  time: { type: Date, required: true },
  round: { type: String, required: true },
  status: { type: String, enum: ['Upcoming', 'Completed'], default: 'Upcoming' },
  venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', default: null },
  group: { type: String, enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', null], default: null }
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

// API lấy danh sách nhóm
app.get('/groups', async (req, res) => {
  try {
    const groups = await Group.find();
    res.json({ groups });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching groups' });
  }
});

// API thêm hoặc cập nhật nhóm
app.post('/groups', async (req, res) => {
  try {
    const { name, teams } = req.body;
    const existingGroup = await Group.findOne({ name });
    if (existingGroup) {
      existingGroup.teams = teams;
      await existingGroup.save();
      res.json({ success: true, group: existingGroup });
    } else {
      const group = new Group({ name, teams });
      await group.save();
      res.json({ success: true, group });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error saving group' });
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
      const venueExists = await Venue.findById(matchData.venue);
      if (!venueExists) {
        return res.status(404).json({ error: 'Venue not found' });
      }
    } else {
      matchData.venue = null;
    }

    // Kiểm tra và xử lý trường group (chỉ cho bóng đá)
    if (matchData.sport === 'Football' && matchData.group) {
      const groupExists = await Group.findOne({ name: matchData.group });
      if (!groupExists) {
        // Tạo group mới nếu chưa tồn tại
        const newGroup = new Group({
          name: matchData.group,
          teams: [matchData.team1, matchData.team2],
        });
        await newGroup.save();
      } else {
        // Cập nhật danh sách đội trong group
        groupExists.teams = [...new Set([...groupExists.teams, matchData.team1, matchData.team2])];
        await groupExists.save();
      }
    } else {
      matchData.group = null;
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

    // Lấy thông tin trận đấu hiện tại
    const currentMatch = await Match.findById(id);
    if (!currentMatch) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Kiểm tra và xử lý trường venue
    if (matchData.venue) {
      if (!mongoose.Types.ObjectId.isValid(matchData.venue)) {
        return res.status(400).json({ error: 'Invalid venue ID format' });
      }
      const venueExists = await Venue.findById(matchData.venue);
      if (!venueExists) {
        return res.status(404).json({ error: 'Venue not found' });
      }
    } else {
      matchData.venue = null;
    }

    // Kiểm tra và xử lý trường group (chỉ cho bóng đá)
    if (matchData.sport === 'Football' && matchData.group) {
      const groupExists = await Group.findOne({ name: matchData.group });
      if (!groupExists) {
        return res.status(404).json({ error: 'Group not found' });
      }
      if (!groupExists.teams.includes(matchData.team1) || (matchData.team2 && !groupExists.teams.includes(matchData.team2))) {
        // Cập nhật danh sách đội trong group
        groupExists.teams = [...new Set([...groupExists.teams, matchData.team1, matchData.team2])].filter(Boolean);
        await groupExists.save();
      }
    } else {
      matchData.group = null;
    }

    // Xử lý group cũ nếu group thay đổi hoặc bị xóa
    if (currentMatch.group && (matchData.group !== currentMatch.group || !matchData.group)) {
      const oldGroup = await Group.findOne({ name: currentMatch.group });
      if (oldGroup) {
        // Kiểm tra xem team1 hoặc team2 cũ có còn trong các trận đấu khác của group không
        const remainingMatches = await Match.find({
          group: currentMatch.group,
          _id: { $ne: id },
        });
        const teamsInOtherMatches = [
          ...new Set(
            remainingMatches.flatMap((m) => [m.team1, m.team2])
          ),
        ];

        // Cập nhật danh sách đội trong group cũ
        oldGroup.teams = oldGroup.teams.filter((team) =>
          teamsInOtherMatches.includes(team)
        );
        await oldGroup.save();
      }
    }

    // Cập nhật trận đấu
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

    // Lấy thông tin trận đấu trước khi xóa
    const match = await Match.findById(id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Xử lý group nếu trận đấu thuộc một group
    if (match.group) {
      const group = await Group.findOne({ name: match.group });
      if (group) {
        // Kiểm tra các trận đấu còn lại trong group
        const remainingMatches = await Match.find({
          group: match.group,
          _id: { $ne: id },
        });
        const teamsInOtherMatches = [
          ...new Set(
            remainingMatches.flatMap((m) => [m.team1, m.team2])
          ),
        ];

        // Cập nhật danh sách đội
        group.teams = group.teams.filter((team) =>
          teamsInOtherMatches.includes(team)
        );
        await group.save();
      }
    }

    // Xóa trận đấu
    await Match.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting match:', err);
    res.status(500).json({ error: 'Error deleting match' });
  }
});

// API lấy bảng xếp hạng theo nhóm
app.get('/group-standings/:groupName', async (req, res) => {
  try {
    const { groupName } = req.params;
    const group = await Group.findOne({ name: groupName });
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const matches = await Match.find({ group: groupName, status: 'Completed', sport: 'Football' });
    const standings = group.teams.map(team => ({
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      yellowCards: 0,
      redCards: 0
    }));

    matches.forEach(match => {
      const [score1, score2] = match.score.split('-').map(Number);
      const team1 = standings.find(s => s.team === match.team1);
      const team2 = standings.find(s => s.team === match.team2);

      team1.played += 1;
      team2.played += 1;
      team1.goalsFor += score1;
      team2.goalsFor += score2;
      team1.goalsAgainst += score2;
      team2.goalsAgainst += score1;
      team1.yellowCards += match.yellowCards.team1;
      team2.yellowCards += match.yellowCards.team2;
      team1.redCards += match.redCards.team1;
      team2.redCards += match.redCards.team2;

      if (score1 > score2) {
        team1.won += 1;
        team1.points += 3;
        team2.lost += 1;
      } else if (score2 > score1) {
        team2.won += 1;
        team2.points += 3;
        team1.lost += 1;
      } else {
        team1.drawn += 1;
        team2.drawn += 1;
        team1.points += 1;
        team2.points += 1;
      }

      team1.goalDifference = team1.goalsFor - team1.goalsAgainst;
      team2.goalDifference = team2.goalsFor - team2.goalsAgainst;
    });

    standings.sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor);

    res.json({ standings });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching group standings' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});