// routes/events.js
const express = require('express');
const Event = require('../models/Event');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/create', authMiddleware, async (req, res) => {
  const { title, description, date, location } = req.body;
  try {
    const event = new Event({
      title,
      description,
      date,
      location,
      organizer: req.user.userId,
    });
    await event.save();
    res.status(201).json({ message: 'Event created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { q, startDate, endDate } = req.query;
    const query = {
      ...(q && {
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } }
        ]
      }),
      ...(startDate && endDate && {
        date: { $gte: new Date(startDate), $lte: new Date(endDate) }
      })
    };
    const events = await Event.find(query).populate('organizer', 'username');
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
