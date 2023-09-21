const express = require("express");

const router = express.Router();
const { protect } = require("../controller/authController");

const {
  getAllJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
} = require("../controller/jobsController");

router.route("/").get(protect, getAllJobs).post(protect, createJob);
router
  .route("/:id")
  .get(protect, getJob)
  .patch(protect, updateJob)
  .delete(protect, deleteJob);
module.exports = router;
