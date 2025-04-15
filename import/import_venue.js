const mongoose = require('mongoose');
const fs = require('fs').promises;

// Chuỗi kết nối MongoDB
const mongoURI = 'mongodb+srv://suag4026:botcodon15@cluster0.7sbst.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function importVenues() {
  try {
    // Kết nối tới MongoDB
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB Atlas');

    // Đọc file data.json
    const rawData = await fs.readFile('data.json', 'utf8');
    const data = JSON.parse(rawData);

    // Kiểm tra xem data.venues có tồn tại và là mảng không
    if (!data.venues || !Array.isArray(data.venues)) {
      throw new Error('data.json must contain a "venues" array');
    }

    // Schema cho Venue
    const venueSchema = new mongoose.Schema({
      _id: { type: mongoose.Schema.Types.ObjectId }, // Giữ nguyên _id nếu có
      name: { type: String, required: true },
      location: { type: String, required: true },
      sport: { type: String, enum: ['Football', 'Athletics', 'Chess', 'Badminton'], required: true }
    });
    const Venue = mongoose.model('Venue', venueSchema);

    // Xóa dữ liệu cũ trong collection venues (tùy chọn)
    await Venue.deleteMany({});
    const deleteResult = await Venue.deleteMany({ sport: 'football' });
    console.log(`Deleted ${deleteResult.deletedCount} football matches`);

    // Chuẩn bị dữ liệu venues với _id
    const venuesToInsert = data.venues.map(venue => ({
      ...venue,
      _id: venue._id ? new mongoose.Types.ObjectId(venue._id) : undefined // Giữ _id nếu có
    }));

    // Import venues
    const insertedVenues = await Venue.insertMany(venuesToInsert);
    console.log('Imported venues:', insertedVenues.length);

    console.log('Venues import completed successfully');
  } catch (error) {
    console.error('Error importing venues:', error);
  } finally {
    // Đóng kết nối MongoDB
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

// Chạy hàm import
importVenues();