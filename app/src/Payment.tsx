
import React, { useState } from 'react'

type PaymentType = {
    totalPrice: number;
    paymentMethod: string;
    onConfirm: (cashReceived: number) => void;
    onCancel: () => void;
    cashReceived: number;
    setCashReceived: (cash: number)=> void
}

function Payment({
    totalPrice,
    paymentMethod,
    cashReceived,
    setCashReceived,
    onConfirm,
    onCancel
}: PaymentType) {


    const change = cashReceived - totalPrice;

    const handleConfirm = () => {
        if (cashReceived < totalPrice) {
            alert("Insufficient payment!")
            return;
        }

        setCashReceived(cashReceived)

        onConfirm(cashReceived);
    }

    return (
        <div className="w-full max-w-md bg-white p-5 rounded-xl shadow-lg">

            <h1 className="text-2xl font-bold">
                Payment
            </h1>

            <div className="my-4">
                <p className="text-gray-500">Total Price</p>
                <h1 className="text-3xl font-bold">
                    ₱{totalPrice.toFixed(2)}
                </h1>
            </div>

            <div className="mb-4">
                <p className="text-gray-500">Payment Method</p>
                <h5 className="font-semibold">
                    {paymentMethod}
                </h5>
            </div>

            <div className="mb-4">
                <label className="block mb-2 font-semibold">
                    Cash Received
                </label>

                <input
                    type="number"
                    min="0"
                    value={cashReceived || ""}
                    onChange={(e) =>
                        setCashReceived(Number(e.target.value))
                    }
                    placeholder="Enter amount"
                    className="w-full border p-3 rounded-lg text-black"
                />
            </div>

            <div className="bg-gray-100 p-4 rounded-lg mb-5">
                <p className="text-gray-500">Change</p>

                <h2 className={`text-2xl font-bold ${
                    change < 0 ? "text-red-500" : "text-green-600"
                }`}>
                    ₱{Math.max(0, change).toFixed(2)}
                </h2>

                {change < 0 && (
                    <p className="text-red-500 text-sm">
                        Insufficient payment
                    </p>
                )}
            </div>

            <div className="flex gap-3">
                <button
                    onClick={handleConfirm}
                    disabled={cashReceived < totalPrice}
                    className="flex-1 bg-green-600 text-white p-3 rounded-lg disabled:bg-gray-400"
                >
                    Confirm
                </button>

                <button
                    onClick={onCancel}
                    className="flex-1 bg-gray-200 text-black p-3 rounded-lg"
                >
                    Cancel
                </button>
            </div>

        </div>
    )
}

export default Payment
