import { useEffect, useState } from "react";
import socket from "./socket/socket";
import type { Queue, QueueStatus } from "./types/queueTypes";

const Queing = () => {
  const [queues, setQueues] = useState<Queue[]>([]);

  useEffect(() => {
    const fetchQueues = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/queue ",
          { credentials: "include" }
        );

        const data = await response.json();

        setQueues(data.queues || []);
      } catch (error) {
        console.error("Failed to fetch queues:", error);
      }
    };

    fetchQueues();

    socket.on("queue:new", (newQueue: Queue) => {
      setQueues((prev) => [
        ...prev.filter((queue) => queue._id !== newQueue._id),
        newQueue,
      ]);
    });

    socket.on("queue:updated", (updatedQueue: Queue) => {
      setQueues((prev) => {
        if (updatedQueue.status === "done") {
          return prev.filter(
            (queue) => queue._id !== updatedQueue._id
          );
        }

        return prev.map((queue) =>
          queue._id === updatedQueue._id
            ? updatedQueue
            : queue
        );
      });
    });

    socket.on("queue:deleted", (deletedId: string) => {
      setQueues((prev) =>
        prev.filter((queue) => queue._id !== deletedId)
      );
    });

    return () => {
      socket.off("queue:new");
      socket.off("queue:updated");
      socket.off("queue:deleted");
    };
  }, []);

  const changeStatus = async (
    id: string,
    status: QueueStatus
  ) => {
    try {
      await fetch(
        `http://localhost:5000/api/queue/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ status }),
        }
      );
    } catch (error) {
      console.error("Failed to update queue:", error);
    }
  };

  return (
    <div className="w-full p-6">
      <h1 className="text-2xl font-bold mb-6">
        Order Display System
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {queues.filter(q => q.status !== "done").map((queue) => (
          <div
            key={queue._id}
            className="bg-white rounded-sm shadow p-5 border"
          >
            <h2 className="text-xl font-bold">
              Queue #{queue.queueNumber}
            </h2>

            <p className="text-gray-500 mb-4">
              Status: {queue.status}
            </p>

            {queue.orders.map((order, index) => (
              <div
                key={index}
                className="border-b py-3"
              >
                <p className="font-semibold">
                  {order.productName}
                </p>

                <p>
                  {order.quantity} × {order.size}
                </p>

                {order.notes && (
                  <p className="text-sm text-gray-500">
                    Notes: {order.notes}
                  </p>
                )}
              </div>
            ))}

            {queue.status === "pending" && (
              <button
                onClick={() =>
                  changeStatus(queue._id, "preparing")
                }
                className="bg-blue-600 text-white px-4 py-2 rounded-lg mt-4"
              >
                Start Preparing
              </button>
            )}

            {queue.status === "preparing" && (
              <button
                onClick={() =>
                  changeStatus(queue._id, "done")
                }
                className="bg-green-600 text-white px-4 py-2 rounded-lg mt-4"
              >
                Mark as Done
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Queing;