const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  filename:         { type: String },
  job_role:         { type: String },
  overall_score:    { type: Number },
  ats_score:        { type: Number },
  clarity_score:    { type: Number },
  keywords_missing: [{ type: String }],
  date:             { type: Date, default: Date.now },
});

module.exports = mongoose.model('History', historySchema);
