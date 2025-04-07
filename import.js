const mongoose = require('mongoose');
const fs = require('fs').promises;

async function importData() {
    const mongoURI = 'mongodb+srv://suag4026:botcodon15@cluster0.7sbst.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  await mongoose.connect(mongoURI); // Bỏ các tùy chọn deprecated
  console.log('Connected to MongoDB Atlas');

  const matchSchema = new mongoose.Schema({
    sport: String,
    team1: String,
    team2: String,
    score: String,
    time: Date,
    round: String,
    status: String,
  });
  const Match = mongoose.model('Match', matchSchema);

  const rawData = await fs.readFile('data.json', 'utf8');
  const { matches } = JSON.parse(rawData);

  const formattedMatches = matches.map(match => ({
    ...match,
    time: new Date(match.time),
    status: match.score && match.score !== '' ? 'Completed' : 'Upcoming',
  }));

  await Match.deleteMany({});
  await Match.insertMany(formattedMatches);

  console.log('Data imported successfully');
  mongoose.connection.close();
}

importData().catch(err => console.error('Error importing data:', err));