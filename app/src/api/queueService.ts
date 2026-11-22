import type { QueueOrder, QueueStatus } from "../types/queueTypes"

const URL = `${import.meta.env.VITE_PUBLIC_URL}/queue`

type Queue = {
    orders: QueueOrder[],
    status: QueueStatus
}

const handleResponse = async ( response: Response ) => {
    const data = await response.json()

    if(!response.ok){
        throw new Error(data.message || "Something went wrong")
    }

    return data
}

export const createQueue = async (data : Queue ) => {
    const response = await fetch(`${URL}/`, {
        method: 'POST',
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })

    return handleResponse(response)
}