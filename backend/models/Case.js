const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  caseNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Consumer', 'Cyber Crime', 'Women Protection', 'Property', 'Family', 'Criminal', 'Civil', 'Labour', 'Employment', 'RTI', 'Traffic', 'Senior Citizen', 'Banking', 'Insurance', 'Education', 'Medical Negligence', 'Tenant Issues', 'Environment', 'Other']
  },
  status: {
    type: String,
    enum: ['Draft', 'Filed', 'Under Review', 'Hearing', 'Pending', 'Resolved', 'Dismissed', 'Closed'],
    default: 'Draft'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  filedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedLawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedJudge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  courtName: {
    type: String
  },
  courtType: {
    type: String,
    enum: ['District Court', 'High Court', 'Supreme Court', 'Consumer Court', 'Family Court', 'Labor Court', 'Sessions Court', 'Magistrate Court', 'Other']
  },
  filingDate: {
    type: Date
  },
  hearingDates: [{
    date: Date,
    status: { type: String, enum: ['Scheduled', 'Completed', 'Adjourned', 'Cancelled'] },
    notes: String
  }],
  nextHearingDate: {
    type: Date
  },
  resolutionDate: {
    type: Date
  },
  judgment: {
    type: String
  },
  notes: [{
    content: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  tags: [String]
}, {
  timestamps: true
});

// Generate case number before saving
caseSchema.pre('save', async function(next) {
  if (!this.caseNumber && this.status === 'Filed') {
    const count = await this.constructor.countDocuments({ caseNumber: { $exists: true } });
    const year = new Date().getFullYear();
    this.caseNumber = `CASE-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Case', caseSchema);
