const Attendance = require('../models/Attendance');
const Student    = require('../models/Student');

// @route GET /api/attendance?date=YYYY-MM-DD
const getAttendance = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    let record = await Attendance.findOne({ warden: req.warden._id, date });

    // Also return student list so frontend can render the full table in one call
    const students = await Student.find({ warden: req.warden._id }).sort({ name: 1 });
    const records  = record ? Object.fromEntries(record.records) : {};

    res.json({ success: true, data: { date, records, students } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PUT /api/attendance  — { date, studentId, status }
const markAttendance = async (req, res) => {
  try {
    const { date, studentId, status } = req.body;
    if (!date || !studentId || !status)
      return res.status(400).json({ success: false, message: 'date, studentId and status are required' });

    const record = await Attendance.findOneAndUpdate(
      { warden: req.warden._id, date },
      { $set: { [`records.${studentId}`]: status } },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: { date, records: Object.fromEntries(record.records) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PUT /api/attendance/bulk  — { date, records: { studentId: status, ... } }
const bulkMarkAttendance = async (req, res) => {
  try {
    const { date, records } = req.body;
    if (!date || !records)
      return res.status(400).json({ success: false, message: 'date and records are required' });

    // Build $set payload for all student entries
    const setPayload = {};
    for (const [studentId, status] of Object.entries(records)) {
      setPayload[`records.${studentId}`] = status;
    }

    const record = await Attendance.findOneAndUpdate(
      { warden: req.warden._id, date },
      { $set: setPayload },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: { date, records: Object.fromEntries(record.records) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/attendance/summary?studentId=xxx&from=YYYY-MM-DD&to=YYYY-MM-DD
const getAttendanceSummary = async (req, res) => {
  try {
    const { studentId, from, to } = req.query;
    if (!studentId) return res.status(400).json({ success: false, message: 'studentId is required' });

    const filter = { warden: req.warden._id };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to)   filter.date.$lte = to;
    }

    const records = await Attendance.find(filter).sort({ date: 1 });
    const summary = { present: 0, absent: 0, leave: 0, total: 0 };
    const detail  = [];

    records.forEach(r => {
      const status = r.records.get(studentId);
      if (status) {
        summary[status]++;
        summary.total++;
        detail.push({ date: r.date, status });
      }
    });

    res.json({ success: true, data: { studentId, summary, detail } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAttendance, markAttendance, bulkMarkAttendance, getAttendanceSummary };
