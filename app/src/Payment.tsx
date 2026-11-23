
import { useState } from "react";
import { paymentOptions, type PaymentMethod } from "./Payment";

type PaymentType = {
    totalPrice: number;
    paymentMethod: PaymentMethod;
    onConfirm: (
        cashReceived: number,
        paymentMethod: PaymentMethod
    ) => void;
    onCancel: () => void;
    cashReceived: number;
    setCashReceived: (cash: number) => void;
};

function Payment({
    totalPrice,
    paymentMethod,
    cashReceived,
    setCashReceived,
    onConfirm,
    onCancel
}: PaymentType) {

    const [payment, setPayment] =
        useState<PaymentMethod>(paymentMethod);

    let change = cashReceived - totalPrice;
    const isCash = payment === "Cash";

    const handleConfirm = () => {

        if (isCash && cashReceived < totalPrice) {
            alert("Insufficient payment!");
            return;
        }

        onConfirm(
            isCash ? cashReceived : 0,
            payment
        );

        setCashReceived(0)

        change = 0
    };

    return (
        <div className="w-full max-w-md bg-green-900 text-white p-5 rounded-xl shadow-lg">

            <h1 className="text-2xl font-bold">
                Payment
            </h1>

            {/* Total */}
            <div className="my-4">
                <p className="text-gray-300">Total Price</p>
                <h1 className="text-3xl font-bold">
                    ₱{totalPrice.toFixed(2)}
                </h1>
            </div>

            {/* Payment Method */}
            <div className="mb-4">
                <p className="text-gray-300">Payment Method</p>

                <div className="flex flex-wrap gap-3 mt-2">
                    {paymentOptions.map((item) => (
                        <label
                            key={item}
                            className={`flex gap-2 px-3 py-2 rounded-md cursor-pointer ${
                                payment === item
                                    ? "bg-blue-600"
                                    : "bg-gray-500"
                            }`}
                        >
                            <input
                                type="radio"
                                name="paymentMethod"
                                value={item}
                                checked={payment === item}
                                onChange={() => {
                                    setPayment(item);
                                    setCashReceived(0);
                                }}
                            />

                            {item}
                        </label>
                    ))}
                </div>
            </div>

            {/* Cash Payment */}
            {isCash ? (
                <>
                    <div className="mb-4">
                        <label className="block mb-2 font-semibold">
                            Cash Received
                        </label>

                        <input
                            type="number"
                            min="0"
                            value={cashReceived || ""}
                            onChange={(e) =>
                                setCashReceived(
                                    Number(e.target.value)
                                )
                            }
                            placeholder="Enter amount"
                            className="w-full border p-3 rounded-lg text-white"
                        />
                    </div>

                    <div className="bg-gray-100 p-4 rounded-lg mb-5">
                        <p className="text-gray-500">Change</p>

                        <h2 className={`text-2xl font-bold ${
                            change < 0
                                ? "text-red-500"
                                : "text-green-600"
                        }`}>
                            ₱{Math.max(0, change).toFixed(2)}
                        </h2>

                        {change < 0 && (
                            <p className="text-red-500 text-sm">
                                Insufficient payment
                            </p>
                        )}
                    </div>
                </>
            ) : (
                <div className="bg-white text-gray-800 p-4 rounded-lg mb-5">
                    <h3 className="font-semibold">
                        Online Payment
                    </h3>
                    <p className="text-sm text-gray-500">
                        You will be redirected to the payment
                        gateway to complete your transaction.
                    </p>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={handleConfirm}
                    disabled={isCash && cashReceived < totalPrice}
                    className="flex-1 bg-green-600 text-white p-3 rounded-lg disabled:bg-gray-400"
                >
                    {isCash ? "Confirm Payment" : "Proceed to Payment"}
                </button>

                <button
                    onClick={onCancel}
                    className="flex-1 bg-gray-200 text-black p-3 rounded-lg"
                >
                    Cancel
                </button>
            </div>

        </div>
    );
}

export default Payment;
