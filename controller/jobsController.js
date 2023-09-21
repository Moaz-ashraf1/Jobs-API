const asyncHandler = require("express-async-handler");
const Job = require("../model/jobModel");

exports.getAllJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find();
  res.status(200).json({ jobs, count: jobs.length });
});

exports.getJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findOne({
    _id: req.params.id,
    createdBy: req.currentUser._id,
  });
  res.status(200).json({ job });
});

exports.createJob = asyncHandler(async (req, res) => {
  req.body.createdBy = req.currentUser._id;
  const { company, position, status, createdBy } = req.body;

  const job = await Job.create({
    company,
    position,
    status,
    createdBy,
  });

  res.status(200).json({ job });
});

exports.updateJob = asyncHandler(async (req, res) => {
  const { company, position, status, createdBy } = req.body;

  const job = await Job.findByIdAndUpdate(
    req.params.id,
    {
      company,
      position,
      status,
      createdBy,
    },
    { new: true }
  );

  res.status(200).json({ job });
});

exports.deleteJob = asyncHandler(async (req, res) => {
  await Job.findByIdAndDelete(req.params.id);

  res.status(200).json();
});
