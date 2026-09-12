const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  filename:         { type: String },
  job_role:         { type: String },
  overall_score:    { type: Number },
  ats_score:        { type: Number },
  clarity_score:    { type: Number },
  impact_score:     { type: Number, default: 70 },
  format_score:     { type: Number, default: 75 },
  category_scores:  {
    summary:        { type: Number, default: 70 },
    experience:     { type: Number, default: 65 },
    skills:         { type: Number, default: 75 },
    education:      { type: Number, default: 80 },
  },
  keywords_missing: [{ type: String }],
  date:             { type: Date, default: Date.now },
});

module.exports = mongoose.model('History', historySchema);
