// routes/events.js
const express = require('express');
const Event = require('../models/Event');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Create a new event
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

// Get all events
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

// Get event details
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'username');
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch event details' });
  }
});

// Participate in an event
router.post('/:id/participate', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (!event.participants.includes(req.user.userId)) {
      event.participants.push(req.user.userId);
      await event.save();
    }

    res.json({ message: 'Successfully participated in the event!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to participate in the event.' });
  }
});

// Get events created by the logged-in user
router.get('/my-events', authMiddleware, async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user.userId });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your events.' });
  }
});

// Update event details
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, description, date, location } = req.body;
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, organizer: req.user.userId }, // Ensure only the creator can update
      { title, description, date, location },
      { new: true }
    );

    if (!event) return res.status(404).json({ error: 'Event not found or unauthorized.' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event.' });
  }
});

// Get event participants
router.get('/:id/participants', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('participants', 'username email');
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    res.json(event.participants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch participants.' });
  }
});

module.exports = router;
