const express = require("express")

const {
    createQueue,
    getAllQueues,
    getQueueById,
    getActiveQueues,
    updateQueueStatus,
    deleteQueue
} = require("../controllers/queueController.js")

const router = express.Router()

router.post('/', createQueue)

router.get('/', getAllQueues)

router.get('/:id', getQueueById)

router.get('/active-queue', getActiveQueues)

router.patch("/:id/status", updateQueueStatus);

router.delete("/:id", deleteQueue);

module.exports = router