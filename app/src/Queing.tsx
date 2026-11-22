import { useEffect, useState } from "react";
import socket from "./socket/socket";
import type { Queue, QueueStatus } from "./types/queueTypes";

const Queing = () => {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [clickedOrders, setClickedOrders] = useState<string[]>([]);

  useEffect(() => {
    const fetchQueues = async () => {
      try {
        const response = await fetch(import.meta.env.VITE_PUBLIC_URL, {
          credentials: "include",
        });

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
          return prev.filter((queue) => queue._id !== updatedQueue._id);
        }

        return prev.map((queue) =>
          queue._id === updatedQueue._id ? updatedQueue : queue
        );
      });
    });

    socket.on("queue:deleted", (deletedId: string) => {
      setQueues((prev) => prev.filter((queue) => queue._id !== deletedId));
    });

    return () => {
      socket.off("queue:new");
      socket.off("queue:updated");
      socket.off("queue:deleted");
    };
  }, []);

  const toggleOrder = (orderKey: string) => {
    setClickedOrders((prev) =>
      prev.includes(orderKey)
        ? prev.filter((key) => key !== orderKey)
        : [...prev, orderKey]
    );
  };

  const changeStatus = async (id: string, status: QueueStatus) => {
    try {
      await fetch(`${import.meta.env.VITE_PUBLIC_URL}/queue/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      console.error("Failed to update queue:", error);
    }
  };

  const activeQueues = queues.filter((q) => q.status !== "done");

  return (
    <div className="w-full p-6">
      <h1 className="mb-6 text-2xl font-bold">Kitchen Display System</h1>

      {activeQueues.length <= 0 && (
        <div className="flex min-h-[50vh] w-full items-center justify-center">
          <p className="text-gray-500">No Queue</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {activeQueues.map((queue) => (
          <div
            key={queue._id}
            className="rounded-sm border bg-white p-5 shadow"
          >
            <h2 className="text-xl font-bold">Queue #{queue.queueNumber}</h2>

            <p className="mb-4 text-gray-500">Status: {queue.status}</p>

            {queue.orders.map((order, index) => {
              const orderKey = `${queue._id}-${index}`;
              const isClicked = clickedOrders.includes(orderKey);

              return (
                <div
                  key={orderKey}
                  onClick={() => toggleOrder(orderKey)}
                  className={`cursor-pointer border-b px-2 py-3 transition-colors ${
                    isClicked
                      ? "bg-emerald-100 text-emerald-950"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <p className="font-semibold">
                    {order.category} {order.productName}
                  </p>

                  <p>
                    {order.quantity} × {order.size}
                  </p>

                  {order.notes && (
                    <p className="text-sm text-gray-500">Notes: {order.notes}</p>
                  )}
                </div>
              );
            })}

            {queue.status === "pending" && (
              <button
                onClick={() => changeStatus(queue._id, "preparing")}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Start Preparing
              </button>
            )}

            {queue.status === "preparing" && (
              <button
                onClick={() => changeStatus(queue._id, "done")}
                className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
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