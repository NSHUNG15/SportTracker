const mongoose = require('mongoose');
const fs = require('fs').promises;

// Chuỗi kết nối MongoDB
const mongoURI = 'mongodb+srv://suag4026:botcodon15@cluster0.7sbst.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function importData() {
  try {
    // Kết nối tới MongoDB
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB Atlas');

    // Schema cho Match
    const matchSchema = new mongoose.Schema({
      sport: { type: String, required: true },
      eventType: { type: String, required: true },
      team1: { type: String, required: true },
      team2: { type: String, required: true },
      score: { type: String, default: '' },
      duration: { type: String, default: '' },
      yellowCards: {
        team1: { type: Number, default: 0 },
        team2: { type: Number, default: 0 }
      },
      redCards: {
        team1: { type: Number, default: 0 },
        team2: { type: Number, default: 0 }
      },
      time: { type: Date, required: true },
      round: { type: String, required: true },
      status: { type: String, enum: ['Upcoming', 'Completed'], default: 'Upcoming' },
      venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', default: null }
    });
    const Match = mongoose.model('Match', matchSchema);

    // Đọc file data.json
    const rawData = await fs.readFile('data.json', 'utf8');
    const { matches } = JSON.parse(rawData);

    // Kiểm tra xem matches có tồn tại và là mảng không
    if (!matches || !Array.isArray(matches)) {
      throw new Error('data.json must contain a "matches" array');
    }

    // Định dạng lại dữ liệu matches
    const formattedMatches = matches.map(match => ({
      ...match,
      time: new Date(match.time), // Chuyển đổi time thành Date
      venue: match.venue ? new mongoose.Types.ObjectId(match.venue) : null, // Chuyển venue thành ObjectId nếu có
      status: match.score || match.duration ? 'Completed' : 'Upcoming' // Cập nhật status dựa trên score hoặc duration
    }));

    // Xóa dữ liệu cũ trong collection matches
    await Match.deleteMany({});
    console.log('Cleared old matches data');

    // Import matches
    const insertedMatches = await Match.insertMany(formattedMatches);
    console.log('Imported matches:', insertedMatches.length);

    console.log('Data imported successfully');
  } catch (err) {
    console.error('Error importing data:', err);
  } finally {
    // Đóng kết nối MongoDB
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

// Chạy hàm import
importData();