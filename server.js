const express = require('express');
const fs = require('fs').promises;
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Phục vụ các file tĩnh (HTML, CSS, JS)

// API để lấy dữ liệu từ data.json
app.get('/matches', async (req, res) => {
    try {
        const data = await fs.readFile('data.json', 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        res.status(500).json({ error: 'Error reading data' });
    }
});

// API để lưu dữ liệu vào data.json
app.post('/matches', async (req, res) => {
    try {
        const newData = req.body;
        await fs.writeFile('data.json', JSON.stringify(newData, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Error saving data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});