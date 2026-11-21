
const Queue = require("../models/QueueModel")
// ==========================================
// CREATE QUEUE
// ==========================================
exports.createQueue = async (req, res) => {
  try {
    const { orders, status } = req.body;

    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return res.status(400).json({
        message: "Orders are required",
      });
    }

    const lastQueue = await Queue.findOne()
      .sort({ createdAt: -1 });

    const nextQueueNumber = lastQueue
      ? lastQueue.queueNumber + 1
      : 1;

    const newQueue = await Queue.create({
      queueNumber: nextQueueNumber,
      orders,
      status: status || "pending",
    });

    const io = req.app.get("io")

    io.emit("queue:new", newQueue)

    console.log("Queue event emitted:", newQueue._id)

    return res.status(201).json({
      message: "Queue created successfully",
      queue: newQueue,
    });

  } catch (error) {
    console.error("Create Queue Error:", error);

    return res.status(500).json({
      message: "Failed to create queue",
      error: error.message,
    });
  }
};



// ==========================================
// GET ALL QUEUES
// ==========================================
exports.getAllQueues = async (req, res) => {
    try {
        const queues = await Queue.find()
            .sort({ createdAt: -1 });

        return res.status(200).json({
            count: queues.length,
            queues
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch queues."
        });
    }
};


// ==========================================
// GET ACTIVE QUEUES
// ==========================================
exports.getActiveQueues = async (req, res) => {
    try {
        const queues = await Queue.find({
            status: { $in: ["pending", "advanced"] }
        }).sort({ createdAt: 1 });

        return res.status(200).json({
            count: queues.length,
            queues
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch active queues."
        });
    }
};


// ==========================================
// GET QUEUE BY ID
// ==========================================
exports.getQueueById = async (req, res) => {
    try {
        const queue = await Queue.findById(req.params.id);

        if (!queue) {
            return res.status(404).json({
                message: "Queue not found."
            });
        }

        return res.status(200).json({ queue });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch queue."
        });
    }
};


// ==========================================
// UPDATE QUEUE STATUS
// ==========================================
exports.updateQueueStatus = async (
  req,
  res
) => {
  try {
    console.log("REQUEST BODY:", req.body);
    console.log("RECEIVED STATUS:", req.body?.status);

    const { status } = req.body || {};

    const allowedStatuses = [
      "pending",
      "preparing",
      "done",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      res.status(400).json({
        message: "Invalid queue status.",
        receivedStatus: status,
        allowedStatuses,
      });
      return;
    }

    const queue = await Queue.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!queue) {
      res.status(404).json({
        message: "Queue not found.",
      });
      return;
    }

    req.app.get("io").emit("queue:updated", queue);

    res.status(200).json({
      message: "Queue updated successfully.",
      queue,
    });

  } catch (error) {
    console.error("Update Queue Error:", error);

    res.status(500).json({
      message: "Failed to update queue.",
    });
  }
};


// ==========================================
// DELETE QUEUE
// ==========================================
exports.deleteQueue = async (req, res) => {
    try {
        const queue = await Queue.findByIdAndDelete(req.params.id);

        if (!queue) {
            return res.status(404).json({
                message: "Queue not found."
            });
        }

        return res.status(200).json({
            message: "Queue deleted successfully."
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to delete queue."
        });
    }
};
